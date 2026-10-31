const db = require("../utils/db");
// Add kitchen data
const addKitchen = (req, res) => {
  try {
    const { kitchen_name } = req.body;
    const user_id = req.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    if (!kitchen_name || kitchen_name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Kitchen name is required.",
      });
    }

    db.get(
      `SELECT created_by, is_admin FROM user WHERE id = ?`,
      [user_id],
      (err, user) => {
        if (err) {
          console.error("User check error:", err);
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found.",
          });
        }

        let created_by;

        if (user.is_admin === 1) {
          created_by = user_id;
        } else {
          if (!user.created_by) {
            return res.status(403).json({
              success: false,
              message: "You are not authorized to add kitchen.",
            });
          }

          created_by = user.created_by;
        }

        db.run(
          `INSERT INTO kitchens (kitchen_name, created_by) VALUES (?, ?)`,
          [kitchen_name, created_by],
          function (err) {
            if (err) {
              console.error("Kitchen insert error:", err);
              return res.status(500).json({
                success: false,
                message: "Internal Server Error",
              });
            }

            return res.status(201).json({
              success: true,
              message: "Kitchen created successfully",
              kitchen_id: this.lastID,
            });
          },
        );
      },
    );
  } catch (error) {
    console.error("Error in addKitchen:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

const getKitchen = (req, res) => {
  try {
    const id = req.id;
    const { searchItem } = req.query;

    if (!id) {
      return res.status(401).json([]);
    }

    db.get(
      `SELECT created_by, is_admin FROM user WHERE id = ?`,
      [id],
      (err, user) => {
        if (err) {
          console.error("User check error:", err);
          return res.status(500).json([]);
        }

        if (!user) {
          return res.status(404).json([]);
        }

        let ownerId;

        if (user.is_admin === 1) {
          ownerId = id;
        } else {
          if (!user.created_by) {
            return res.status(403).json([]);
          }

          ownerId = user.created_by;
        }

        let query;
        let params = [];

        if (!searchItem || searchItem.trim() === "") {
          query = `
            SELECT id, kitchen_name, created_by, created_at
            FROM kitchens
            WHERE created_by = ?
            ORDER BY id DESC
          `;
          params = [ownerId];
        } else {
          query = `
            SELECT id, kitchen_name, created_by, created_at
            FROM kitchens
            WHERE created_by = ?
            AND kitchen_name LIKE ?
            ORDER BY id DESC
          `;
          params = [ownerId, `%${searchItem}%`];
        }

        db.all(query, params, (err, results) => {
          if (err) {
            console.error("Kitchen fetch error:", err);
            return res.status(500).json([]);
          }

          // frontend ke according direct array
          return res.status(200).json(results);
        });
      },
    );
  } catch (error) {
    console.error("Error in getKitchen:", error);
    return res.status(500).json([]);
  }
};

const getKitchenById = async (req, res) => {
  const { kitchenid } = req.params;

  const getKitchenByIdQuery = `
      SELECT id, kitchen_name FROM kitchens WHERE id = ?
    `;

  db.get(getKitchenByIdQuery, [kitchenid], (err, data) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No kitchen found with the provided kitchen ID",
      });
    }

    res.status(200).json(data);
  });
};

// Delete Kitchen data
const deleteKitchenById = async (req, res) => {
  const { kitchenid } = req.params;
  const query = `DELETE FROM kitchens WHERE id = ?`;

  try {
    db.run(query, [kitchenid], function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while deleting the kitchen",
        });
      }

      // `this.changes` gives the number of rows affected
      if (this.changes > 0) {
        return res
          .status(200)
          .json({ success: true, message: "Kitchen deleted successfully" });
      } else {
        return res.status(404).json({
          success: false,
          message: "No kitchen found with the provided kitchen ID",
        });
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};

// update Kitchen

// const updateKitchenByKitchenId = async (req, res) => {
//   try {
//     const { kitchenId } = req.params;
//     const { kitchen_name, printer_name } = req.body;

//     // Query to get printerid from printers table
//     const getPrinterIdQuery = "SELECT id FROM printers WHERE name = ?";

//     // Execute the query to get printerid
//     db.get(getPrinterIdQuery, [printer_name], async (err, printerResult) => {
//       if (err) {
//         console.error("Error fetching printer id:", err);
//         return res.status(500).send("Server error");
//       }

//       if (printerResult.length === 0) {
//         return res.status(404).send("Printer not found");
//       }

//       const printerid = printerResult[0].id;

//       // Update the kitchen record in the database
//       const updateKitchenQuery = `UPDATE tbl_kitchen SET kitchen_name = ?, printer_id = ? WHERE kitchenid = ?`;

//       db.run(
//         updateKitchenQuery,
//         [kitchen_name, printerid, kitchenId],
//         (err, result) => {
//           if (err) {
//             console.error("Error updating kitchen:", err);
//             return res.status(500).send("Server error");
//           }
//           res.status(200).send("Kitchen updated successfully");
//         }
//       );
//     });
//   } catch (error) {
//     console.error("Error in updateKitchenByKitchenId:", error);
//     res.status(500).send("Server error");
//   }
// };
// const updateKitchenByKitchenId = async (req, res) => {
//   try {
//     const { kitchenId } = req.params;
//     const { kitchen_name, printer_name } = req.body;
//       const updateKitchenQuery = `UPDATE tbl_kitchen SET kitchen_name = ?, printer_id = ? WHERE kitchenid = ?`;

//       db.run(updateKitchenQuery, [kitchen_name, printer_name, kitchenId], function (err) {
//         if (err) {
//           console.error("Error updating kitchen:", err);
//           return res.status(500).send("Server error");
//         }
//         res.status(200).send("Kitchen updated successfully");
//       });

//   } catch (error) {
//     console.error("Error in updateKitchenByKitchenId:", error);
//     res.status(500).send("Server error");
//   }
// };

const updateKitchenByKitchenId = async (req, res) => {
  try {
    const { kitchenId } = req.params;
    const { kitchen_name, printer_name } = req.body;

    // Debug logs
    console.log("kitchenId from params:", kitchenId);
    console.log("Request body:", req.body);

    if (!kitchenId) {
      return res.status(400).send("kitchenId is required in URL");
    }
    if (!kitchen_name) {
      return res.status(400).send("kitchen_name is required");
    }

    const updateKitchenQuery = `UPDATE tbl_kitchen SET kitchen_name = ?, printer_id = ? WHERE kitchenid = ?`;

    db.run(
      updateKitchenQuery,
      [kitchen_name, printer_name, kitchenId],
      function (err) {
        if (err) {
          console.error("Error updating kitchen:", err);
          return res.status(500).send("Server error");
        }
        console.log(`Rows updated: ${this.changes}`); // number of rows affected
        res.status(200).send("Kitchen updated successfully");
      },
    );
  } catch (error) {
    console.error("Error in updateKitchenByKitchenId:", error);
    res.status(500).send("Server error");
  }
};

module.exports = {
  addKitchen,
  getKitchen,
  deleteKitchenById,
  updateKitchenByKitchenId,
  getKitchenById,
};
