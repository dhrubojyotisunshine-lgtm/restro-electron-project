const express = require("express");

const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/authicantejwt");
const addfoodController = require("../controllers/addFood");
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

// Route for creating an item food
router.post(
  "/itemfood",
  upload.single("ProductImage"),
  auth,
  verifyToken,
  addfoodController.createItemFood,
);

router.delete("/itemfood/:ProductsID", verifyToken, addfoodController.deleteItemFood);

router.get("/itemfood",verifyToken, addfoodController.getAllItemFoodDetails);
router.get("/itemfooddetail/:id", verifyToken, addfoodController.getItemFoodDetails);
router.put(
  "/itemfood/:ProductID",
  upload.single("ProductImage"),
  auth,
  addfoodController.updateItemFood,
);
router.post("/bulk-upload-food", verifyToken, addfoodController.bulkUploadFood);
router.post("/fooditems/import", auth, addfoodController.importFoodItems);

module.exports = router;
