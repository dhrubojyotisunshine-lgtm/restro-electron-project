const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();


const webUserController = require("../controllers/webUser");
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "asset/user");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 1024 * 1024 * 5 },
});


router.post("/logincustomer", webUserController.loginCustomer);
router.post("/newcustomer", upload.single("customer_picture"), webUserController.newCreateCustomer);
router.get('/customerdata/:id', webUserController.getCustomerById);
router.put("/newcustomer/:customer_id", upload.single("customer_picture"),webUserController.NewupdateCustomer);
router.get("/webreservation/:id", webUserController.getReservationById);
router.post("/addwebreservation", webUserController.createReservationNew);
router.post("/webplace-order", webUserController.weborderPlace);
router.get("/webcustomersorder/:customer_id", webUserController.getWebOrderById);
router.post("/getintouch",webUserController.getInTouch)
router.post("/newforgetpassword", webUserController.ForgetPasswordController);
router.post("/newresetpassword/:id/:token", webUserController.newResetPassword);
module.exports = router;