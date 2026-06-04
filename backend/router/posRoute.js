const express = require("express");
const router = express.Router();
const posController = require("../controllers/posController");
const auth = require("../middleware/authicantejwt");
const verifyToken = require("../middleware/authicantejwt");

router.get("/getCategoryList", verifyToken, posController.getCategoryList);
// router.get("/products/:categoryId?", posController.getProductsByCategory);
router.get(
  "/products/:parentid?",
  verifyToken,
  posController.getProductsByCategory,
);
//place oreder
router.post("/orderplace", auth, verifyToken, posController.orderPlace);
router.get("/getTodayOrders", verifyToken, posController.getTodayOrders);
router.get("/getWaiter", verifyToken, posController.getWaiter);
router.get("/qrorders", verifyToken, posController.getQROrders);
router.get("/getAllOrderList", posController.allOrderList);
router.get("/getOrderById/:order_id", posController.getOrderById);
router.get("/getOngoingOrder", posController.getOngoingOrder);
router.get("/cancelorderdata", verifyToken, posController.cancelOrdersList);
router.post("/cancelOrder/:order_id", posController.cancelorder);
router.get("/getCompleteOrders", verifyToken, posController.completeOrders);
router.get("/filterdata", verifyToken, posController.OrderListBySearchFilter);
router.get("/pendingorder", verifyToken, posController.pendingOrders);
router.get("/qrorderdata/:categoryId?", posController.getQrorderdata);
// router.get('/qrfilterdata/:categoryId?', posController.getQRByCategory);
router.get("/onlineOrders", verifyToken, posController.getOnlineOrders);
router.post("/qrorderplace", posController.Placeqrorder);
router.get("/getQrOrderById/:id", posController.getQrOrderById);
router.get("/getQrOrderDetailsById/:id", posController.getQrOrderDetailsById);
router.put("/updateqrorder/:id", posController.Updateqrorder);
module.exports = router;
