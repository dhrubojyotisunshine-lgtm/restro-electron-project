const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportsController");
const verifyToken = require("../middleware/authicantejwt");

router.get("/tablebysale",verifyToken, reportController.getTableBySale);

router.get('/salesbyreport',verifyToken, reportController.salesReport);
router.get("/watersalereport",verifyToken, reportController.getWaiterTotalAmount)
router.get("/servicechargereport",verifyToken,reportController.serviceChargeReport)
router.get("/commission",verifyToken, reportController.showDataCommsion)
router.get("/casherreport",verifyToken,reportController.orderCasherReport)
router.get("/salereportfilter",verifyToken,reportController.salesReportFiltering)
router.get("/salebydate",verifyToken,reportController.salesByDate)
router.get("/itemsalereport",verifyToken,reportController.itemSalesReport)
router.get("/registerreport",verifyToken,reportController.getCashRegister)
router.get("/registeruser",verifyToken,reportController.getCashUser)
router.get("/registerview",verifyToken,reportController.getCashRegisterView)
router.get("/purchasereport",verifyToken,reportController.purchaseReport )
router.get("/cashregisters/:id",verifyToken,reportController.getCashRegisterView);
router.get('/foodstockreport',verifyToken, reportController.productwise);
router.get('/foodstockkitchen',verifyToken, reportController.ingredientReport);
router.get('/deliveryreport',verifyToken, reportController.orderDelivery);
module.exports = router;