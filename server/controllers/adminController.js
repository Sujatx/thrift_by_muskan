const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const { Resend } = require("resend");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Admin = require("../models/Admin");
const asyncHandler = require("../utils/asyncHandler");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || ""
});

function signToken(admin) {
  return jwt.sign(
    { id: admin._id.toString(), email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  
  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ token: signToken(admin) });
});

const inviteAdmin = asyncHandler(async (req, res) => {
  const { email, expiresHours } = req.body || {};
  const AdminInvite = require('../models/AdminInvite');
  const crypto = require('crypto');
  const hours = typeof expiresHours === 'number' && expiresHours > 0 ? expiresHours : 48;
  const allowTokenReturn = process.env.NODE_ENV !== "production";

  if (!email && !allowTokenReturn) {
    return res.status(400).json({ error: "Email required" });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

  const createdBy = (req.admin && req.admin.id) || (req.user && req.user.id) || null;
  const invite = await AdminInvite.create({ email: email || '', tokenHash, createdBy, expiresAt });

  const clientUrl = process.env.CLIENT_URL || '';
  const inviteUrl = clientUrl ? `${clientUrl.replace(/\/$/, '')}/admin/onboard?token=${token}` : `TOKEN:${token}`;

  try {
    if (email) {
      if (!resend) throw new Error("Resend not configured");
      const fromEmail = process.env.RESEND_FROM_EMAIL || "";
      if (!fromEmail) throw new Error("RESEND_FROM_EMAIL missing");
      const html = `<p>You were invited to become an admin. Click to complete setup:</p><p><a href="${inviteUrl}">${inviteUrl}</a></p>`;
      const text = `Complete admin setup: ${inviteUrl}`;
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Admin invite — complete setup',
        html,
        text
      });
      return res.status(201).json({ inviteId: invite._id, emailed: true, expiresAt });
    }
  } catch (err) {
    if (allowTokenReturn) {
      return res.status(201).json({ inviteId: invite._id, token, expiresAt, emailed: false, error: err.message });
    }
    return res.status(201).json({ inviteId: invite._id, emailed: false, expiresAt });
  }

  if (allowTokenReturn) {
    return res.status(201).json({ inviteId: invite._id, token, expiresAt, note: 'No email supplied; return token to invitee' });
  }
  return res.status(201).json({ inviteId: invite._id, emailed: false, expiresAt });
});

const validateInviteToken = asyncHandler(async (req, res) => {
  const { token } = req.query || {};
  if (!token) return res.status(400).json({ error: 'token required' });
  const AdminInvite = require('../models/AdminInvite');
  const crypto = require('crypto');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const invite = await AdminInvite.findOne({ tokenHash });
  if (!invite || invite.used || invite.expiresAt < new Date()) return res.status(400).json({ valid: false });
  res.json({ valid: true, email: invite.email });
});

const completeOnboard = asyncHandler(async (req, res) => {
  const { token, email, password } = req.body || {};
  if (!token || !email || !password) return res.status(400).json({ error: 'token, email and password required' });
  const AdminInvite = require('../models/AdminInvite');
  const crypto = require('crypto');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const invite = await AdminInvite.findOne({ tokenHash });
  if (!invite || invite.used || invite.expiresAt < new Date()) return res.status(400).json({ error: 'Invalid or expired token' });

  const existing = await Admin.findOne({ email });
  if (existing) return res.status(400).json({ error: 'email already taken' });

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await Admin.create({ email, passwordHash });
  invite.used = true;
  await invite.save();
  res.json({ token: signToken(admin) });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  const admin = await Admin.findOne({ email });
  // Always return success — prevents email enumeration
  if (!admin) return res.json({ message: 'If that email is registered, a reset link has been sent.' });

  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  admin.resetPasswordToken = tokenHash;
  admin.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await admin.save();

  const clientUrl = (process.env.CLIENT_URL || '').split(',')[0].trim();
  const resetUrl = `${clientUrl}/admin/reset-password?token=${token}`;

  try {
    if (!resend) throw new Error('Resend not configured');
    const fromEmail = process.env.RESEND_FROM_EMAIL || '';
    if (!fromEmail) throw new Error('RESEND_FROM_EMAIL missing');
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset your admin password — Thrift by Muskan',
      html: `<p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
      text: `Reset your password: ${resetUrl}\n\nExpires in 1 hour.`
    });
  } catch (err) {
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();
    return res.status(500).json({ error: 'Failed to send reset email. Try again.' });
  }

  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const crypto = require('crypto');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const admin = await Admin.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!admin) return res.status(400).json({ error: 'Invalid or expired reset link' });

  admin.passwordHash = await bcrypt.hash(password, 12);
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpires = undefined;
  await admin.save();

  res.json({ message: 'Password reset successfully' });
});

const getCloudinarySignature = asyncHandler(async (req, res) => {
  if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    return res.status(400).json({ error: "Cloudinary not configured" });
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "thrift-products"; // Match the folder used by the client
  
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  });
});

const getAdminProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ status: 1, createdAt: -1 });
  res.json(products);
});

const addProduct = asyncHandler(async (req, res) => {
  const { name, category, originalPrice, salePrice, size, description, images, thumbnailUrl, tags } = req.body || {};
  if (!name || !category || salePrice == null || !size) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const imageList = Array.isArray(images) ? images : [];
  const tagList = Array.isArray(tags) ? tags : [];
  const finalOriginal = originalPrice == null ? salePrice : originalPrice;
  const thumb = thumbnailUrl || imageList[0] || "";
  const product = await Product.create({
    name,
    category,
    originalPrice: finalOriginal,
    salePrice,
    size,
    description: description || "",
    images: imageList,
    thumbnailUrl: thumb,
    tags: tagList
  });
  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const allowed = [
    "name",
    "category",
    "originalPrice",
    "salePrice",
    "size",
    "description",
    "images",
    "thumbnailUrl",
    "tags",
    "status",
    "archived"
  ];
  const update = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
      update[key] = req.body[key];
    }
  }
  if (update.images && !Array.isArray(update.images)) update.images = [];
  if (update.tags && !Array.isArray(update.tags)) update.tags = [];

  const product = await Product.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  product.archived = true;
  product.status = "sold";
  product.reservedAt = null;
  product.reservedOrderId = null;
  await product.save();

  await Order.updateMany(
    { productId: product._id, status: "pending" },
    { $set: { status: "failed" } }
  );

  res.json({ success: true });
});

const toggleProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const { status } = req.body || {};
  if (status && ["available", "sold"].includes(status)) {
    product.status = status;
  } else {
    product.status = product.status === "sold" ? "available" : "sold";
  }
  if (product.status !== "reserved") {
    product.reservedAt = null;
    product.reservedOrderId = null;
  }
  await product.save();

  if (product.status !== "reserved") {
    await Order.updateMany(
      { productId: product._id, status: "pending" },
      { $set: { status: "failed" } }
    );
  }
  res.json(product);
});

const getAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find()
    .select('-passwordHash -resetPasswordToken -resetPasswordExpires')
    .sort({ createdAt: -1 });
  res.json(admins);
});

const getAdminInvites = asyncHandler(async (req, res) => {
  const AdminInvite = require('../models/AdminInvite');
  const invites = await AdminInvite.find({
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  res.json(invites);
});

const revokeInvite = asyncHandler(async (req, res) => {
  const AdminInvite = require('../models/AdminInvite');
  const invite = await AdminInvite.findByIdAndDelete(req.params.id);
  if (!invite) return res.status(404).json({ error: 'Invite not found' });
  res.json({ success: true });
});

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  inviteAdmin,
  validateInviteToken,
  completeOnboard,
  getCloudinarySignature,
  getAdminProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getAdmins,
  getAdminInvites,
  revokeInvite,
};
