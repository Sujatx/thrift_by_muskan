const Banner = require('../models/Banner');
const asyncHandler = require('../utils/asyncHandler');

const getPublicBanners = asyncHandler(async (req, res) => {
  const filter = { active: true };
  if (req.query.type) {
    const VALID_TYPES = ['hero_main', 'hero_secondary', 'promo'];
    if (VALID_TYPES.includes(req.query.type)) filter.type = req.query.type;
  }
  const banners = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json(banners);
});

const getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json(banners);
});

const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  res.status(201).json(banner);
});

const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!banner) return res.status(404).json({ error: 'Banner not found' });
  res.json(banner);
});

const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ error: 'Banner not found' });
  res.json({ success: true });
});

const reorderBanners = asyncHandler(async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

  await Promise.all(
    items.map(({ id, sortOrder }) =>
      Banner.findByIdAndUpdate(id, { sortOrder })
    )
  );
  res.json({ success: true });
});

module.exports = { getPublicBanners, getBanners, createBanner, updateBanner, deleteBanner, reorderBanners };
