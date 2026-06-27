const mongoose = require("mongoose");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const { generateInvoice } = require("../utils/generateInvoice");
const { verifyInvoiceToken } = require("../utils/invoiceLink");

const getInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const token = req.query?.token || "";

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  let payload;
  try {
    payload = verifyInvoiceToken(token);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  if (!payload || payload.orderId !== id) {
    return res.status(403).json({ error: "Token mismatch" });
  }

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "paid") {
    return res.status(400).json({ error: "Invoice available only for paid orders" });
  }

  const pdfBuffer = await generateInvoice(order);
  const last5 = id.slice(-5) || "00000";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Invoice-MBM-${last5}.pdf"`
  );
  res.send(pdfBuffer);
});

module.exports = { getInvoice };
