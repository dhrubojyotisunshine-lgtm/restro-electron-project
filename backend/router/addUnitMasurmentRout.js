const express = require("express");
const router = express.Router();
const UnitMasurmentController = require("../controllers/addUnitMasurment");
const verifyToken = require("../middleware/authicantejwt");

router.post("/addmasurmentunit",verifyToken, UnitMasurmentController.createUnitMeasurement);
router.get("/getmasurmentunit",verifyToken, UnitMasurmentController.getUnitMeasurements);
router.delete(
  "/deletemasurmentunit/:id",
  UnitMasurmentController.deleteUnitMeasurement
);

router.get('/units/:id', UnitMasurmentController.getUnitMeasurementById);
router.put(
  "/updatemasurmentunit/:id",
  UnitMasurmentController.updateUnitMeasurement
);


module.exports = router;
