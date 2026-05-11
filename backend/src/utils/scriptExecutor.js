const { VM } = require('vm2');

const executeScript = (script, context = {}) => {
  if (!script || !script.trim()) {
    return { success: true, result: null, error: null };
  }

  try {
    const sandbox = {
      request: context.request || {},
      response: context.response || {},
      environment: context.environment || {},
      ...context.utils,
    };

    const vm = new VM({
      timeout: 5000,
      sandbox,
    });

    const result = vm.run(script);
    return { success: true, result, error: null };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error.message || String(error),
    };
  }
};

module.exports = { executeScript };
