const jwt = require("jsonwebtoken");


function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function getInvoiceBaseUrl() {
  const base = normalizeBaseUrl(process.env.PUBLIC_API_URL || "");
  if (!base) {
    throw new Error("PUBLIC_API_URL missing");
  }
  return base;
}

function createInvoiceToken(orderId) {
  const secret = process.env.JWT_SECRET || "";
  if (!secret) {
    throw new Error("JWT_SECRET missing");
  }
  return jwt.sign({ orderId }, secret, { expiresIn: '7d' });
}

function verifyInvoiceToken(token) {
  const secret = process.env.JWT_SECRET || "";
  if (!secret) {
    throw new Error("JWT_SECRET missing");
  }
  return jwt.verify(token, secret);
}

function buildInvoiceUrl(orderId) {
  const base = getInvoiceBaseUrl();
  const token = createInvoiceToken(orderId);
  return `${base}/api/orders/${orderId}/invoice?token=${encodeURIComponent(token)}`;
}

module.exports = {
  buildInvoiceUrl,
  createInvoiceToken,
  verifyInvoiceToken,
};
