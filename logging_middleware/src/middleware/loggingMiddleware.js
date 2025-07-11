const { Log } = require('../utils/log');

function loggingMiddleware(req, res, next) {
  Log("backend", "info", "request", `${req.method} ${req.url}`);
  next();
}

module.exports = { loggingMiddleware };
