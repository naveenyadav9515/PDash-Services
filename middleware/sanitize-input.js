const BLOCKED_KEY_PATTERN = /(^\$)|(\.)/;

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!value || typeof value !== 'object' || value instanceof Date) {
    return value;
  }

  return Object.entries(value).reduce((clean, [key, nestedValue]) => {
    if (!BLOCKED_KEY_PATTERN.test(key)) {
      clean[key] = sanitizeValue(nestedValue);
    }
    return clean;
  }, {});
}

module.exports = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};
