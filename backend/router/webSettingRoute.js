const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const webSettingController = require("../controllers/webSetting");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "asset/icon");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 1024 * 1024 * 5 },
});
// common setting routs
router.post(
  "/csetting",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "logo_footer", maxCount: 1 },
    { name: "fevicon", maxCount: 1 },
  ]),
  webSettingController.createSetting
);

router.put('/csetting/:id', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'logo_footer', maxCount: 1 },
    { name: 'fevicon', maxCount: 1 },
  ]), webSettingController.updateSetting);
  
router.get("/websetting", webSettingController.getAllSettings);
router.get('/csetting/:id', webSettingController.getSettingById);
// sound setting 

router.post('/createsound', upload.single('notifysound'), webSettingController.createOrUpdateSoundSetting);

router.get('/soundsetting',webSettingController.getAllSoundSettings);


module.exports = router;
