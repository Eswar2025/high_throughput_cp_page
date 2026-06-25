function getResponseTimeMs(res) {
  const startedAt = res.locals.startedAt || Date.now();
  return Date.now() - startedAt;
}

function sendSuccess(res, options = {}) {
  const body = {
    success: true,
    responseTimeMs: getResponseTimeMs(res),
    data: options.data || {},
  };

  if (options.source) {
    body.source = options.source;
    res.locals.source = options.source;
  }

  if (options.warning) {
    body.warning = options.warning;
  }

  if (options.extra) {
    Object.assign(body, options.extra);
  }

  return res.status(options.statusCode || 200).json(body);
}

function sendError(res, statusCode, code, message) {
  res.locals.errorCode = code;

  return res.status(statusCode).json({
    success: false,
    responseTimeMs: getResponseTimeMs(res),
    error: {
      code,
      message,
    },
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
