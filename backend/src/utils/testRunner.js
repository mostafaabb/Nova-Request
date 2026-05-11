const evaluateAssertion = (response, test) => {
  const { path, operator, value, name } = test;
  let actual;

  try {
    // Simple JSONPath evaluation
    if (path === 'status') {
      actual = response.status;
    } else if (path === 'headers') {
      actual = response.headers;
    } else if (path.startsWith('$.')) {
      const keys = path.substring(2).split('.');
      actual = response.data;
      for (const key of keys) {
        actual = actual?.[key];
      }
    } else {
      actual = response.data?.[path];
    }

    let passed = false;
    switch (operator) {
      case 'equals':
        passed = actual == value;
        break;
      case 'notEquals':
        passed = actual != value;
        break;
      case 'contains':
        passed = String(actual).includes(String(value));
        break;
      case 'notContains':
        passed = !String(actual).includes(String(value));
        break;
      case 'greaterThan':
        passed = Number(actual) > Number(value);
        break;
      case 'lessThan':
        passed = Number(actual) < Number(value);
        break;
      case 'exists':
        passed = actual !== undefined && actual !== null;
        break;
      case 'notExists':
        passed = actual === undefined || actual === null;
        break;
      case 'isType':
        passed = typeof actual === value;
        break;
      default:
        passed = false;
    }

    return {
      name: name || path,
      operator,
      expected: value,
      actual,
      passed,
      error: null,
    };
  } catch (error) {
    return {
      name: name || path,
      operator,
      expected: value,
      actual: undefined,
      passed: false,
      error: error.message,
    };
  }
};

const runTests = (response, tests) => {
  if (!tests || !Array.isArray(tests) || tests.length === 0) {
    return { passed: 0, failed: 0, results: [] };
  }

  const results = tests.map(test => evaluateAssertion(response, test));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return { passed, failed, results, allPassed: failed === 0 };
};

module.exports = { runTests, evaluateAssertion };
