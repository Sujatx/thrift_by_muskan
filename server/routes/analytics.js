const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const { getOverview } = require('../controllers/analyticsController');

const router = express.Router();

router.use(verifyJWT);
router.get('/overview', getOverview);

module.exports = router;
