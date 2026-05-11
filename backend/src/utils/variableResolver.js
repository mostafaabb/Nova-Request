const resolveVariables = (text, variables = {}) => {
  if (!text || typeof text !== 'string') return text;

  let result = text;
  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(pattern, String(value || ''));
  });
  return result;
};

const resolveUrl = (url, variables = {}) => resolveVariables(url, variables);

const resolveHeaders = (headers = [], variables = {}) => {
  if (!Array.isArray(headers)) return headers;
  return headers.map(header => ({
    ...header,
    key: resolveVariables(header.key, variables),
    value: resolveVariables(header.value, variables),
  }));
};

const resolveBody = (body, variables = {}) => {
  if (!body) return body;
  if (typeof body === 'string') {
    return resolveVariables(body, variables);
  }
  if (typeof body === 'object') {
    return JSON.parse(JSON.stringify(body).split(/{{(\w+)}}/g).reduce((acc, part, i) => {
      if (i % 2 === 1 && variables[part]) {
        acc += variables[part];
      } else {
        acc += part;
      }
      return acc;
    }, ''));
  }
  return body;
};

module.exports = {
  resolveVariables,
  resolveUrl,
  resolveHeaders,
  resolveBody,
};
