const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authicantejwt");
const ComissionController = require("../controllers/CommissionSettings");

router.get("/getcomissiondata", verifyToken, ComissionController.getAllCommissionSettings);
router.post("/postcommission", verifyToken, ComissionController.createCommissionSetting);
router.delete("/deletecomission/:id", verifyToken, ComissionController.deleteCommissionSetting);
router.get("/comissionbyid/:id", verifyToken, ComissionController.getCommissionSettingById);
router.put("/updatecomission/:id", verifyToken, ComissionController.updateCommissionSetting);

module.exports = router;
