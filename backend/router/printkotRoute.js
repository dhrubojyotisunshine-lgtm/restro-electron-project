const express = require("express");
const router = express.Router();

const printController = require("../controllers/printKOT");
const verifyToken = require("../middleware/authicantejwt");

router.get("/test-usb-print",verifyToken, printController.testUsbPrint);

router.post(
  "/printkitchenkot/:kitchenId",verifyToken,
  printController.printOrderToKitchens,
);

router.get("/printkitchen/kot-list",verifyToken, printController.getKitchenKotList);
router.get("/printkitchen/kot-history",verifyToken, printController.getKitchenKotHistory);
router.post("/printkitchen/order/accept", printController.acceptKitchenOrder);
router.post("/printkitchen/order/reject", printController.rejectKitchenOrder);
router.post(
  "/printkitchen/order/complete",
  printController.completeKitchenOrder,
);

module.exports = router;
