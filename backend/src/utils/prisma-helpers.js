const JSON_FIELDS = ['headers', 'queryParams', 'tags', 'responseHeaders'];

const parseJsonFields = (data) => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(parseJsonFields);
  }
  
  const result = { ...data };
  for (const field of JSON_FIELDS) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
  }
  return result;
};

const stringifyJsonFields = (data) => {
  if (!data) return data;
  
  const result = { ...data };
  for (const field of JSON_FIELDS) {
    if (result[field] !== undefined && typeof result[field] !== 'string') {
      result[field] = JSON.stringify(result[field]);
    }
  }
  return result;
};

module.exports = {
  parseJsonFields,
  stringifyJsonFields
};
