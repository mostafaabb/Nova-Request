const axios = require('axios');
const https = require('https');
const { PrismaClient } = require('@prisma/client');
const { resolveUrl, resolveHeaders, resolveBody } = require('../utils/variableResolver');
const { executeScript } = require('../utils/scriptExecutor');
const { runTests } = require('../utils/testRunner');
const prisma = new PrismaClient();

exports.executeRequest = async (req, res, next) => {
  try {
    const {
      method,
      url,
      headers,
      body,
      timeout = 30000,
      saveToHistory = true,
      endpointId,
      allowInsecure,
      preRequestScript,
      postRequestScript,
      tests,
      environmentVariables = {}
    } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Resolve variables
    let resolvedUrl = resolveUrl(url, environmentVariables);
    let resolvedHeaders = resolveHeaders(headers || [], environmentVariables);
    let resolvedBody = resolveBody(body, environmentVariables);

    // Execute pre-request script
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
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    if (!allowedMethods.includes(normalizedMethod)) {
      return res.status(400).json({ error: 'Invalid HTTP method' });
    }

    const numericTimeout = Number(timeout);
    if (Number.isNaN(numericTimeout)) {
      return res.status(400).json({ error: 'Invalid timeout value' });
    }
    const clampedTimeout = Math.min(Math.max(numericTimeout, 1000), 60000);

    const startTime = Date.now();

    // Build request config
    const config = {
      method: normalizedMethod,
      url: resolvedUrl,
      timeout: clampedTimeout,
      validateStatus: () => true,
      headers: {}
    };

    if ((allowInsecure || process.env.ALLOW_INSECURE_TLS === 'true') && resolvedUrl.startsWith('https://')) {
      config.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }

    // Add headers
    if (resolvedHeaders && Array.isArray(resolvedHeaders)) {
      resolvedHeaders.forEach(h => {
        if (h.key && h.enabled !== false) {
          config.headers[h.key] = h.value;
        }
      });
    }

    // Add body for non-GET requests
    if (resolvedBody && normalizedMethod !== 'GET') {
      config.data = resolvedBody;
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    // Execute request
    let response;
    let networkError = null;
    try {
      response = await axios(config);
    } catch (axiosError) {
      networkError = axiosError.message;
      const responseTime = Date.now() - startTime;
      return res.json({
        success: false,
        error: { message: axiosError.message, code: axiosError.code },
        responseTime
      });
    }

    const responseTime = Date.now() - startTime;

    // Execute post-request script
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

    // Run tests
    let testResults = { passed: 0, failed: 0, results: [] };
    if (tests && tests.length > 0) {
      testResults = runTests(response, tests);
    }

    // Format response
    const result = {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime,
      tests: testResults,
      scripts: {
        preRequest: { error: scriptError },
        postRequest: { error: postScriptError }
      }
    };

    // Save to history
    if (saveToHistory && req.userId) {
      try {
        await prisma.requestHistory.create({
          data: {
            userId: req.userId,
            workspaceId: req.workspaceId || null,
            endpointId: endpointId || null,
            method: config.method,
            url: resolvedUrl,
            headers: JSON.stringify(headers || []),
            body: typeof body === 'string' ? body : JSON.stringify(body),
            responseStatus: response.status,
            responseBody: typeof response.data === 'string'
              ? response.data.substring(0, 50000)
              : JSON.stringify(response.data).substring(0, 50000),
            responseHeaders: JSON.stringify(response.headers),
            responseTime,
            testResults: JSON.stringify(testResults)
          }
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
