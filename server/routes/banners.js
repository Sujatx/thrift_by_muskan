const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const { productsLimiter } = require('../middleware/rateLimiter');
const {
  getPublicBanners,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} = require('../controllers/bannerController');

const router = express.Router();

// Public
router.get('/', productsLimiter, getPublicBanners);

// Admin
router.get('/admin', verifyJWT, getBanners);
router.post('/admin', verifyJWT, createBanner);
router.post('/admin/reorder', verifyJWT, reorderBanners);
router.patch('/admin/:id', verifyJWT, updateBanner);
router.delete('/admin/:id', verifyJWT, deleteBanner);

module.exports = router;
