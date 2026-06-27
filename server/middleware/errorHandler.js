function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === "production";
  const message = !isProd || status < 500 ? (err.message || "Server error") : "Server error";
  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
