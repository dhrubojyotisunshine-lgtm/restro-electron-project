const express = require("express");
const router = express.Router();
const rolesController = require("../controllers/roleandpremission");
const auth = require("../middleware/authicantejwt");
const verifyToken = require("../middleware/authicantejwt");

router.get(
  "/getalluseraccesses",
  verifyToken,
  rolesController.getAllUserAccesses,
);
router.get("/allroles", verifyToken, rolesController.getAllRoles);
router.delete("/roles/:role_id", rolesController.deleteRolePermission);
router.get("/menuitems", rolesController.getAllMenuItems);
router.delete("/useraccess/:role_acc_id", rolesController.deleteUserAccess);
router.post("/useraccess", verifyToken, rolesController.createUserAccess);

router.put("/useraccess/:id", rolesController.updateUserAccess);
router.get("/useraccesss/:id", rolesController.editAccessRole);
router.get("/rolepermission/:role_id", rolesController.getRolePermissionById);
router.post(
  "/rolepermission",
  auth,
  verifyToken,
  rolesController.createRolePermission,
);

router.put("/rolepermission/:role_id", rolesController.updateRolePermission);
module.exports = router;
