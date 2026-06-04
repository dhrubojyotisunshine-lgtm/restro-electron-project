const db = require("../utils/db");

// const createUnitMeasurement = async (req, res) => {
//   try {
//     const { uom_name, uom_short_code, is_active = 1 } = req.body;
//     const user_id = req.id;

//     if (!user_id) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: User ID not found.",
//       });
//     }

//     if (!uom_name || !uom_short_code) {
//       return res.status(400).json({
//         success: false,
//         message: "uom_name and uom_short_code are required.",
//       });
//     }

//     const isActiveNum = parseInt(is_active);

//     if (isNaN(isActiveNum)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid is_active value.",
//       });
//     }

//     db.get(
//       `SELECT created_by, is_admin FROM user WHERE id = ?`,
//       [user_id],
//       (err, user) => {
//         if (err) {
//           return res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: err.message,
//           });
//         }

//         if (!user) {
//           return res.status(404).json({
//             success: false,
//             message: "User not found.",
//           });
//         }

//         let created_by;

//         if (user.is_admin === 1) {
//           created_by = user_id;
//         } else {
//           if (!user.created_by) {
//             return res.status(403).json({
//               success: false,
//               message: "You are not authorized to create unit of measurement.",
//             });
//           }

//           created_by = user.created_by;
//         }

//         const insertQuery = `
//           INSERT INTO unit_of_measurement
//           (uom_name, uom_short_code, is_active, created_by)
//           VALUES (?, ?, ?, ?)
//         `;

//         db.run(
//           insertQuery,
//           [uom_name, uom_short_code, isActiveNum, created_by],
//           function (err) {
//             if (err) {
//               return res.status(500).json({
//                 success: false,
//                 message: "Insert error",
//                 error: err.message,
//               });
//             }

//             return res.status(201).json({
//               success: true,
//               message: "Unit of measurement created successfully",
//               id: this.lastID,
//             });
//           }
//         );
//       }
//     );
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "An unexpected error occurred",
//       error: error.message,
//     });
//   }
// };

const createUnitMeasurement = async (req, res) => {
  try {
    const { uom_name, uom_short_code, is_active = 1 } = req.body;
    const user_id = req.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    if (!uom_name || !uom_short_code) {
      return res.status(400).json({
        success: false,
        message: "uom_name and uom_short_code are required.",
      });
    }

    const isActiveNum = parseInt(is_active);

    // Step 1: Check user's subscription
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
          const created_by = user_id;

          return insertUnitMeasurement(
            uom_name,
            uom_short_code,
            isActiveNum,
            created_by,
            res
          );
        }

        // Step 2: Check creator
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
                message:
                  "You are not authorized to create unit of measurement",
              });
            }

            const created_by = user.created_by;

            // Step 3: Check creator subscription
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
                    message:
                      "Creator does not have an active subscription",
                  });
                }

                return insertUnitMeasurement(
                  uom_name,
                  uom_short_code,
                  isActiveNum,
                  created_by,
                  res
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected error",
      error: error.message,
    });
  }
};

function insertUnitMeasurement(
  uom_name,
  uom_short_code,
  is_active,
  created_by,
  res
) {
  const insertQuery = `
    INSERT INTO unit_of_measurement
    (uom_name, uom_short_code, is_active, created_by)
    VALUES (?, ?, ?, ?)
  `;

  db.run(
    insertQuery,
    [uom_name, uom_short_code, is_active, created_by],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Insert error",
          error: err.message,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Unit of measurement created successfully",
        id: this.lastID,
      });
    }
  );
}
const getUnitMeasurements = async (req, res) => {
  try {
    const id = req.id;
    const { searchItem } = req.query;

    const checkUserQuery = `
      SELECT created_by, is_admin
      FROM user
      WHERE id = ?
    `;

    db.get(checkUserQuery, [id], (err, userData) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
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
            message: "You are not authorized to view units of measurement.",
          });
        }

        ownerId = created_by;
      }

      let getUnitsQuery = `
        SELECT *
        FROM unit_of_measurement
        WHERE created_by = ?
      `;

      let queryParams = [ownerId];

      if (searchItem && searchItem.trim() !== "") {
        getUnitsQuery += `
          AND (uom_name LIKE ? OR uom_short_code LIKE ?)
        `;
        const searchQuery = `%${searchItem}%`;
        queryParams.push(searchQuery, searchQuery);
      }

      getUnitsQuery += ` ORDER BY id DESC`;

      db.all(getUnitsQuery, queryParams, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching units of measurement",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          data: result,
          message: "Units of measurement fetched successfully",
        });
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
    });
  }
};

const deleteUnitMeasurement = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteUnit = "DELETE FROM unit_of_measurement WHERE id = ?";

    // Use a function instead of an arrow function to access `this.changes`
    db.run(deleteUnit, [id], function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while deleting the unit of measurement",
        });
      }

      // Check if any rows were deleted
      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Unit of measurement not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Unit of measurement deleted successfully",
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

const updateUnitMeasurement = async (req, res) => {
  try {
    const { id } = req.params;
    const { uom_name, uom_short_code, is_active } = req.body;

    // Check if the unit of measurement exists
    const getUnitQuery = "SELECT * FROM unit_of_measurement WHERE id = ?";
    db.get(getUnitQuery, [id], (err, currentData) => {
      if (err) {
        console.error("Error retrieving unit of measurement:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while retrieving the unit of measurement",
        });
      }

      if (!currentData) {
        return res
          .status(404)
          .json({ success: false, message: "Unit of measurement not found" });
      }

      // Update only the provided fields, keeping the current values for unspecified fields
      const updatedData = {
        uom_name: uom_name !== undefined ? uom_name : currentData.uom_name,
        uom_short_code:
          uom_short_code !== undefined
            ? uom_short_code
            : currentData.uom_short_code,
        is_active: is_active !== undefined ? is_active : currentData.is_active,
      };

      // Update the unit of measurement
      const updateUnitQuery = `
        UPDATE unit_of_measurement 
        SET uom_name = ?, uom_short_code = ?, is_active = ?
        WHERE id = ?
      `;
      const values = [
        updatedData.uom_name,
        updatedData.uom_short_code,
        updatedData.is_active,
        id,
      ];

      db.run(updateUnitQuery, values, function (err) {
        if (err) {
          console.error("Error updating unit of measurement:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while updating the unit of measurement",
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: "Unit of measurement not found or no changes made",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Unit of measurement updated successfully",
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};

const getUnitMeasurementById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID parameter is required" });
    }

    const getUnitByIdQuery = `SELECT * FROM unit_of_measurement WHERE id = ?`;

    db.all(getUnitByIdQuery, [id], (err, result) => {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .json({ success: false, message: "An error occurred" });
      }

      if (result.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Unit of measurement not found" });
      }

      res.status(200).json({
        success: true,
        data: result[0],
        message: "Unit of measurement fetched successfully",
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

module.exports = {
  createUnitMeasurement,
  getUnitMeasurements,
  deleteUnitMeasurement,
  updateUnitMeasurement,
  getUnitMeasurementById,
};
