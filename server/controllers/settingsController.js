const StoreSettings = require('../models/StoreSettings');
const asyncHandler = require('../utils/asyncHandler');

const ALLOWED_FIELDS = ['storeName', 'email', 'whatsapp', 'instagram', 'footerTagline', 'categories'];

const getSettings = asyncHandler(async (req, res) => {
  const settings = await StoreSettings.findByIdAndUpdate(
    'singleton',
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  res.json(settings);
});

const updateSettings = asyncHandler(async (req, res) => {
  const update = {};
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  }
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided' });
  }
  const settings = await StoreSettings.findByIdAndUpdate(
    'singleton',
    { $set: update },
    { upsert: true, new: true, runValidators: true }
  ).lean();
  res.json(settings);
});

module.exports = { getSettings, updateSettings };
