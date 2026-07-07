// Wraps async route handlers so rejected promises reach the error
// middleware instead of crashing the process or hanging the request.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Our own error type for EXPECTED failures (bad input, not found,
// wrong password). Carries an HTTP status + a flag that says
// "this message is safe to show the user".
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}