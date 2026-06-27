const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const { productsLimiter } = require('../middleware/rateLimiter');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();

router.get('/', productsLimiter, getSettings);
router.patch('/admin', verifyJWT, updateSettings);

module.exports = router;
