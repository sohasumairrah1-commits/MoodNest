function notFound(req, res) {
  res.status(404).json({ error: "That endpoint does not exist." });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error("Request failed:", error?.message || "Unknown error");
  const status = Number(error.status) || 500;
  const safeMessage = status < 500 ? error.message : "Something went wrong. Please try again.";
  res.status(status).json({ error: safeMessage });
}

module.exports = { notFound, errorHandler };