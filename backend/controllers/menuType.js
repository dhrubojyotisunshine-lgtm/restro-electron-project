// const db = require("../utils/db");

// // POST request to create a new menu type
// const createMenuType = async (req, res) => {
//   try {
//     const { menutype, status } = req.body;
//     const menu_icon = req.file ? req.file.filename : null;

//     // Validate request body
//     if (!menutype) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Menu type is required" });
//     }

//     const createMenuTypeQuery = `
//       INSERT INTO tbl_menutype (menutype, menu_icon, status)
//       VALUES (?, ?, ?)
//     `;
//     const values = [menutype, menu_icon, status];

//     db.pool.query(createMenuTypeQuery, values, (err, result) => {
//       if (err) {
//         console.error("Database error:", err);
//         res.status(500).json({
//           success: false,
//           message: "An error occurred while creating the menu type",
//           error: err.message,
//         });
//       } else {
//         res
//           .status(200)
//           .json({ success: true, message: "Menu type created successfully" });
//       }
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred on the server",
//       error: error.message,
//     });
//   }
// };

// const getAllMenuTypes = async (req, res) => {
//   const { searchItem } = req.query;
// console.log(searchItem );
//   try {
//       let getAllMenuTypesQuery;
//       let queryParams;

//       if (!searchItem) {
//           // If no searchItem is provided, fetch all menu types
//           getAllMenuTypesQuery = `
//               SELECT * FROM tbl_menutype

//           `;
//           queryParams = [];
//       } else {
//           // If searchItem is provided, search by menutype
//           getAllMenuTypesQuery = `
//               SELECT * FROM tbl_menutype
//               WHERE menutype LIKE ?
//           `;
//           // Add wildcard characters to the search term for partial matching
//           const searchQuery = `%${searchItem}%`;
//           queryParams = [searchQuery];
//       }
//       getAllMenuTypesQuery+=`  ORDER BY menutypeid DESC`

//       // Execute the query
//       db.pool.query(getAllMenuTypesQuery, queryParams, (err, results) => {
//           if (err) {
//               console.error("Database error:", err);
//               res.status(500).json({
//                   success: false,
//                   message: "An error occurred while retrieving the menu types",
//                   error: err.message,
//               });
//           } else {
//               res.status(200).json({ success: true, data: results });
//           }
//       });
//   } catch (error) {
//       console.error("Server error:", error);
//       res.status(500).json({
//           success: false,
//           message: "An error occurred on the server",
//           error: error.message,
//       });
//   }
// };

// // PUT request to update a menu type by id
// const updateMenuType = async (req, res) => {
//   try {
//     const { menutypeid } = req.params;
//     const { menutype, status } = req.body;
//     const menu_icon = req.file ? req.file.filename : null;

//     const updateMenuTypeQuery = `
//       UPDATE tbl_menutype
//       SET menutype = ?, menu_icon = ?, status = ?
//       WHERE menutypeid = ?
//     `;
//     const values = [menutype, menu_icon, status, menutypeid];

//     db.pool.query(updateMenuTypeQuery, values, (err, result) => {
//       if (err) {
//         console.error("Database error:", err);
//         res.status(500).json({
//           success: false,
//           message: "An error occurred while updating the menu type",
//           error: err.message,
//         });
//       } else {
//         res
//           .status(200)
//           .json({ success: true, message: "Menu type updated successfully" });
//       }
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred on the server",
//       error: error.message,
//     });
//   }
// };

// // DELETE request to delete a menu type by id
// const deleteMenuType = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deleteMenuTypeQuery = "DELETE FROM tbl_menutype WHERE menutypeid = ?";

//     db.pool.query(deleteMenuTypeQuery, [id], (err, result) => {
//       if (err) {
//         console.error("Database error:", err);
//         res.status(500).json({
//           success: false,
//           message: "An error occurred while deleting the menu type",
//           error: err.message,
//         });
//       } else {
//         res
//           .status(200)
//           .json({ success: true, message: "Menu type deleted successfully" });
//       }
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred on the server",
//       error: error.message,
//     });
//   }
// };

// const getTableBySale = async (req, res) => {
//   try {
//     const { from, to } = req.query;

//     // Base SQL query
//     let sql = `
//       SELECT

//         t.tableid,
//         t.tablename,
//         co.order_id,
//         co.order_date,
//         SUM(co.totalamount) AS total_amount
//       FROM rest_table t
//       JOIN customer_order co ON co.table_no = t.tableid
//       JOIN bill b ON b.order_id = co.order_id
//       WHERE co.order_status = 4
//         AND b.bill_status = 1
//     `;

//     const params = [];

//     // Apply date filtering only if both from and to dates are provided
//     if (from && to) {
//       sql += ` AND co.order_date BETWEEN ? AND ?`;
//       params.push(from, to);
//     }

//     sql += ` GROUP BY t.tableid`;
//     sql += ` ORDER BY co.order_id DESC`;

//     // Debugging SQL and params
//     console.log('Final SQL:', sql);
//     console.log('Params:', params);

//     const results = await dbQuery(sql, params);

//     res.status(200).json({ success: true, data: results });
//   } catch (err) {
//     console.error('Error fetching table by sale report:', err);
//     res.status(500).json({ success: false, message: 'An error occurred while fetching the table by sale report' });
//   }
// };

// const getMenuTypeById = async (req, res) => {
//   const { id } = req.params; // Get the id from the request parameters

//   try {
//     const getMenuTypeByIdQuery = 'SELECT * FROM tbl_menutype WHERE menutypeid = ?'; // Using a placeholder for the id

//     db.pool.query(getMenuTypeByIdQuery, [id], (err, results) => {
//       if (err) {
//         console.error('Database error:', err);
//         res.status(500).json({ success: false, message: 'An error occurred while retrieving the menu type', error: err.message });
//       } else if (results.length === 0) {
//         res.status(404).json({ success: false, message: `Menu type with id ${id} not found` });
//       } else {
//         res.status(200).json({ success: true, data: results[0] }); // Return only the first result
//       }
//     });
//   } catch (error) {
//     console.error('Server error:', error);
//     res.status(500).json({ success: false, message: 'An error occurred on the server', error: error.message });
//   }
// };
// module.exports = {
//   deleteMenuType,
//   updateMenuType,
//   getAllMenuTypes,
//   createMenuType,
//   getTableBySale,
//   getMenuTypeById
// };

const db = require("../utils/db");

// const createMenuType = async (req, res) => {
//   try {
//     const { menutype, status } = req.body;
//     const menu_icon = req.file ? req.file.filename : null;

//     // Validate request body
//     if (!menutype) {
//       return res.status(400).json({ success: false, message: "Menu type is required" });
//     }

//     // SQL query to insert menu type data
//     const createMenuTypeQuery = `
//       INSERT INTO tbl_menutype (menutype, menu_icon, status)
//       VALUES (?, ?, ?)
//     `;
//     const values = [menutype, menu_icon, status];

//     // Execute query using a Promise wrapper
//     db.run(createMenuTypeQuery, values, function (err) {
//       if (err) {
//         console.error("Database error:", err);
//         return res.status(500).json({ success: false, message: "Failed to create menu type" });
//       }

//       res.status(201).json({ success: true, message: "Menu type created successfully", id: this.lastID });
//     });

//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred on the server",
//       error: error.message,
//     });
//   }
// };

const createMenuType = (req, res) => {
  try {
    const { menutype, status } = req.body;
    const user_id = req.id; // middleware se aayega

    // Validation
    if (!menutype) {
      return res.status(400).json({
        success: false,
        message: "Menu type is required",
      });
    }

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // Step 1: Check if current user has subscription
    const checkSubscriptionQuery = `
      SELECT * FROM superadmin_user_plans 
      WHERE user_id = ?
    `;

    db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
      if (err) {
        console.error("Subscription check error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      if (subscription) {
        // Current user has subscription
        return insertMenuType(user_id);
      }

      // Step 2: Check created_by of current user
      const checkCreatedByQuery = `
        SELECT created_by FROM user 
        WHERE id = ?
      `;

      db.get(checkCreatedByQuery, [user_id], (err, userData) => {
        if (err) {
          console.error("Created by check error:", err);
          return res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
          });
        }

        if (!userData || !userData.created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to create menu type",
          });
        }

        const created_by = userData.created_by;

        // Step 3: Check if creator has subscription
        db.get(
          checkSubscriptionQuery,
          [created_by],
          (err, creatorSubscription) => {
            if (err) {
              console.error("Creator subscription check error:", err);
              return res.status(500).json({
                success: false,
                message: "Database error",
                error: err.message,
              });
            }

            if (creatorSubscription) {
              // Use creator id
              return insertMenuType(created_by);
            }

            return res.status(403).json({
              success: false,
              message: "Creator does not have an active subscription",
            });
          },
        );
      });
    });

    // Insert function
    function insertMenuType(createdBy) {
      const query = `
        INSERT INTO tbl_menutype 
        (menutype, created_by, status) 
        VALUES (?, ?, ?)
      `;

      db.run(query, [menutype, createdBy, status], function (err) {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while creating the menu type",
            error: err.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Menu type created successfully",
          id: this.lastID,
        });
      });
    }
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred on the server",
      error: error.message,
    });
  }
};

const getAllMenuTypes = async (req, res) => {
  const { searchItem } = req.query;
  const userId = req.id; // auth middleware se aayega

  try {
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // Step 1: Get user role and created_by
    const userQuery = `
      SELECT is_admin, created_by 
      FROM user 
      WHERE id = ?
    `;

    db.get(userQuery, [userId], (err, userData) => {
      if (err) {
        console.error("User fetch error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error while fetching user info",
          error: err.message,
        });
      }

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const { is_admin, created_by } = userData;

      // If admin then own id, otherwise creator id
      const creatorId = is_admin === 1 ? userId : created_by;

      if (!creatorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to view menu types",
        });
      }

      // Step 2: Build query
      let getAllMenuTypesQuery = `
        SELECT * FROM tbl_menutype
        WHERE created_by = ?
      `;

      let queryParams = [creatorId];

      if (searchItem && searchItem.trim() !== "") {
        getAllMenuTypesQuery += `
          AND menutype LIKE ?
        `;
        queryParams.push(`%${searchItem}%`);
      }

      getAllMenuTypesQuery += `
        ORDER BY menutypeid DESC
      `;

      // Step 3: Execute query
      db.all(getAllMenuTypesQuery, queryParams, (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the menu types",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          data: rows,
        });
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
      error: error.message,
    });
  }
};

const updateMenuType = async (req, res) => {
  try {
    const { menutypeid } = req.params;
    const { menutype, status } = req.body;
    const menu_icon = req.file ? req.file.filename : null;

    const updateMenuTypeQuery = `
      UPDATE tbl_menutype
      SET menutype = ?, menu_icon = COALESCE(?, menu_icon), status = ?
      WHERE menutypeid = ?
    `;
    const values = [menutype, menu_icon, status, menutypeid];

    db.run(updateMenuTypeQuery, values, function (err) {
      if (err) {
        console.error("Error updating menu type:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while updating the menu type",
          error: err.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Menu type not found or no changes were made",
        });
      }

      res.status(200).json({
        success: true,
        message: "Menu type updated successfully",
      });
    });
  } catch (error) {
    console.error("Error updating menu type:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred on the server",
      error: error.message,
    });
  }
};

const deleteMenuType = async (req, res) => {
  try {
    const menutypeid = req.params.id;
    console.log(menutypeid);
    const deleteMenuTypeQuery = "DELETE FROM tbl_menutype WHERE menutypeid = ?";

    db.run(deleteMenuTypeQuery, [menutypeid], function (err) {
      if (err) {
        console.error("Error deleting menu type:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while deleting the menu type",
          error: err.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Menu type not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Menu type deleted successfully",
      });
    });
  } catch (error) {
    console.error("Error deleting menu type:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred on the server",
      error: error.message,
    });
  }
};

const getMenuTypeById = async (req, res) => {
  try {
    const menutypeid = req.params.id;

    const getMenuTypeByIdQuery =
      "SELECT * FROM tbl_menutype WHERE menutypeid = ?";

    db.all(getMenuTypeByIdQuery, [menutypeid], (err, results) => {
      if (err) {
        console.error("Error fetching menu type by ID:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching the menu type",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Menu type with ID ${menutypeid} not found`,
        });
      }

      res.status(200).json({ success: true, data: results[0] });
    });
  } catch (error) {
    console.error("Error fetching menu type by ID:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred on the server",
      error: error.message,
    });
  }
};

const getTableBySale = async (req, res) => {
  try {
    const { from, to } = req.query;

    let sql = `
      SELECT 
        t.tableid, 
        t.tablename,
        co.order_id,
        co.order_date,
        SUM(co.totalamount) AS total_amount
      FROM rest_table t
      JOIN customer_order co ON co.table_no = t.tableid
      JOIN bill b ON b.order_id = co.order_id
      WHERE co.order_status = 4 
        AND b.bill_status = 1
    `;

    const params = [];

    if (from && to) {
      sql += ` AND co.order_date BETWEEN ? AND ?`;
      params.push(from, to);
    }

    sql += ` GROUP BY t.tableid ORDER BY co.order_id DESC`;

    db.all(sql, params, (err, results) => {
      if (err) {
        console.error("Error fetching table by sale report:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching the table by sale report",
          error: err.message,
        });
      }

      res.status(200).json({ success: true, data: results });
    });
  } catch (error) {
    console.error("Error fetching table by sale report:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred on the server",
      error: error.message,
    });
  }
};

module.exports = {
  deleteMenuType,
  updateMenuType,
  getAllMenuTypes,
  createMenuType,
  getTableBySale,
  getMenuTypeById,
};
