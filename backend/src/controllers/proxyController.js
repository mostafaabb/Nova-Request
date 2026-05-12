const axios = require('axios');
const https = require('https');
const FormData = require('form-data');
const { nanoid } = require('nanoid');
const { PrismaClient } = require('@prisma/client');
const {
  resolveUrl,
  resolveHeaders,
  resolveBody,
  resolveKeyValueRows,
} = require('../utils/variableResolver');
const { executeScript } = require('../utils/scriptExecutor');
const { runTests } = require('../utils/testRunner');
const prisma = new PrismaClient();

const normalizeTests = (tests) => {
  if (!tests) return [];
  if (Array.isArray(tests)) return tests;
  if (typeof tests === 'string') {
    try {
      const parsed = JSON.parse(tests);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

exports.executeRequest = async (req, res, next) => {
  const requestId = nanoid(12);

  try {
    const {
      method,
      url,
      headers,
      body,
      bodyType: rawBodyType = 'json',
      formFields: rawFormFields,
      timeout = 30000,
      saveToHistory = true,
      endpointId,
      allowInsecure,
      preRequestScript,
      postRequestScript,
      tests,
      environmentVariables = {},
    } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required', requestId });
    }

    let resolvedUrl = resolveUrl(url, environmentVariables);
    let resolvedHeaders = resolveHeaders(headers || [], environmentVariables);
    let resolvedBody = resolveBody(body, environmentVariables);
    const bodyType = String(rawBodyType || 'json').toLowerCase();
    const resolvedFormFields = resolveKeyValueRows(rawFormFields || [], environmentVariables);
    const testsList = normalizeTests(tests);

    let scriptError = null;
    if (preRequestScript) {
      const scriptResult = executeScript(preRequestScript, {
        request: { url: resolvedUrl, headers: resolvedHeaders, body: resolvedBody },
        environment: environmentVariables,
      });
      if (!scriptResult.success) {
        scriptError = scriptResult.error;
      }
    }

    const normalizedMethod = (method || 'GET').toUpperCase();
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!allowedMethods.includes(normalizedMethod)) {
      return res.status(400).json({ error: 'Invalid HTTP method', requestId });
    }

    const numericTimeout = Number(timeout);
    if (Number.isNaN(numericTimeout)) {
      return res.status(400).json({ error: 'Invalid timeout value', requestId });
    }
    const clampedTimeout = Math.min(Math.max(numericTimeout, 1000), 60000);

    const startTime = Date.now();

    const config = {
      method: normalizedMethod,
      url: resolvedUrl,
      timeout: clampedTimeout,
      validateStatus: () => true,
      headers: {},
    };

    if ((allowInsecure || process.env.ALLOW_INSECURE_TLS === 'true') && resolvedUrl.startsWith('https://')) {
      config.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }

    if (resolvedHeaders && Array.isArray(resolvedHeaders)) {
      resolvedHeaders.forEach((h) => {
        if (h.key && h.enabled !== false) {
          config.headers[h.key] = h.value;
        }
      });
    }

    const sendsBody = !['GET', 'HEAD'].includes(normalizedMethod);
    const enabledFormRows = resolvedFormFields.filter((f) => f.enabled !== false && f.key);

    if (sendsBody) {
      if ((bodyType === 'form-data' || bodyType === 'multipart/form-data') && enabledFormRows.length > 0) {
        const form = new FormData();
        enabledFormRows.forEach((f) => {
          form.append(f.key, f.value ?? '');
        });
        config.data = form;
        Object.assign(config.headers, form.getHeaders());
      } else if (bodyType === 'x-www-form-urlencoded' && enabledFormRows.length > 0) {
        const params = new URLSearchParams();
        enabledFormRows.forEach((f) => {
          params.append(f.key, f.value ?? '');
        });
        config.data = params.toString();
        if (!config.headers['Content-Type'] && !config.headers['content-type']) {
          config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      } else if (bodyType !== 'none' && resolvedBody) {
        config.data = resolvedBody;
        const hasCt = config.headers['Content-Type'] || config.headers['content-type'];
        if (!hasCt) {
          if (bodyType === 'raw') {
            config.headers['Content-Type'] = 'text/plain';
          } else {
            config.headers['Content-Type'] = 'application/json';
          }
        }
      }
    }

    let response;
    try {
      response = await axios(config);
    } catch (axiosError) {
      const responseTime = Date.now() - startTime;
      return res.json({
        success: false,
        error: { message: axiosError.message, code: axiosError.code },
        responseTime,
        requestId,
      });
    }

    const responseTime = Date.now() - startTime;

    let postScriptError = null;
    if (postRequestScript) {
      const scriptResult = executeScript(postRequestScript, {
        request: { url: resolvedUrl, headers: resolvedHeaders, body: resolvedBody },
        response: { status: response.status, data: response.data, headers: response.headers },
        environment: environmentVariables,
      });
      if (!scriptResult.success) {
        postScriptError = scriptResult.error;
      }
    }

    let testResults = { passed: 0, failed: 0, results: [] };
    if (testsList.length > 0) {
      testResults = runTests(response, testsList);
    }

    const result = {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime,
      tests: testResults,
      requestId,
      scripts: {
        preRequest: { error: scriptError },
        postRequest: { error: postScriptError },
      },
    };

    if (saveToHistory && req.userId) {
      try {
        const historyBody =
          sendsBody && (bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded')
            ? JSON.stringify({ bodyType, formFields: rawFormFields || [] })
            : typeof body === 'string'
              ? body
              : JSON.stringify(body ?? '');

        await prisma.requestHistory.create({
          data: {
            userId: req.userId,
            workspaceId: req.workspaceId || null,
            endpointId: endpointId || null,
            method: config.method,
            url: resolvedUrl,
            headers: JSON.stringify(headers || []),
            body: historyBody,
            responseStatus: response.status,
            responseBody:
              typeof response.data === 'string'
                ? response.data.substring(0, 50000)
                : JSON.stringify(response.data).substring(0, 50000),
            responseHeaders: JSON.stringify(response.headers),
            responseTime,
            testResults: JSON.stringify(testResults),
          },
        });
      } catch (historyError) {
        console.error('Failed to save history:', historyError);
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};
