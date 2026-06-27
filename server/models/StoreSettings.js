const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'singleton' },
    storeName: { type: String, default: 'Thrift by Muskan' },
    email: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    instagram: { type: String, default: '' },
    footerTagline: { type: String, default: 'Made with care in Delhi.' },
    categories: { type: [String], default: ['tops', 'bottoms', 'dresses', 'accessories'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
