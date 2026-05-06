const { env } = require('../config/env');

function errorHandler(err, req, res, next) {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    status = 400;
    const details = Object.values(err.errors || {}).map((e) => e.message);
    message = details.length ? details.join('; ') : message;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id or field value';
  }

  if (env.nodeEnv !== 'test') {
    console.error(err);
  }

  res.status(status).json({
    error: {
      message,
      ...(env.nodeEnv === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = { errorHandler };
