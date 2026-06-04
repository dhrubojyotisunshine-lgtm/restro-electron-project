const express = require("express");
const router = express.Router();
const customertypeController = require("../controllers/customerType");

router.get("/customertype", customertypeController.getCustomerTypes);

module.exports = router;
