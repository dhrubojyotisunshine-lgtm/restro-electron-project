const db = require("../utils/db");

function insertIngredient(
  ingredient_name,
  uom_short_code,
  min_stock,
  status,
  created_by,
  res,
) {
  const createIngredientQuery = `
    INSERT INTO ingredients
    (ingredient_name, uom_id, min_stock, status, is_active, created_by)
    VALUES (?, ?, ?, ?, 1, ?)
  `;

  const values = [
    ingredient_name,
    uom_short_code,
    min_stock,
    status,
    created_by,
  ];

  db.run(createIngredientQuery, values, function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "An error occurred",
        error: err.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Ingredient created successfully",
      ingredientId: this.lastID,
    });
  });
}
const createIngredient = async (req, res) => {
  try {
    const { ingredient_name, uom_short_code, min_stock, status } = req.body;
    const user_id = req.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    if (!ingredient_name || ingredient_name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Ingredient name is required.",
      });
    }

    db.get(
      `SELECT * FROM superadmin_user_plans WHERE user_id = ?`,
      [user_id],
      (err, subscription) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
          });
        }

        // User has subscription
        if (subscription) {
          return insertIngredient(
            ingredient_name,
            uom_short_code,
            min_stock,
            status,
            subscription.user_id,
            res,
          );
        }

        // Check creator
        db.get(
          `SELECT created_by FROM user WHERE id = ?`,
          [user_id],
          (err, user) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "Database error",
                error: err.message,
              });
            }

            if (!user || !user.created_by) {
              return res.status(403).json({
                success: false,
                message: "You are not authorized to create ingredient.",
              });
            }

            const created_by = user.created_by;

            // Check creator subscription
            db.get(
              `SELECT * FROM superadmin_user_plans WHERE user_id = ?`,
              [created_by],
              (err, creatorSubscription) => {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: "Database error",
                    error: err.message,
                  });
                }

                if (!creatorSubscription) {
                  return res.status(403).json({
                    success: false,
                    message: "Creator does not have an active subscription.",
                  });
                }

                return insertIngredient(
                  ingredient_name,
                  uom_short_code,
                  min_stock,
                  status,
                  created_by,
                  res,
                );
              },
            );
          },
        );
      },
    );
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

const getAllIngredients = async (req, res) => {
  const { searchItem } = req.query;

  try {
    const id = req.id;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    const checkUserQuery = `
      SELECT created_by, is_admin 
      FROM user 
      WHERE id = ?
    `;

    db.get(checkUserQuery, [id], (err, userData) => {
      if (err) {
        console.error("User check error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const isAdmin = userData.is_admin;
      const created_by = userData.created_by;

      let ownerId;

      if (isAdmin === 1) {
        ownerId = id;
      } else {
        if (!created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to view ingredients.",
          });
        }

        ownerId = created_by;
      }

      let getAllIngredientsQuery;
      let queryParams = [];

      if (!searchItem || searchItem.trim() === "") {
        getAllIngredientsQuery = `
          SELECT i.*, i.ingredient_name, uom.uom_short_code AS Unit_Name
          FROM ingredients AS i
          INNER JOIN unit_of_measurement AS uom ON i.uom_id = uom.id
          WHERE i.created_by = ?
          ORDER BY i.id DESC
        `;
        queryParams = [ownerId];
      } else {
        const searchQuery = `%${searchItem}%`;

        getAllIngredientsQuery = `
          SELECT i.*, i.ingredient_name, uom.uom_short_code AS Unit_Name
          FROM ingredients AS i
          INNER JOIN unit_of_measurement AS uom ON i.uom_id = uom.id
          WHERE i.created_by = ?
          AND (
            i.ingredient_name LIKE ? 
            OR uom.uom_short_code LIKE ?
          )
          ORDER BY i.id DESC
        `;
        queryParams = [ownerId, searchQuery, searchQuery];
      }

      db.all(getAllIngredientsQuery, queryParams, (err, results) => {
        if (err) {
          console.error("Error while retrieving ingredients:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving ingredients",
          });
        }

        if (results.length === 0) {
          return res.status(200).json({
            success: true,
            data: [],
            message: "No ingredients found",
          });
        }

        return res.status(200).json({
          success: true,
          data: results,
        });
      });
    });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

// const getIngredientById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "ID parameter is required" });
//     }

//     // Query to get ingredient by ID with uom_short_code
//     const getIngredientByIdQuery = `
//       SELECT i.*, i.ingredient_name, uom.uom_short_code AS Unit_Name
//       FROM ingredients AS i
//       INNER JOIN unit_of_measurement AS uom ON i.uom_id = uom.id
//       WHERE i.id = ?
//     `;

//     db.all(getIngredientByIdQuery, [id], (err, result) => {
//       if (err) {
//         console.error("Error while retrieving the ingredient:", err);
//         return res
//           .status(500)
//           .json({
//             success: false,
//             message: "An error occurred while retrieving the ingredient",
//           });
//       }

//       if (result.length === 0) {
//         return res
//           .status(404)
//           .json({ success: false, message: "Ingredient not found" });
//       }

//       res.status(200).json({ success: true, data: result[0] });
//     });
//   } catch (error) {
//     console.error("An unexpected error occurred:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "An unexpected error occurred" });
//   }
// };
const getIngredientById = (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID parameter is required" });
    }

    const getIngredientByIdQuery = `
      SELECT i.*, i.ingredient_name, uom.uom_short_code AS Unit_Name
      FROM ingredients AS i
      INNER JOIN unit_of_measurement AS uom ON i.uom_id = uom.id
      WHERE i.id = ?
    `;

    db.get(getIngredientByIdQuery, [id], (err, result) => {
      if (err) {
        console.error("Error while retrieving the ingredient:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while retrieving the ingredient",
        });
      }

      if (!result) {
        return res
          .status(404)
          .json({ success: false, message: "Ingredient not found" });
      }

      res.status(200).json({ success: true, data: result });
    });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};

const updateIngredient = (req, res) => {
  const { id } = req.params;
  const { ingredient_name, uom_id, min_stock, is_active } = req.body;
  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "ID parameter is required" });
  }

  const query = "SELECT * FROM ingredients WHERE id = ?";
  db.get(query, [id], (err, currentData) => {
    if (err) {
      console.error("Error while retrieving ingredient:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error retrieving ingredient" });
    }

    if (!currentData) {
      return res
        .status(404)
        .json({ success: false, message: "Ingredient not found" });
    }

    const updateData = {
      ingredient_name:
        ingredient_name !== undefined
          ? ingredient_name
          : currentData.ingredient_name,
      uom_id: uom_id !== undefined ? uom_id : currentData.uom_id,
      min_stock: min_stock !== undefined ? min_stock : currentData.min_stock,
      is_active: is_active !== undefined ? is_active : currentData.is_active,
    };

    const updateIngredientQuery = `
      UPDATE ingredients 
      SET ingredient_name = ?, uom_id = ?, min_stock = ?, is_active = ? 
      WHERE id = ?
    `;

    db.run(
      updateIngredientQuery,
      [
        updateData.ingredient_name,
        updateData.uom_id,
        updateData.min_stock,
        updateData.is_active,
        id,
      ],
      function (err) {
        if (err) {
          console.error("Error while updating ingredient:", err);
          return res
            .status(500)
            .json({ success: false, message: "Error updating ingredient" });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: "Ingredient not found or no changes applied",
          });
        }

        return res
          .status(200)
          .json({ success: true, message: "Ingredient updated successfully" });
      },
    );
  });
};

const deleteIngredient = (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID parameter is required" });
    }

    const deleteIngredientQuery = "DELETE FROM ingredients WHERE id = ?";

    db.run(deleteIngredientQuery, [id], function (err) {
      if (err) {
        console.error("Error while deleting ingredient:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error deleting ingredient" });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Ingredient not found or already deleted",
        });
      }

      res
        .status(200)
        .json({ success: true, message: "Ingredient deleted successfully" });
    });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};

const getIngredientsDetails = (req, res) => {
  try {
    const id = req.id;
    const { searchItem } = req.query;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    const userQuery = `
      SELECT is_admin, created_by 
      FROM user 
      WHERE id = ?
    `;

    db.get(userQuery, [id], (err, userData) => {
      if (err) {
        console.error("User check error:", err);
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const { is_admin, created_by } = userData;

      let creatorId;

      if (is_admin === 1) {
        creatorId = id;
      } else {
        if (!created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to view ingredients.",
          });
        }

        creatorId = created_by;
      }

      let query = `
        SELECT 
          i.id AS ingredient_id, 
          i.ingredient_name, 
          i.uom_id, 
          uom.uom_name, 
          i.stock_qty, 
          i.min_stock, 
          i.status, 
          i.is_active 
        FROM ingredients i 
        LEFT JOIN unit_of_measurement uom ON i.uom_id = uom.id 
        WHERE i.is_active = 1 
        AND i.created_by = ?
      `;

      let queryParams = [creatorId];

      if (searchItem && searchItem.trim() !== "") {
        query += `
          AND (
            i.ingredient_name LIKE ? 
            OR uom.uom_name LIKE ? 
            OR i.stock_qty LIKE ? 
            OR i.min_stock LIKE ?
          )
        `;

        const searchQuery = `%${searchItem}%`;
        queryParams.push(searchQuery, searchQuery, searchQuery, searchQuery);
      }

      query += ` ORDER BY i.id DESC`;

      db.all(query, queryParams, (err, results) => {
        if (err) {
          console.error("Error fetching ingredients:", err);
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }

        return res.json({
          success: true,
          data: results,
        });
      });
    });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

// const updateIngredient = async (req, res) => {
//   const { id } = req.params;
//   console.log(id);
//   const { ingredient_name, uom_id, min_stock, is_active } = req.body;

//   // Query to get the current ingredient details
//   const query = "SELECT * FROM ingredients WHERE id = ?";
//   db.run(query, [id], (err, results) => {
//     if (err) {
//       console.error("Error while retrieving ingredient:", err);
//       return res
//         .status(500)
//         .json({
//           success: false,
//           message: "An error occurred while retrieving the ingredient record",
//         });
//     }

//     if (results.length === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Ingredient not found" });
//     }

//     const currentData = results[0];

//     // Prepare updated data by checking for undefined values
//     const updateData = {
//       ingredient_name:
//         ingredient_name !== undefined
//           ? ingredient_name
//           : currentData.ingredient_name,
//       uom_id: uom_id !== undefined ? uom_id : currentData.uom_id,
//       min_stock: min_stock !== undefined ? min_stock : currentData.min_stock,

//       is_active: is_active !== undefined ? is_active : currentData.is_active,
//     };

//     // Query to update the ingredient
//     const updateIngredientQuery = `
//         UPDATE ingredients
//         SET ingredient_name = ?, uom_id = ?, min_stock = ?, is_active = ?
//         WHERE id = ?
//       `;
//     const values = [
//       updateData.ingredient_name,
//       updateData.uom_id,
//       updateData.min_stock,

//       updateData.is_active,
//       id,
//     ];

//     db.run(updateIngredientQuery, values, (err, result) => {
//       if (err) {
//         console.error("Error while updating ingredient:", err);
//         return res
//           .status(500)
//           .json({
//             success: false,
//             message: "An error occurred while updating the ingredient",
//           });
//       }

//       if (result.affectedRows === 0) {
//         return res
//           .status(404)
//           .json({ success: false, message: "Ingredient not found" });
//       }

//       return res
//         .status(200)
//         .json({ success: true, message: "Ingredient updated successfully" });
//     });
//   });
// };

// const deleteIngredient = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Query to delete the ingredient
//     const deleteIngredientQuery = `
//       DELETE FROM ingredients
//       WHERE id = ?
//     `;

//     db.run(deleteIngredientQuery, [id], (err, result) => {
//       if (err) {
//         console.error("Error while deleting ingredient:", err);
//         return res
//           .status(500)
//           .json({
//             success: false,
//             message: "An error occurred while deleting ingredient",
//           });
//       }

//       // Check if any rows were affected; if none, return 404
//       if (result.affectedRows === 0) {
//         return res
//           .status(404)
//           .json({
//             success: false,
//             message: "Ingredient not found or no changes applied",
//           });
//       }

//       res
//         .status(200)
//         .json({ success: true, message: "Ingredient deleted successfully" });
//     });
//   } catch (error) {
//     console.error("An unexpected error occurred:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "An unexpected error occurred" });
//   }
// };

// const getIngredientsDetails = async (req, res) => {
//   try {
//       const { searchItem } = req.query;
//       let query = `
//           SELECT
//               i.id AS ingredient_id,
//               i.ingredient_name,
//               i.uom_id,
//               uom.uom_name,
//               i.stock_qty,
//               i.min_stock,
//               i.status,
//               i.is_active
//           FROM ingredients i
//           LEFT JOIN unit_of_measurement uom ON i.uom_id = uom.id
//           WHERE i.is_active = 1
//       `;

//       let queryParams = [];

//       if (searchItem && searchItem.trim() !== "") {
//           query += ` AND (i.ingredient_name LIKE ? OR uom.uom_name LIKE ? OR i.stock_qty LIKE ? OR i.min_stock LIKE ?)`;
//           const searchQuery = `%${searchItem}%`;
//           queryParams.push(searchQuery, searchQuery,searchQuery,searchQuery);
//       }

//       query += ` ORDER BY i.id DESC`;

//       const [results] = await db.run(query, queryParams);
//       res.json({ success: true, data: results });
//   } catch (error) {
//       console.error("Error fetching ingredients:", error);
//       res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

module.exports = {
  createIngredient,
  getAllIngredients,
  deleteIngredient,
  getIngredientById,
  updateIngredient,
  getIngredientsDetails,
};
