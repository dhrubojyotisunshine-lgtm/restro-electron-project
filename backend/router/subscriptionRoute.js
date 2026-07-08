const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const verifyToken = require("../middleware/authicantejwt");

router.get("/getallpackages", subscriptionController.getAllPlans);
router.get("/subscriptions/:userId", subscriptionController.getSubscriptionsByUser);
router.post("/createsubscription", verifyToken, subscriptionController.createSubscription);
router.post("/sync-subscription-data", subscriptionController.syncSubscriptionData);
router.post("/trigger-subscription-sync/:userId", subscriptionController.triggerSubscriptionSync);
router.put("/renew-plan/:userPlanId", verifyToken, subscriptionController.renewPlan);

module.exports = router;
