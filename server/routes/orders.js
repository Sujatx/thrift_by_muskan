const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");
const { adminGeneralLimiter } = require("../middleware/rateLimiter");
const { getOrders, getOrderById, refundOrder, updateOrder } = require("../controllers/orderController");

const router = express.Router();

router.use(verifyJWT);
router.get("/", adminGeneralLimiter, getOrders);
router.get("/:id", adminGeneralLimiter, getOrderById);
router.put("/:id", updateOrder);
router.post("/:id/refund", refundOrder);

module.exports = router;
