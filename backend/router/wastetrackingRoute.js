const express = require("express");
const auth = require("../middleware/authicantejwt");
const router = express.Router();
const wastetrackingcontroller = require("../controllers/wastetracking");
const verifyToken = require("../middleware/authicantejwt");

router.get(
  "/packagingwaste",
  verifyToken,
  wastetrackingcontroller.getPackagingWasteDetails,
);
router.post(
  "/packagepost",
  auth,
  verifyToken,
  wastetrackingcontroller.insertPackageInformation,
);

// Purchase food Waste
router.get(
  "/foodwaste",
  verifyToken,
  wastetrackingcontroller.getPackageFoodWasteDetails,
);
// price accourding to incrident
router.get("/lprice/:id", wastetrackingcontroller.getTotalPrice);
router.post(
  "/foodwaste",
  auth,
  verifyToken,
  wastetrackingcontroller.insertingRdInformation,
);

// making food waste
router.get(
  "/makefoods",
  verifyToken,
  wastetrackingcontroller.showItemsFoodWaste,
);
// get price accourding food name and variant
router.get(
  "/getlostprice",
  wastetrackingcontroller.getalldetailsProductiondetails,
);
// post
router.post(
  "/makeingfoodwaste",
  auth,
  verifyToken,
  wastetrackingcontroller.insertFoodInformation,
);

module.exports = router;
