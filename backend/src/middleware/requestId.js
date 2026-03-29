const { v4: uuidv4 } = require('uuid');

// Attach unique request ID to each request
const requestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

module.exports = { requestId };