const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

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

const hrmcontroller = require("../controllers/hrmController");
const verifyToken = require("../middleware/authicantejwt");

router.get("/employedata", verifyToken, hrmcontroller.getAllEmployeeHistories);
router.get("/designation", verifyToken, hrmcontroller.getAllPositions);
router.get("/designation/:id", verifyToken, hrmcontroller.getPositionById);
router.put("/designation/:id", verifyToken, hrmcontroller.updatePosition);
router.delete("/designation/:id", verifyToken, hrmcontroller.deletePosition);
router.post("/createdesignation", verifyToken, hrmcontroller.createDesignation);
// get all devision

router.get("/dutytype", verifyToken, hrmcontroller.getALlDutyTypes);
router.get("/frequencytype", verifyToken, hrmcontroller.getAllFrequencyType);
router.get("/ratetype", verifyToken, hrmcontroller.getAllRateTypes);
router.get("/mstatus", verifyToken, hrmcontroller.maritalSaatus);
router.get("/gender", verifyToken, hrmcontroller.getGender);
// delete employee
router.delete("/deleteemployee/:id", verifyToken, hrmcontroller.deleteEmployee);
router.post(
  "/createemployee",
  upload.single("picture"),
  verifyToken,
  hrmcontroller.createEmployeeHistory,
);
//get by id
router.get("/getemployeebyid/:id", verifyToken, hrmcontroller.getemployeeBYID);

router.put(
  "/updateemployee/:id",
  upload.single("picture"),
  verifyToken,
  hrmcontroller.updateEmployeeHistory,
);
// Department
router.put("/department/:id", verifyToken, hrmcontroller.updateDepartment);
router.get("/department/:id", verifyToken, hrmcontroller.getDepartmentById);
router.get("/department", verifyToken, hrmcontroller.getDepartments);
router.post("/adddepartment", verifyToken, hrmcontroller.addDepartment);
router.delete("/deletedepartment/:id", verifyToken, hrmcontroller.deleteDepartment);

// division
router.get("/division", verifyToken, hrmcontroller.getAllDivision);
router.get("/dipartmentlist", verifyToken, hrmcontroller.departmentDropdown);
router.get("/getdivisionbyid/:id", verifyToken, hrmcontroller.getALldivisionbyId);
router.post("/createdivision", verifyToken, hrmcontroller.createDivison);
router.delete("/deletedivision/:id", verifyToken, hrmcontroller.deleteDivison);
router.put("/updatedivision/:id", verifyToken, hrmcontroller.updateDivison);
router.post("/employees/import", verifyToken, hrmcontroller.importEmployees);
module.exports = router;
