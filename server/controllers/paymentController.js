const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const { verifyRazorpaySignature } = require("../utils/razorpayVerify");
const { getRazorpayClient } = require("../utils/razorpayClient");
const { sendBuyerConfirmation, sendAdminNotification } = require("../utils/sendEmails");
const { createShiprocketOrder } = require("../services/shiprocketService");


function isValidPhone(phone) {
  return /^\d{10}$/.test(phone || "");
}

function isValidPincode(pin) {
  return /^\d{6}$/.test(pin || "");
}

const createOrder = asyncHandler(async (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: "Payment not configured" });
  }

  const { items, productId, customer, address } = req.body || {};
  const rawItems = Array.isArray(items) && items.length
    ? items
    : productId
      ? [{ productId, quantity: 1 }]
      : null;

  if (!rawItems) {
    return res.status(400).json({ error: "Missing items" });
  }
  if (!customer || !customer.name || !customer.phone || !address) {
    return res.status(400).json({ error: "Missing customer or address" });
  }
  if (!isValidPhone(customer.phone)) {
    return res.status(400).json({ error: "Invalid phone" });
  }
  if (!address.line1 || !address.city || !address.state || !address.pincode) {
    return res.status(400).json({ error: "Missing address fields" });
  }
  if (!isValidPincode(address.pincode)) {
    return res.status(400).json({ error: "Invalid pincode" });
  }

  const uniqueIds = new Set();
  const normalizedItems = rawItems.map((item) => {
    const quantity = Number(item?.quantity || 1);
    const productId = item?.productId;
    return { productId, quantity };
  });

  for (const item of normalizedItems) {
    if (!mongoose.isValidObjectId(item.productId)) {
      return res.status(400).json({ error: "Invalid productId" });
    }
    if (item.quantity !== 1) {
      return res.status(400).json({ error: "Quantity must be 1" });
    }
    if (uniqueIds.has(item.productId)) {
      return res.status(400).json({ error: "Duplicate productId" });
    }
    uniqueIds.add(item.productId);
  }

  const reservedAt = new Date();
  const reservedProducts = [];

  for (const item of normalizedItems) {
    const product = await Product.findOneAndUpdate(
      { _id: item.productId, status: "available", archived: { $ne: true } },
      { status: "reserved", reservedAt, reservedOrderId: null },
      { new: true }
    );

    if (!product) {
      const reservedIds = reservedProducts.map((p) => p._id);
      if (reservedIds.length) {
        await Product.updateMany(
          { _id: { $in: reservedIds } },
          { $set: { status: "available" }, $unset: { reservedAt: "", reservedOrderId: "" } }
        );
      }
      return res.status(409).json({ error: "Item no longer available", code: "ITEM_TAKEN" });
    }

    reservedProducts.push(product);
  }

  try {
    const razorpay = getRazorpayClient();
    const orderItems = reservedProducts.map((product) => ({
      productId: product._id,
      name: product.name,
      image: product.thumbnailUrl || product.images[0] || "",
      originalPrice: product.originalPrice == null ? product.salePrice : product.originalPrice,
      salePrice: product.salePrice,
      size: product.size || "",
      quantity: 1,
      category: product.category || "",
    }));

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + Number(item.salePrice || 0) * Number(item.quantity || 1),
      0
    );
    const originalTotal = orderItems.reduce(
      (sum, item) => sum + Number(item.originalPrice || item.salePrice || 0) * Number(item.quantity || 1),
      0
    );

    const summaryName = orderItems.length === 1
      ? orderItems[0].name
      : `${orderItems.length} items`;

    const orderDoc = new Order({
      productId: orderItems[0].productId,
      productName: summaryName,
      productImage: orderItems[0].image,
      originalPrice: originalTotal,
      salePrice: totalAmount,
      size: orderItems.length === 1 ? orderItems[0].size || "" : "",
      items: orderItems,
      totalAmount,
      currency: "INR",
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || ""
      },
      address: {
        line1: address.line1,
        line2: address.line2 || "",
        city: address.city,
        state: address.state,
        pincode: address.pincode
      }
    });

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `mbm_${orderDoc._id}`
    });

    orderDoc.razorpayOrderId = rzpOrder.id;
    await orderDoc.save();

    await Product.updateMany(
      { _id: { $in: reservedProducts.map((p) => p._id) } },
      { $set: { reservedOrderId: rzpOrder.id } }
    );

    const reservedUntil = new Date(reservedAt.getTime() + 10 * 60 * 1000);
    res.json({
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: rzpOrder.amount,
      productName: summaryName,
      orderId: orderDoc._id.toString(),
      reservedUntil: reservedUntil.toISOString()
    });
  } catch (err) {
    const reservedIds = reservedProducts.map((p) => p._id);
    if (reservedIds.length) {
      await Product.updateMany(
        { _id: { $in: reservedIds } },
        { $set: { status: "available" }, $unset: { reservedAt: "", reservedOrderId: "" } }
      );
    }
    throw err;
  }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body || {};
  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(400).json({ error: "Invalid orderId" });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const productIds = Array.isArray(order.items) && order.items.length
    ? order.items.map((item) => item.productId)
    : [order.productId].filter(Boolean);

  if (order.status === "paid") {
    return res.status(200).json({ success: true, orderId: order._id.toString() });
  }

  if (order.razorpayOrderId && razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
    return res.status(400).json({ error: "Order mismatch" });
  }

  const ok = verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
  if (!ok) {
    order.status = "failed";
    order.razorpayPaymentId = razorpayPaymentId || "";
    order.razorpaySignature = razorpaySignature || "";
    await order.save();

    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { status: "available" }, $unset: { reservedAt: "", reservedOrderId: "" } }
    );

    return res.status(400).json({ error: "Payment verification failed", code: "INVALID_SIGNATURE" });
  }

  order.status = "paid";
  order.paidAt = new Date();
  order.razorpayPaymentId = razorpayPaymentId || "";
  order.razorpaySignature = razorpaySignature || "";
  if (razorpayOrderId) order.razorpayOrderId = razorpayOrderId;
  await order.save();

  await Product.updateMany(
    { _id: { $in: productIds } },
    { $set: { status: "sold" }, $unset: { reservedAt: "", reservedOrderId: "" } }
  );

  // Non-blocking Shiprocket integration
  try {
    const shipmentData = await createShiprocketOrder(order);
    if (shipmentData) {
      order.shipment = shipmentData;
    } else {
      order.shipment = { status: 'failed', failedAt: new Date(), error: 'Shiprocket returned null' };
    }
    await order.save();
  } catch (shipErr) {
    console.error('[Shiprocket] Non-blocking failure:', shipErr.message);
    try {
      order.shipment = { status: 'failed', failedAt: new Date(), error: shipErr.message };
      await order.save();
    } catch (_) {}
  }

  try {
    try {
      await sendBuyerConfirmation(order);
    } catch (err) {
      console.error("Buyer email failed:", err);
    }

    try {
      await sendAdminNotification(order);
    } catch (err) {
      console.error("Admin email failed:", err);
    }
  } catch (err) {
    console.error("Post-payment processing failed:", err);
  }

  return res.status(200).json({ success: true, orderId: order._id.toString() });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body || {};
  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(400).json({ error: "Invalid orderId" });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const productIds = Array.isArray(order.items) && order.items.length
    ? order.items.map((item) => item.productId)
    : [order.productId].filter(Boolean);

  if (order.status !== "pending") {
    return res.json({ success: true, status: order.status });
  }

  order.status = "failed";
  await order.save();

  await Product.updateMany(
    { _id: { $in: productIds }, status: "reserved" },
    { $set: { status: "available" }, $unset: { reservedAt: "", reservedOrderId: "" } }
  );

  res.json({ success: true, status: "failed" });
});

module.exports = { createOrder, verifyPayment, cancelOrder };
