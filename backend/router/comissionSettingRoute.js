const express = require("express");
const router = express.Router();

const auth = require("../middleware/authicantejwt");
const upload = require("../middleware/upload"); // ✅ ADD THIS
const ComissionController = require("../controllers/CommissionSettings");
const verifyToken = require("../middleware/authicantejwt");

// GET
router.get("/getcomissiondata",verifyToken, ComissionController.getAllCommissionSettings);

// POST (🔥 MULTER ADDED HERE)
router.post(
  "/postcommission",
  auth,
  verifyToken,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "logo_footer", maxCount: 1 },
    { name: "fevicon", maxCount: 1 },
  ]),
  ComissionController.createCommissionSetting,
);

// DELETE
router.delete(
  "/deletecomission/:id",
  ComissionController.deleteCommissionSetting,
);

// GET BY ID
router.get("/comissionbyid/:id", ComissionController.getCommissionSettingById);

// UPDATE (🔥 ALSO ADD MULTER HERE)
router.put(
  "/updatecomission/:id",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "logo_footer", maxCount: 1 },
    { name: "fevicon", maxCount: 1 },
  ]),
  ComissionController.updateCommissionSetting,
);

module.exports = router;
