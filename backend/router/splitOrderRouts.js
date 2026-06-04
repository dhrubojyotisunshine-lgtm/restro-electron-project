const express= require ("express")
const router = express.Router();

const splitcontroller= require("../controllers/splitOrder");

router.get ("/splitorderdata/:id",splitcontroller.showsplitorder)
// merger order route api paynment
router.post("/mergepayment", splitcontroller.mergeMakePayment);


router.post('/paysplit',splitcontroller.paymentSplitOrder)



module.exports=router