const mongoose = require("mongoose");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const { getRazorpayClient } = require("../utils/razorpayClient");

const getOrders = asyncHandler(async (req, res) => {
  const { q, status, page = '1', limit = '50' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (q && q.trim()) {
    const clean = q.replace(/^#/, '').trim();
    const regex = new RegExp(clean, 'i');
    filter.$or = [
      { razorpayOrderId: regex },
      { razorpayPaymentId: regex },
      { 'shipment.shiprocketOrderId': regex },
      { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: clean, options: 'i' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

const refundOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: "Payment not configured" });
  }

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "paid") {
    return res.status(400).json({ error: "Only paid orders can be refunded" });
  }
  if (!order.razorpayPaymentId) {
    return res.status(400).json({ error: "Missing payment id" });
  }

  const razorpay = getRazorpayClient();
  const refundAmount = Number(order.totalAmount ?? order.salePrice ?? 0);
  await razorpay.payments.refund(order.razorpayPaymentId, {
    amount: Math.round(refundAmount * 100)
  });

  order.status = "refunded";
  await order.save();

  res.json({ success: true, status: order.status });
});

const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const ALLOWED_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
  if (status) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    order.status = status;
  }
  await order.save();
  res.json(order);
});

module.exports = { getOrders, getOrderById, refundOrder, updateOrder };
