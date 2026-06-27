const mongoose = require('mongoose');

const adminInviteSchema = new mongoose.Schema({
  email: { type: String, required: false, trim: true },
  tokenHash: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: false },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('AdminInvite', adminInviteSchema);
