const express = require("express");
const { getInvoice } = require("../controllers/invoiceController");

const router = express.Router();

router.get("/:id/invoice", getInvoice);

module.exports = router;
