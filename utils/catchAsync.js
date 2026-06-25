/**
 * Wraps async route handlers to automatically catch rejections
 * and pass them to the Express error handling middleware.
 * Eliminates the need for repetitive try/catch blocks in controllers.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    // Execute the async function, catch any errors, and pass them to next()
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
