const express = require("express");
const router = express.Router();
const splitcontroller = require("../controllers/splitOrder");
const verifyToken = require("../middleware/authicantejwt");

router.get("/splitorderdata/:id", verifyToken, splitcontroller.showsplitorder);
router.post("/mergepayment", verifyToken, splitcontroller.mergeMakePayment);
router.post("/paysplit", verifyToken, splitcontroller.paymentSplitOrder);

module.exports = router;
