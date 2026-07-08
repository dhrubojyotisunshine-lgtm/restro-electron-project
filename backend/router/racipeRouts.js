const express = require("express");
const router = express.Router();
const recipecontroller = require("../controllers/recipemanagement");
const verifyToken = require("../middleware/authicantejwt");

router.get("/productionsetlist", verifyToken, recipecontroller.getalldetailsProductiondetails);
router.get("/variantdata", verifyToken, recipecontroller.foodWithVariant);
router.get("/foodname", verifyToken, recipecontroller.foodNameFetchApi);
router.post("/productiondata", verifyToken, recipecontroller.createProduction);

// Supplier Ledger
router.get("/supplierledger", verifyToken, recipecontroller.getPurchaseTransactions);

// Set production Unit
router.get("/productionunitingredients", verifyToken, recipecontroller.getAllStockIngredients);
router.get("/productionunitingredientss", verifyToken, recipecontroller.getAllStockIngredientswithone);
router.get("/priceperitem/:id", verifyToken, recipecontroller.getPerItemPrice);

router.post("/productiondetail", verifyToken, recipecontroller.createproductiondata);

// get details by id for edit
router.get("/productiondetail/:foodid/:pvarientid", verifyToken, recipecontroller.findbyIdProductiondetails);
router.get("/viewproductiondetail/:foodid/:pvarientid", verifyToken, recipecontroller.viewProductiondetails);
router.put("/productiondetail/:foodnameid/:pvarientnameid", verifyToken, recipecontroller.updateProductionDetail);
router.delete("/productiondetail/:foodid/:pvarientid", verifyToken, recipecontroller.deleteProductionData);

router.get("/productiondetails", verifyToken, recipecontroller.getProductionDetails);

module.exports = router;
