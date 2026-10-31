const express = require("express");

const router = express.Router();
const auth=require("../middleware/authicantejwt")
const leaveController = require("../controllers/leaveController");
const verifyToken = require("../middleware/authicantejwt");

 router.get("/allholidays",verifyToken, leaveController.getHolidays)
 router.post("/addholiday",auth,verifyToken,leaveController.createHoliday)
 router.delete("/deleteholiday/:id",leaveController.deleteHoliday);
  router.get("/holiday/:id",leaveController.getHolidayById);
  router.put("/updateholiday/:id", auth,verifyToken,leaveController.updateHoliday);
  // leave type


  router.post('/leavetype',verifyToken, leaveController.createLeaveType);

router.get('/leavetype',verifyToken, leaveController.getLeaveTypes);

router.put('/leavetype/:id', leaveController.updateLeaveType);

router.delete('/leavetype/:id', leaveController.deleteLeaveType);

router.get('/leavetype/:id', leaveController.getLeaveTypeById);
// leave aapplication


router.post('/leaveapply',verifyToken, leaveController.createLeaveApply);
router.get('/leaveapply',verifyToken, leaveController.getLeaveApplies);
router.put('/leaveapply/:id', leaveController.updateLeaveApply);
router.delete('/leaveapply/:id', leaveController.deleteLeaveApply);
router.get('/leaveapply/:id', leaveController.getLeaveApplyById);
router.post('/holidays/import', verifyToken, leaveController.importHolidays);
module.exports = router;