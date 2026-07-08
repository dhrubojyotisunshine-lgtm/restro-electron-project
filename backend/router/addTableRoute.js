const express = require("express");
const router = express.Router();
const tableController = require("../controllers/addTable");
const multer = require("multer");
const path = require("path");
const verifyToken = require("../middleware/authicantejwt");

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

router.post(
  "/table",
  upload.single("table_icon"),
  verifyToken,
  tableController.createTable,
);
router.get("/table",verifyToken, tableController.getTables);
router.get("/table/:id", verifyToken, tableController.getTableById);
router.delete("/deletetable/:id", verifyToken, tableController.deleteTable);
router.get("/bookedtable", verifyToken, tableController.getBookedTable);
router.get("/unbookedtable", verifyToken, tableController.getunBookedTable);
router.put("/table/:tableId", verifyToken, tableController.cleartable);

router.put("/updatetable/:tableid", verifyToken, tableController.updateTable);
// delete and update left
module.exports = router;
