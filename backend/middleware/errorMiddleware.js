function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err.stack);

  let status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  let message = err.message || "Internal server error";

  // Mongoose-specific errors get mapped to the correct client-error status
  // instead of falling through to a generic 500.
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors || {}).map((e) => e.message).join(", ") || message;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `A record with this ${field} already exists` : "Duplicate record";
  }

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
