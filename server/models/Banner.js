const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, default: '', maxlength: 500 },
    ctaText: { type: String, default: '', maxlength: 100 },
    ctaLink: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    type: {
      type: String,
      enum: ['hero_main', 'hero_secondary', 'promo'],
      default: 'hero_main',
    },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bannerSchema.index({ active: 1, sortOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
