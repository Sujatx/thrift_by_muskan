const mongoose = require("mongoose");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

function mapProduct(p) {
  const originalPrice = p.originalPrice == null ? p.salePrice : p.originalPrice;
  const savingsAmount = Math.max(0, originalPrice - p.salePrice);
  const savingsPercent = originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;
  const createdAt = p.createdAt ? new Date(p.createdAt) : null;
  const isNew = createdAt ? Date.now() - createdAt.getTime() <= 48 * 60 * 60 * 1000 : false;
  return { ...p, originalPrice, isNew, savingsAmount, savingsPercent };
}

const getProducts = asyncHandler(async (req, res) => {
  const filter = { status: { $in: ["available", "reserved"] }, archived: { $ne: true } };
  const VALID_CATEGORIES = ['tops', 'bottoms', 'dresses', 'accessories'];
  if (req.query.category && VALID_CATEGORIES.includes(req.query.category)) {
    filter.category = req.query.category;
  }
  const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
  res.json(products.map(mapProduct));
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const product = await Product.findOne({
    _id: id,
    status: { $in: ["available", "reserved"] },
    archived: { $ne: true }
  }).lean();
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(mapProduct(product));
});

module.exports = { getProducts, getProductById };
