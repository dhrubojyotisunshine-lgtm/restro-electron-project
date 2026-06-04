const express = require("express");
const auth = require("../middleware/authicantejwt");
const router = express.Router();
const recipecontroller = require("../controllers/recipemanagement");
const verifyToken = require("../middleware/authicantejwt");

router.get(
  "/productionsetlist",
  verifyToken,
  recipecontroller.getalldetailsProductiondetails,
);
router.get("/variantdata", recipecontroller.foodWithVariant);
router.get("/foodname", verifyToken, recipecontroller.foodNameFetchApi);
router.post(
  "/productiondata",
  auth,
  verifyToken,
  recipecontroller.createProduction,
);
//Supplier Ledger get route

router.get("/supplierledger", recipecontroller.getPurchaseTransactions);

// Set production Unit
router.get(
  "/productionunitingredients",
  verifyToken,
  recipecontroller.getAllStockIngredients,
);
router.get(
  "/productionunitingredientss",
  verifyToken,
  recipecontroller.getAllStockIngredientswithone,
);
router.get("/priceperitem/:id", recipecontroller.getPerItemPrice);

router.post(
  "/productiondetail",
  auth,
  verifyToken,
  recipecontroller.createproductiondata,
);
// get details by id for edit
router.get(
  "/productiondetail/:foodid/:pvarientid",
  recipecontroller.findbyIdProductiondetails,
);
router.get(
  "/viewproductiondetail/:foodid/:pvarientid",
  recipecontroller.viewProductiondetails,
);
router.put(
  "/productiondetail/:foodnameid/:pvarientnameid",
  verifyToken,
  recipecontroller.updateProductionDetail,
);
router.delete(
  "/productiondetail/:foodid/:pvarientid",
  recipecontroller.deleteProductionData,
);
// to show data in below
router.get("/productiondetails",verifyToken, recipecontroller.getProductionDetails);
module.exports = router;
