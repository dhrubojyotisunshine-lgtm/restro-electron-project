const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const dataController = require("../controllers/addCategory");
const auth = require("../middleware/authicantejwt");
const verifyToken = require("../middleware/authicantejwt");
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "asset/category");
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
});

router.get("/data",verifyToken, dataController.getCategory);
router.post("/data", upload.single("image"), auth,verifyToken, dataController.addCategory);
router.delete("/data/:id", verifyToken, dataController.deletCategory);
router.put(
  "/data/:id",
  upload.single("image"),
  auth,
  verifyToken,
  dataController.updateCategory,
);
router.get("/data/:id", verifyToken, dataController.getCategoryById);

router.post("/bulkupload", auth, dataController.bulkUploadCategory);

module.exports = router;
