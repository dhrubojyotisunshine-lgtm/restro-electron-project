const db = require("../utils/db");
const dbQuery = (query, values) => {
  return new Promise((resolve, reject) => {
    db.pool.query(query, values, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};
const getAllShippingMethods = async (req, res) => {
  try {
    const user_id = req.id;

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

      let query = `
        SELECT * 
        FROM shipping_method
        WHERE 1 = 1
      `;

      const queryParams = [];

      if (isAdmin === 1) {
        query += ` AND created_by = ? `;
        queryParams.push(user_id);
      } else {
        if (!created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to view shipping methods.",
          });
        }

        query += ` AND created_by = ? `;
        queryParams.push(created_by);
      }

      query += ` ORDER BY ship_id DESC`;

      db.all(query, queryParams, (err, results) => {
        if (err) {
          console.error("Failed to fetch shipping methods:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to fetch shipping methods",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          data: results,
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

const createShippingMethod = async (req, res) => {
  try {
    const { shipping_method, shippingrate, is_active } = req.body;
    const user_id = req.id;

    if (!shipping_method || shipping_method.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Shipping method is required",
      });
    }

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
        return insertShippingMethod(
          shipping_method,
          shippingrate,
          is_active,
          user_id,
          res,
        );
      }

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
            message: "You are not authorized to create shipping method.",
          });
        }

        const created_by = userData.created_by;

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

            return insertShippingMethod(
              shipping_method,
              shippingrate,
              is_active,
              created_by,
              res,
            );
          },
        );
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

const insertShippingMethod = (
  shipping_method,
  shippingrate,
  is_active,
  created_by,
  res,
) => {
  const query = `
    INSERT INTO shipping_method 
    (shipping_method, shippingrate, is_active, created_by)
    VALUES (?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      shipping_method.trim(),
      shippingrate || 0,
      is_active !== undefined ? is_active : 1,
      created_by,
    ],
    function (err) {
      if (err) {
        console.error("Error creating shipping method:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to create shipping method",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Shipping method created successfully",
        id: this.lastID,
        affectedRows: this.changes,
      });
    },
  );
};
const deleteShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const query = "DELETE FROM shipping_method WHERE ship_id = ?";
    db.run(query, [id], (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({
          success: false,
          message: "Failed to delete shipping method",
        });
      } else {
        res.status(200).json({
          success: true,
          message: "Shipping method deleted successfully",
        });
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};
const getShippingMethodById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = "SELECT * FROM shipping_method WHERE ship_id = ?";

    db.all(query, [id], (err, result) => {
      if (err) {
        console.error("Database query error: ", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to fetch shipping method" });
      }

      if (!result) {
        return res
          .status(404)
          .json({ success: false, message: "Shipping method not found" });
      }

      return res.status(200).json({ success: true, data: result });
    });
  } catch (error) {
    console.error("Unexpected error: ", error);
    return res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};
const updateShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { shipping_method, shippingrate, is_active } = req.body;

    const query = `UPDATE shipping_method 
                     SET shipping_method = ?, shippingrate = ?, is_active = ?
                     WHERE ship_id = ?`;

    db.run(
      query,
      [shipping_method, shippingrate, is_active, id],
      function (err) {
        if (err) {
          console.error("Database query error: ", err);
          return res.status(500).json({
            success: false,
            message: "Failed to update shipping method",
          });
        }

        if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Shipping method not found" });
        }

        return res.status(200).json({
          success: true,
          message: "Shipping method updated successfully",
        });
      },
    );
  } catch (error) {
    console.error("Unexpected error: ", error);
    return res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};

module.exports = {
  getAllShippingMethods,
  createShippingMethod,
  deleteShippingMethod,
  getShippingMethodById,
  updateShippingMethod,
};
