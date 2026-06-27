const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productImage: { type: String, default: "" },
    originalPrice: { type: Number, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
    size: { type: String, default: "" },
    items: {
      type: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          name: { type: String, required: true },
          image: { type: String, default: "" },
          originalPrice: { type: Number, min: 0 },
          salePrice: { type: Number, required: true, min: 0 },
          size: { type: String, default: "" },
          quantity: { type: Number, min: 1, default: 1 },
          category: { type: String, default: "" },
        },
      ],
      default: [],
    },
    totalAmount: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "INR" },
    customer: {
      name: { type: String, required: true, maxlength: 200 },
      phone: { type: String, required: true },
      email: { type: String, default: "" }
    },
    address: {
      line1: { type: String, required: true, maxlength: 300 },
      line2: { type: String, default: "", maxlength: 300 },
      city: { type: String, required: true, maxlength: 100 },
      state: { type: String, required: true, maxlength: 100 },
      pincode: { type: String, required: true }
    },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true
    },
    paidAt: { type: Date, default: null },
    invoiceUrl: { type: String, default: "" },
    shipment: {
      shiprocketOrderId: { type: String, default: null },
      shipmentId: { type: String, default: null },
      awbCode: { type: String, default: null },
      courierName: { type: String, default: null },
      trackingUrl: { type: String, default: null },
      status: { type: String, default: 'pending' },
      failedAt: { type: Date, default: null },
      error: { type: String, default: null },
    }
  },
  { timestamps: true }
);

orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ 'shipment.shiprocketOrderId': 1 });

module.exports = mongoose.model("Order", orderSchema);
