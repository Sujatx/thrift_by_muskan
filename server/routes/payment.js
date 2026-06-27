const express = require("express");
const { createOrder, verifyPayment, cancelOrder } = require("../controllers/paymentController");
const { payLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.use(payLimiter);
router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.post("/cancel", cancelOrder);

module.exports = router;
