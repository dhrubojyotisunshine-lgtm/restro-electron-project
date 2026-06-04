const db = require("../utils/db");

const getAllRoles = async (req, res) => {
  try {
    const user_id = req.id;
    const { searchItem } = req.query;

    const checkUserQuery = `
      SELECT created_by, is_admin 
      FROM user 
      WHERE id = ?
    `;

    db.get(checkUserQuery, [user_id], (err, userData) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isAdmin = userData.is_admin;
      const created_by = userData.created_by;

      let getRolesQuery = `
        SELECT * 
        FROM sec_role_tbl
        WHERE 1 = 1
      `;

      const queryParams = [];

      if (isAdmin === 1) {
        getRolesQuery += ` AND create_by = ? `;
        queryParams.push(user_id);
      } else {
        if (!created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to view roles.",
          });
        }

        getRolesQuery += ` AND create_by = ? `;
        queryParams.push(created_by);
      }

      if (searchItem && searchItem.trim() !== "") {
        getRolesQuery += ` AND role_name LIKE ? `;
        queryParams.push(`%${searchItem.trim()}%`);
      }

      getRolesQuery += ` ORDER BY role_id DESC`;

      db.all(getRolesQuery, queryParams, (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching roles",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          data: results,
          message: "Roles fetched successfully",
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

const dbQuery = (query, values) => {
  return new Promise((resolve, reject) => {
    db.all(query, values, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

const deleteRolePermission = async (req, res) => {
  try {
    const { role_id } = req.params;

    const results = await dbQuery(
      "SELECT * FROM sec_role_tbl WHERE role_id = ?",
      [role_id],
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    await dbQuery("DELETE FROM sec_role_permission WHERE role_id = ?", [
      role_id,
    ]);
    await dbQuery("DELETE FROM sec_role_tbl WHERE role_id = ?", [role_id]);
    await dbQuery("DELETE FROM sec_user_access_tbl WHERE fk_role_id = ?", [
      role_id,
    ]);

    res.status(200).json({
      success: true,
      message: "Role and permissions deleted successfully",
    });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the role and permissions",
    });
  }
};

// get all menu type items

const getAllMenuItems = async (req, res) => {
  try {
    const { searchItem } = req.query;

    let getMenuItemsQuery;
    let queryParams = [];

    if (!searchItem || searchItem.trim() === "") {
      getMenuItemsQuery = "SELECT * FROM sec_menu_item";
    } else {
      getMenuItemsQuery = "SELECT * FROM sec_menu_item WHERE menu_title LIKE ?";
      const searchQuery = `%${searchItem}%`;
      queryParams = [searchQuery];
    }

    db.all(getMenuItemsQuery, queryParams, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching menu items",
        });
      }

      if (results.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "No menu items found",
        });
      }

      const parentMenuIds = results
        .map((item) => item.parent_menu)
        .filter(Boolean);

      if (parentMenuIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: results,
          message: "Menu items fetched successfully without parent menus",
        });
      }

      // Convert array of IDs to placeholders (?, ?, ?, ...)
      const placeholders = parentMenuIds.map(() => "?").join(",");
      const sql2 = `SELECT menu_id, menu_title FROM sec_menu_item WHERE menu_id IN (${placeholders})`;

      db.all(sql2, parentMenuIds, (err, menuTitles) => {
        if (err) {
          console.error("Second database query error:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching parent menu titles",
          });
        }

        const menuTitleMap = {};
        menuTitles.forEach((item) => {
          menuTitleMap[item.menu_id] = item.menu_title;
        });

        const itemsWithTitles = results.map((item) => ({
          ...item,
          parent_menu_title: menuTitleMap[item.parent_menu] || 0,
        }));

        res.status(200).json({
          success: true,
          data: itemsWithTitles,
          message: "Menu items fetched successfully",
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const getAllUserAccesses = (req, res) => {
  const id = req.id; // Authenticated user ID
  const { searchItem } = req.query;

  const checkUserQuery = `
    SELECT created_by, is_admin 
    FROM user 
    WHERE id = ?
  `;

  db.get(checkUserQuery, [id], (err, userData) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isAdmin = userData.is_admin;
    const created_by = userData.created_by;

    let sql = `
      SELECT 
        sec_user_access_tbl.role_acc_id, 
        sec_user_access_tbl.fk_role_id, 
        sec_user_access_tbl.fk_user_id, 
        user.firstname, 
        user.lastname, 
        sec_role_tbl.role_name
      FROM 
        sec_user_access_tbl
      LEFT JOIN 
        user ON sec_user_access_tbl.fk_user_id = user.id
      LEFT JOIN 
        sec_role_tbl ON sec_user_access_tbl.fk_role_id = sec_role_tbl.role_id
      WHERE 
        user.is_admin != 1
    `;

    const queryParams = [];

    // Admin can see only data created by themselves
    if (isAdmin === 1) {
      sql += ` AND sec_user_access_tbl.created_by = ? `;
      queryParams.push(id);
    } else {
      // Normal user can see data created by their admin
      if (!created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this data.",
        });
      }

      sql += ` AND sec_user_access_tbl.created_by = ? `;
      queryParams.push(created_by);
    }

    // Search validation
    if (searchItem && searchItem.trim() !== "") {
      sql += `
        AND (
          (user.firstname || ' ' || user.lastname) LIKE ? 
          OR sec_role_tbl.role_name LIKE ?
        )
      `;

      queryParams.push(`%${searchItem.trim()}%`, `%${searchItem.trim()}%`);
    }

    sql += ` ORDER BY sec_user_access_tbl.role_acc_id DESC`;

    db.all(sql, queryParams, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: results,
      });
    });
  });
};

const createUserAccess = (req, res) => {
  const { fk_role_ids, fk_user_id } = req.body;
  const user_id = req.id;

  if (!Array.isArray(fk_role_ids) || fk_role_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Role IDs should be a non-empty array",
    });
  }

  if (!fk_user_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  // Step 1: Check if logged-in user has subscription
  const checkSubscriptionQuery = `
    SELECT * 
    FROM superadmin_user_plans 
    WHERE user_id = ?
  `;

  db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
    if (err) {
      console.error("Subscription check error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error while checking subscription",
        error: err.message,
      });
    }

    if (subscription) {
      // Logged-in user has subscription
      return insertAccess(fk_role_ids, fk_user_id, user_id, res);
    }

    // Step 2: Check logged-in user created_by
    const checkUserCreatedByQuery = `
      SELECT created_by 
      FROM user 
      WHERE id = ?
    `;

    db.get(checkUserCreatedByQuery, [user_id], (err, userData) => {
      if (err) {
        console.error("User created_by check error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error while checking user creator",
          error: err.message,
        });
      }

      if (!userData || !userData.created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to create user access.",
        });
      }

      const created_by = userData.created_by;

      // Step 3: Check creator subscription
      const checkCreatorSubscriptionQuery = `
        SELECT * 
        FROM superadmin_user_plans 
        WHERE user_id = ?
      `;

      db.get(
        checkCreatorSubscriptionQuery,
        [created_by],
        (err, creatorSubscription) => {
          if (err) {
            console.error("Creator subscription check error:", err);
            return res.status(500).json({
              success: false,
              message: "Database error while checking creator subscription",
              error: err.message,
            });
          }

          if (creatorSubscription) {
            return insertAccess(fk_role_ids, fk_user_id, created_by, res);
          }

          return res.status(403).json({
            success: false,
            message: "Creator does not have an active subscription.",
          });
        },
      );
    });
  });
};

const deleteUserAccess = (req, res) => {
  const { role_acc_id } = req.params;
  const sql = "DELETE FROM sec_user_access_tbl WHERE role_acc_id = ?";

  db.run(sql, [role_acc_id], function (err) {
    if (err) {
      console.error("Database query error:", err);
      res.status(500).json({ success: false, message: "An error occurred" });
    } else if (this.changes === 0) {
      res.status(404).json({
        success: false,
        message: "User access record not found",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "User access deleted successfully",
      });
    }
  });
};

const editAccessRole = async (req, res) => {
  try {
    const fk_user_id = req.params.id;

    const accessInfoQuery = `
      SELECT srt.role_name, srt.role_id
      FROM sec_user_access_tbl suat 
      LEFT JOIN sec_role_tbl srt ON srt.role_id = suat.fk_role_id 
      WHERE suat.fk_user_id = ?
    `;

    const accessInfo = await dbQuery(accessInfoQuery, [fk_user_id]);

    const usernameQuery = `
      SELECT id, firstname, lastname 
      FROM user 
      WHERE id = ? AND is_admin != 1
    `;
    const userinfo = await dbQuery(usernameQuery, [fk_user_id]);

    if (!accessInfo || accessInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No role access info found for the given ID",
      });
    }

    const data = {
      accessInfo,
      userinfo,
    };

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching role access information.",
    });
  }
};

const updateUserAccess = async (req, res) => {
  const id = req.params.id;
  const { fk_role_ids, fk_user_id } = req.body;
  console.log("user id", fk_user_id);

  try {
    // First, delete the existing roles for the user
    const deleteQuery = "DELETE FROM sec_user_access_tbl WHERE fk_user_id = ?";
    await db.run(deleteQuery, [id]);

    // Insert the new roles for the user (SQLite doesn't support bulk insert with VALUES ?)
    const insertQuery =
      "INSERT INTO sec_user_access_tbl (fk_role_id, fk_user_id) VALUES (?, ?)";

    for (const role_id of fk_role_ids) {
      await db.run(insertQuery, [role_id, fk_user_id]);
    }

    res
      .status(200)
      .json({ success: true, message: "User access updated successfully" });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating user access",
    });
  }
};

const createRolePermission = async (req, res) => {
  try {
    const { role_name, role_description, permissions } = req.body;
    const user_id = req.id;

    if (!role_name || role_name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    const date_time = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Step 1: Check logged-in user subscription
    const checkSubscriptionQuery = `
      SELECT * 
      FROM superadmin_user_plans 
      WHERE user_id = ?
    `;

    db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
      if (err) {
        console.error("Subscription check error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error while checking subscription",
          error: err.message,
        });
      }

      if (subscription) {
        return insertRoleWithPermissions(
          role_name,
          role_description,
          permissions,
          user_id,
          date_time,
          res,
        );
      }

      // Step 2: Check logged-in user's created_by
      const checkUserCreatedByQuery = `
        SELECT created_by 
        FROM user 
        WHERE id = ?
      `;

      db.get(checkUserCreatedByQuery, [user_id], (err, userData) => {
        if (err) {
          console.error("User created_by check error:", err);
          return res.status(500).json({
            success: false,
            message: "Database error while checking user creator",
            error: err.message,
          });
        }

        if (!userData || !userData.created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to create role.",
          });
        }

        const created_by = userData.created_by;

        // Step 3: Check creator subscription
        const checkCreatorSubscriptionQuery = `
          SELECT * 
          FROM superadmin_user_plans 
          WHERE user_id = ?
        `;

        db.get(
          checkCreatorSubscriptionQuery,
          [created_by],
          (err, creatorSubscription) => {
            if (err) {
              console.error("Creator subscription check error:", err);
              return res.status(500).json({
                success: false,
                message: "Database error while checking creator subscription",
                error: err.message,
              });
            }

            if (!creatorSubscription) {
              return res.status(403).json({
                success: false,
                message: "Creator does not have an active subscription.",
              });
            }

            return insertRoleWithPermissions(
              role_name,
              role_description,
              permissions,
              created_by,
              date_time,
              res,
            );
          },
        );
      });
    });
  } catch (err) {
    console.error("Unexpected error:", err.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};
const getRolePermissionById = async (req, res) => {
  try {
    const role_id = req.params.role_id;
    console.log("role_id:", role_id);

    const role = await dbQuery("SELECT * FROM sec_role_tbl WHERE role_id = ?", [
      role_id,
    ]);

    console.log("Raw role:", role);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const permissionsQueryResult = await dbQuery(
      "SELECT * FROM sec_role_permission WHERE role_id = ?",
      [role_id],
    );

    res.status(200).json({
      success: true,
      data: {
        role,
        permissions: permissionsQueryResult,
      },
    });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred",
    });
  }
};

const updateRolePermission = async (req, res) => {
  try {
    const id = req.params.role_id;
    const { role_name, role_description, permissions } = req.body;
    const updated_by = req.id;
    console.log(updated_by, "up");
    const date_time = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Update role details
    db.run(
      `UPDATE sec_role_tbl 
       SET role_name = ?, role_description = ?, create_by = ?, date_time = ? 
       WHERE role_id = ?`,
      [role_name, role_description, updated_by, date_time, id],
      function (err) {
        if (err) {
          console.error("Error updating role:", err);
          return res
            .status(500)
            .json({ success: false, message: "Failed to update role" });
        }

        // First delete existing permissions for the role
        db.run(
          `DELETE FROM sec_role_permission WHERE role_id = ?`,
          [id],
          function (delErr) {
            if (delErr) {
              console.error("Error deleting existing permissions:", delErr);
              return res.status(500).json({
                success: false,
                message: "Failed to clear existing permissions",
              });
            }

            // No new permissions? Return success
            if (!permissions || permissions.length === 0) {
              return res.status(200).json({
                success: true,
                message: "Role updated without permissions",
              });
            }

            // Prepare new permissions
            const values = [];
            const placeholders = permissions.map((perm) => {
              values.push(
                id,
                perm.module_name,
                perm.can_access || 0,
                perm.can_create || 0,
                perm.can_edit || 0,
                perm.can_delete || 0,
                date_time,
                updated_by,
              );
              return "(?, ?, ?, ?, ?, ?, ?, ?)";
            });

            const insertQuery = `
              INSERT INTO sec_role_permission 
              (role_id, module_name, can_access, can_create, can_edit, can_delete, createdate, createby) 
              VALUES ${placeholders.join(", ")}
            `;

            db.run(insertQuery, values, function (insertErr) {
              if (insertErr) {
                console.error(
                  "Error inserting updated permissions:",
                  insertErr,
                );
                return res.status(500).json({
                  success: false,
                  message: "Failed to insert updated permissions",
                });
              }

              return res.status(200).json({
                success: true,
                message: "Role and permissions updated successfully",
              });
            });
          },
        );
      },
    );
  } catch (err) {
    console.error("Unexpected error:", err.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

module.exports = {
  getAllRoles,
  deleteRolePermission,
  getAllMenuItems,
  getAllUserAccesses,
  deleteUserAccess,
  createUserAccess,
  editAccessRole,
  updateUserAccess,
  createRolePermission,
  getRolePermissionById,
  updateRolePermission,
};
