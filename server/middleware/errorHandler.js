const multer = require("multer");

const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large (max 10MB)"
        : err.message || "Invalid file upload";
    return res.status(400).json({ success: false, data: null, message });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  console.error(err.stack);
  res.status(statusCode).json({
    success: false,
    data: null,
    message: err.message || "Server error",
  });
};

module.exports = { notFound, errorHandler };