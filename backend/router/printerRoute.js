const express = require("express");
const router = express.Router();
const auth = require("../middleware/authicantejwt");
const printController = require("../controllers/addPrinter");
const verifyToken = require("../middleware/authicantejwt");

router.post("/addprinter", auth, verifyToken, printController.addPrinter);
router.get("/getprinter", verifyToken, printController.getPrinter);
router.get("/detect-system-printers", printController.detectSystemPrinters);
router.get("/printer/:id", printController.getPrinterById);
router.put("/printer/:id", printController.updatePrinter);
router.delete("/printer/:id", printController.deletePrinter);
module.exports = router;
