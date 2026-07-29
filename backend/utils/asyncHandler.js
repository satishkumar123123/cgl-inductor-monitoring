/**
 * Wraps an async Express handler so rejected promises are forwarded to
 * next(err) automatically, instead of every controller repeating its own
 * try/catch. New controllers should use this; existing ones already have
 * explicit try/catch and work fine as-is.
 *
 * Usage: router.get("/", asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
