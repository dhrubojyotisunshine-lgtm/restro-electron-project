const multer = require("multer");
const path = require("path");

// Multer storage configuration
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "asset/icon");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
});

const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuType");
const verifyToken = require("../middleware/authicantejwt");

router.post(
  "/menutype",
  upload.single("menu_icon"),
  verifyToken,
  menuController.createMenuType,
);
router.get("/menutype/:id", menuController.getMenuTypeById);
router.get("/menutype", verifyToken, menuController.getAllMenuTypes);
router.put(
  "/menutype/:menutypeid",
  upload.single("menu_icon"),
  menuController.updateMenuType,
);
router.delete("/menutype/:id", menuController.deleteMenuType);
router.post("/menutype/import", verifyToken, menuController.importMenuTypes);

module.exports = router;
