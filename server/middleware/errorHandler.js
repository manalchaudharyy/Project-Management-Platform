const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  console.error(err.stack);
  res.status(statusCode).json({
    success: false,
    data: null,
    message: err.message || "Server error",
  });
};

module.exports = { notFound, errorHandler };