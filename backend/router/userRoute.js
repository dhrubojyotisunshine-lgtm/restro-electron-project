const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const axios = require("axios");
// const authenticateJWT = require("../middleware/middleware");
const userControllers = require("../controllers/userController");
const verifyToken = require("../middleware/authicantejwt");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "asset/user");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 1024 * 1024 * 5 },
});

router.post(
  "/add",
  upload.single("image"),
  verifyToken,
  userControllers.addUser,
);
router.get("/all", verifyToken, userControllers.getUsers);
router.delete("/deleteuser/:id", userControllers.deleteUser);
router.get("/userbyid/:id", userControllers.getUserById);
router.put(
  "/updateuser/:id",
  upload.single("image"),
  userControllers.updateUser,
);

router.post("/sync-activation-data", userControllers.syncActivationData);

// log in api routs
router.post("/login", userControllers.loginUser);
router.post("/logout/:id", userControllers.logoutUser);

router.get("/countries1", userControllers.getAllCountry);
// States by country name
router.get("/states1/:countryName", userControllers.getStatesByCountry);

// Cities by country name + state
router.get(
  "/cities1/:countryName/:stateName",
  userControllers.getCitiesByState,
);

// check-in
router.get("/checkin", userControllers.checkIncheckOut);

// forgot pass
router.post("/forgetpassword", userControllers.ForgetPasswordController);
router.post(
  "/resetpassword/:id/:token",
  userControllers.resetPasswordController,
);
module.exports = router;
