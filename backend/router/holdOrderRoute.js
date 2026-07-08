const express = require("express");
const router = express.Router();
const holdController = require("../controllers/holdOrders");
const auth=require("../middleware/authicantejwt");
const verifyToken = require("../middleware/authicantejwt");


router.get("/getdraft",verifyToken, holdController.draftgetOrders)
router.post("/holdorder",auth,verifyToken,holdController.draftOrderPlace)
router.get("/draft/:id", verifyToken, holdController.draftgetOrderById)
router.put("/draft/:id",auth,verifyToken,holdController.updateOrder)

module.exports = router;
