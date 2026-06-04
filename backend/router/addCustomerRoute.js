const express = require("express");
const router = express.Router();
const customerController = require("../controllers/addCustomer");
const verifyToken = require("../middleware/authicantejwt");

router.post("/customer",verifyToken, customerController.createCustomer);
router.get("/customer",verifyToken, customerController.getCustomers);
router.get('/customer/:customer_id', customerController.getCustomerById);
router.put('/customer/:customer_id', customerController.updateCustomer);
router.delete('/customer/:customer_id', customerController.deleteCustomer)
module.exports = router;
