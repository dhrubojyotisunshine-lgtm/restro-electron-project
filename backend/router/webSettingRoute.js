const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const webSettingController = require("../controllers/webSetting");
const verifyToken = require("../middleware/authicantejwt");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, "asset/icon"); },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 1024 * 1024 * 5 },
});

const imageUpload = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "logo_footer", maxCount: 1 },
  { name: "fevicon", maxCount: 1 },
]);

// Public branding route (no auth — used on login page)
router.get("/public/setting", webSettingController.getPublicSetting);

// Common setting routes
router.get("/websetting", verifyToken, webSettingController.getAllSettings);
router.post("/csetting", verifyToken, imageUpload, webSettingController.createSetting);
router.put("/csetting/:id", verifyToken, imageUpload, webSettingController.updateSetting);
router.get("/csetting/:id", verifyToken, webSettingController.getSettingById);

// Sound setting routes
router.post("/createsound", upload.single("notifysound"), webSettingController.createOrUpdateSoundSetting);
router.get("/soundsetting", webSettingController.getAllSoundSettings);

module.exports = router;
