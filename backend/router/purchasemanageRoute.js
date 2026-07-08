const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseManage");
const verifyToken = require("../middleware/authicantejwt");

// add purchase
router.post("/addPurchaseItem", verifyToken, purchaseController.createPurchaseItem);
router.get("/purchaseitem", verifyToken, purchaseController.getPurchaseItemDetails);
router.get("/getupdate/:id", verifyToken, purchaseController.getPurchaseItemById);
router.put("/updatedata/:purchaseid", verifyToken, purchaseController.updatePurchaseItem);

// PURCHASE RETURN
router.get("/purchasereturns", verifyToken, purchaseController.getReturnpurchase);
router.get("/purchasereturns/:id", verifyToken, purchaseController.getReturnItemInfoByID);

// PURCHASE RETURN ACCORDING TO SUPPLIER AND INVOICE
router.get("/purchasereturnsearch", verifyToken, purchaseController.fetchInvoiceIdThroughSupplier);

// post return
router.post("/returnitem", verifyToken, purchaseController.purReturnInsert);
router.get("/purchasereturn", verifyToken, purchaseController.invoiceBySupplier);

// suppliers
router.get("/suppliers", verifyToken, purchaseController.getAllSuppliers);
router.post("/suppliers", verifyToken, purchaseController.createSupplier);
router.delete("/suppliers/:id", verifyToken, purchaseController.deleteSupplier);
router.get("/suppliers/:id", verifyToken, purchaseController.getSupplierById);
router.put("/suppliers/:id", verifyToken, purchaseController.updateSupplier);

// stock
router.get("/stock", verifyToken, purchaseController.stockOutIngredients);
router.get("/getIngredient", verifyToken, purchaseController.getAllStockIngredients);

// purchase transaction history
router.get("/purchase/:purchaseid/history", verifyToken, purchaseController.getPurchaseHistory);

// supplier ledger
router.get("/supplierledger", verifyToken, purchaseController.getPurchaseTransactions);

module.exports = router;
