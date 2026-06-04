const express = require("express");

const router = express.Router();

const KitchenController = require("../controllers/addKitchen");
const verifyToken = require("../middleware/authicantejwt");

router.post("/addkitchen",verifyToken, KitchenController.addKitchen);
router.get("/getkitchen",verifyToken, KitchenController.getKitchen);
router.delete("/deletekitchen/:kitchenid", KitchenController.deleteKitchenById);
router.put("/update/:kitchenId", KitchenController.updateKitchenByKitchenId);
router.get("/kitchen/:kitchenid", KitchenController.getKitchenById);

module.exports = router;
