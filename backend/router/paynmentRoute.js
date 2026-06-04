const express = require("express");

const router = express.Router();
const paynmentController = require("../controllers/paynmentController");

router.get("/paynmenttype", paynmentController.getPaymentMethods);
router.post("/makePayment/:order_id", paynmentController.makePayment);
module.exports = router;
