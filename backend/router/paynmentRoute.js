const express = require("express");
const router = express.Router();
const paynmentController = require("../controllers/paynmentController");
const verifyToken = require("../middleware/authicantejwt");

router.get("/paynmenttype", paynmentController.getPaymentMethods);
router.post("/makePayment/:order_id", verifyToken, paynmentController.makePayment);
module.exports = router;
