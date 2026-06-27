const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    category: {
      type: String,
      required: true,
      enum: ["tops", "bottoms", "dresses", "accessories"]
    },
    originalPrice: { type: Number, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
    size: { type: String, required: true, trim: true, maxlength: 20 },
    description: { type: String, default: "", maxlength: 2000 },
    images: { type: [String], default: [] },
    thumbnailUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["available", "reserved", "sold"],
      default: "available",
      index: true
    },
    archived: { type: Boolean, default: false, index: true },
    reservedAt: { type: Date, default: null },
    reservedOrderId: { type: String, default: null },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

productSchema.index({ status: 1, reservedAt: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ archived: 1, status: 1 });

module.exports = mongoose.model("Product", productSchema);
