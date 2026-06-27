const express = require("express");
const { getProducts, getProductById } = require("../controllers/productController");
const { productsLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/", productsLimiter, getProducts);
router.get("/:id", productsLimiter, getProductById);

module.exports = router;
