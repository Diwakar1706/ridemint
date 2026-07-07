import logger from "../utils/logger.js";

// The 4-argument signature is how Express recognizes error middleware.
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  // Operational errors: show real message. Bugs: hide details, log everything.
  const message = err.isOperational ? err.message : "Internal Server Error";
  if (!err.isOperational) logger.error("Unhandled error:", err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;