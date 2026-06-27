const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { verifyWebhookSignature } = require("../utils/razorpayVerify");
const { sendBuyerConfirmation, sendAdminNotification } = require("../utils/sendEmails");
const { createShiprocketOrder } = require("../services/shiprocketService");

const router = express.Router();

router.post("/razorpay", express.raw({ type: "application/json" }), async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const ok = verifyWebhookSignature(req.body, signature, secret);
    if (!ok) return res.status(400).send("Invalid signature");

    const event = JSON.parse(req.body.toString("utf8"));
    if (event.event === "payment.captured") {
      const orderId = event.payload?.payment?.entity?.order_id;
      const paymentId = event.payload?.payment?.entity?.id;
      if (orderId) {
        const order = await Order.findOne({ razorpayOrderId: orderId });
        if (order && order.status === "pending") {
          order.status = "paid";
          order.paidAt = new Date();
          order.razorpayPaymentId = paymentId || "";
          order.razorpaySignature = signature || "";
          await order.save();

          const productIds = Array.isArray(order.items) && order.items.length
            ? order.items.map((item) => item.productId)
            : [order.productId].filter(Boolean);

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
            console.error('[Shiprocket] Webhook non-blocking failure:', shipErr.message);
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
        }
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
