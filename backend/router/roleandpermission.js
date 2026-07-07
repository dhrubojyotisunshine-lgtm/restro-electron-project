const express = require("express");
const router = express.Router();
const rolesController = require("../controllers/roleandpremission");
const verifyToken = require("../middleware/authicantejwt");

router.get("/getalluseraccesses", verifyToken, rolesController.getAllUserAccesses);
router.get("/allroles", verifyToken, rolesController.getAllRoles);
router.delete("/roles/:role_id", verifyToken, rolesController.deleteRolePermission);
router.get("/menuitems", verifyToken, rolesController.getAllMenuItems);
router.delete("/useraccess/:role_acc_id", verifyToken, rolesController.deleteUserAccess);
router.post("/useraccess", verifyToken, rolesController.createUserAccess);
router.put("/useraccess/:id", verifyToken, rolesController.updateUserAccess);
router.get("/useraccesss/:id", verifyToken, rolesController.editAccessRole);
router.get("/rolepermission/:role_id", verifyToken, rolesController.getRolePermissionById);
router.post("/rolepermission", verifyToken, rolesController.createRolePermission);
router.put("/rolepermission/:role_id", verifyToken, rolesController.updateRolePermission);

module.exports = router;
