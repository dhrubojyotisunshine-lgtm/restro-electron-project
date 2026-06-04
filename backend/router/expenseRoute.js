const express = require("express");
const router = express.Router();

const expensecontroller = require("../controllers/expenseController");
const verifyToken = require("../middleware/authicantejwt");

router.get("/expense",verifyToken, expensecontroller.getExpenseIten);
router.post("/expense",verifyToken,expensecontroller.postExpenseIten);
router.delete("/expense/:id",expensecontroller.deleteExpenseItem);
router.get("/expense/:id",expensecontroller.getExpenseItemById);
router.put("/expense/:id",expensecontroller.updateExpenseItem);

// expense page
router.get("/expensepage",verifyToken,expensecontroller.getExpenses)
router.post("/expensepage",verifyToken,expensecontroller.createExpense)
router.delete("/expensepage/:id",expensecontroller.deleteExpense)

module.exports= router;