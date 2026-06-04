const express = require("express");
const router = express.Router();

const ingredientsController = require("../controllers/ingredientController");
const verifyToken = require("../middleware/authicantejwt");

// Create a new ingredient
router.post("/ingredients",verifyToken, ingredientsController.createIngredient);
// router.put("/ingredients/:id", ingredientsController.updateIngredient);

// Delete an existing ingredient
router.delete("/ingredients/:id", ingredientsController.deleteIngredient);

// Get all ingredients
router.get("/ingredients",verifyToken, ingredientsController.getAllIngredients);
router.get('/ingredients/:id', ingredientsController.getIngredientById);
router.put('/ingredients/:id', ingredientsController.updateIngredient);
// get ingredient list accourding t stock

router.get('/ingredientsdetail',verifyToken, ingredientsController.getIngredientsDetails);
module.exports = router;
