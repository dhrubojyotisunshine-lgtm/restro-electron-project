const express = require("express");

const router = express.Router();

const addfloorController = require("../controllers/addFloor");
const verifyToken = require("../middleware/authicantejwt");

router.post("/addfloor", verifyToken, addfloorController.createFloor);
router.get("/getfloor", verifyToken, addfloorController.getFloors);
router.delete(
  "/deletefloors/:floorID",
  verifyToken,
  addfloorController.deleteFloor,
);
router.get("/floors/:id", verifyToken, addfloorController.getFloorById);
router.put("/floors/:id", verifyToken, addfloorController.updateFloor);
module.exports = router;
