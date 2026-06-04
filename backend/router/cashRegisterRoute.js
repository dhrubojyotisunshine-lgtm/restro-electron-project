const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth =require("../middleware/authicantejwt")
const cashregisterController = require("../controllers/cashRegister");
const verifyToken = require("../middleware/authicantejwt");

router.post("/cashregister",auth,verifyToken, cashregisterController.addCashRegisterDetail);
router.get("/closeregister/:id",cashregisterController.getCashRegisterDetail);
router.put('/cashregisters/:id',cashregisterController.putCashRegisterDetail);
// recent transaction
router.get("/transaction",auth,verifyToken,cashregisterController.recenttransaction);



module.exports=router