const express = require("express");
const router = express.Router();


const shippingControllers = require("../controllers/shippingType");
const verifyToken = require("../middleware/authicantejwt");


router.get('/shippingtype',verifyToken, shippingControllers.getAllShippingMethods);
router.post('/shippingtype',verifyToken, shippingControllers.createShippingMethod);
router.get('/shippingmethod/:id', shippingControllers.getShippingMethodById);
router.delete('/shippingmethod/:id', shippingControllers.deleteShippingMethod)
router.put("/shippingmethod/:id",shippingControllers.updateShippingMethod);
module.exports = router;