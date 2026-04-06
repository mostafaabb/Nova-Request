const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.executeRequest = async (req, res, next) => {
  try {
    const { method, url, headers, body, timeout = 30000, saveToHistory = true, endpointId } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const startTime = Date.now();

    // Build request config
    const config = {
      method: method || 'GET',
      url,
      timeout,
      validateStatus: () => true, // Don't throw on any status
      headers: {}
    };

    // Add headers
    if (headers && Array.isArray(headers)) {
      headers.forEach(h => {
        if (h.key && h.enabled !== false) {
          config.headers[h.key] = h.value;
        }
      });
    }

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      config.data = body;
      
      // Set Content-Type if not already set
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    // Execute request
    let response;
    try {
      response = await axios(config);
    } catch (axiosError) {
      // Handle network errors
      const responseTime = Date.now() - startTime;
      
      return res.json({
        success: false,
        error: {
          message: axiosError.message,
          code: axiosError.code
        },
        responseTime
      });
    }

    const responseTime = Date.now() - startTime;

    // Format response
    const result = {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime
    };

    // Save to history if user is logged in
    if (saveToHistory && req.userId) {
      try {
        await prisma.requestHistory.create({
          data: {
            userId: req.userId,
            endpointId: endpointId || null,
            method: config.method,
            url,
            headers: JSON.stringify(headers || []),
            body: typeof body === 'string' ? body : JSON.stringify(body),
            responseStatus: response.status,
            responseBody: typeof response.data === 'string' 
              ? response.data.substring(0, 50000) // Limit stored response
              : JSON.stringify(response.data).substring(0, 50000),
            responseHeaders: JSON.stringify(response.headers),
            responseTime
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