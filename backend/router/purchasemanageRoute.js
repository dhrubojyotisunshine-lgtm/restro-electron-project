const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseManage");
const path = require("path");
const auth = require("../middleware/authicantejwt");
const verifyToken = require("../middleware/authicantejwt");
//add purchase
router.post(
  "/addPurchaseItem",
  auth,
  verifyToken,
  purchaseController.createPurchaseItem,
);
router.get(
  "/purchaseitem",
  verifyToken,
  purchaseController.getPurchaseItemDetails,
);
router.get("/getupdate/:id", purchaseController.getPurchaseItemById);
router.put("/updatedata/:purchaseid", purchaseController.updatePurchaseItem);
// router.put('/update/:purchaseid',purchaseController.updatePurchaseItem)
//PURCHASE RETURN
router.get(
  "/purchasereturns",
  verifyToken,
  purchaseController.getReturnpurchase,
);
router.get("/purchasereturns/:id", purchaseController.getReturnItemInfoByID);
//PURCHASE RETURN ACCOURDING TO THAT SUPPLIER AND INVOICE
router.get(
  "/purchasereturnsearch",
  purchaseController.fetchInvoiceIdThroughSupplier,
);
// post return
router.post(
  "/returnitem",
  auth,
  verifyToken,
  purchaseController.purReturnInsert,
);
router.get("/purchasereturn", purchaseController.invoiceBySupplier);

// get all suppliers
router.get("/suppliers", verifyToken, purchaseController.getAllSuppliers);
router.post("/suppliers", verifyToken, purchaseController.createSupplier);
router.delete("/suppliers/:id", purchaseController.deleteSupplier);
router.get("/suppliers/:id", purchaseController.getSupplierById);
router.put("/suppliers/:id", purchaseController.updateSupplier);

// get out of stock
router.get("/stock", verifyToken, purchaseController.stockOutIngredients);
// get getIngredientby stock quantity

router.get(
  "/getIngredient",
  verifyToken,
  purchaseController.getAllStockIngredients,
);
// get supplier ledger data
router.get("/supplierledger", purchaseController.getPurchaseTransactions);
module.exports = router;
