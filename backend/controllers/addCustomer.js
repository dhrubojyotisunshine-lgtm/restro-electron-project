const db = require("../utils/db");
const fs = require("fs");
const path = require("path");

const getCustomers = async (req, res) => {
  try {
    const id = req.id;
    const { SearchItem } = req.query;

    // First, get user's role and creator info
    const userQuery = "SELECT created_by, is_admin FROM user WHERE id = ?";

    db.get(userQuery, [id], (err, userResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      if (!userResult) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isAdmin = userResult.is_admin;
      const creatorId = isAdmin === 1 ? id : userResult.created_by;

      if (!creatorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to customer data",
        });
      }

      let getCustomersQuery = `
        SELECT 
          customer_id, 
          customer_name, 
          customer_email, 
          customer_phone, 
          customer_address
        FROM customer_info
        WHERE created_by = ?
      `;

      let queryParams = [creatorId];

      if (SearchItem && SearchItem.trim() !== "") {
        const search = `%${SearchItem}%`;

        getCustomersQuery += `
          AND (
            customer_name LIKE ?
            OR customer_email LIKE ?
            OR customer_phone LIKE ?
            OR customer_address LIKE ?
          )
        `;

        queryParams.push(search, search, search, search);
      }

      getCustomersQuery += ` ORDER BY customer_id DESC`;

      db.all(getCustomersQuery, queryParams, (err, result) => {
        if (err) {
          console.error("Error fetching customers:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          data: result,
          message: "Customers fetched successfully",
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

const insertCustomer = (
  customer_name,
  customer_email,
  customer_address,
  customer_phone,
  created_by,
  res,
) => {
  const insertQuery = `
    INSERT INTO customer_info
    (customer_name, customer_email, customer_address, customer_phone, created_by)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(
    insertQuery,
    [customer_name, customer_email, customer_address, customer_phone, created_by],
    function (err) {
      if (err) {
        console.error("Error inserting customer:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to create customer",
          error: err.message,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Customer created successfully",
        customer_id: this.lastID,
      });
    },
  );
};

const createCustomer = async (req, res) => {
  try {
    const { customer_name, customer_email, customer_address, customer_phone } =
      req.body;

    const user_id = req.id;

    const checkSubscriptionQuery =
      "SELECT * FROM superadmin_user_plans WHERE user_id = ?";

    db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }

      if (subscription) {
        // User has own subscription
        return insertCustomer(
          customer_name,
          customer_email,
          customer_address,
          customer_phone,
          user_id,
          res,
        );
      }

      // Check user created_by
      const checkCreatedByQuery = "SELECT created_by FROM user WHERE id = ?";

      db.get(checkCreatedByQuery, [user_id], (err, userData) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            success: false,
            message: "Internal server error",
          });
        }

        if (!userData || !userData.created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to create customers.",
          });
        }

        const created_by = userData.created_by;

        db.get(
          checkSubscriptionQuery,
          [created_by],
          (err, creatorSubscription) => {
            if (err) {
              console.log(err);
              return res.status(500).json({
                success: false,
                message: "Internal server error",
              });
            }

            if (!creatorSubscription) {
              return res.status(403).json({
                success: false,
                message: "Your creator does not have an active subscription.",
              });
            }

            return insertCustomer(
              customer_name,
              customer_email,
              customer_address,
              customer_phone,
              created_by,
              res,
            );
          },
        );
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const getCustomerByIdQuery = `SELECT customer_id, customer_name, customer_email, customer_phone, customer_address FROM customer_info WHERE customer_id = ?`;

    db.all(getCustomerByIdQuery, [customer_id], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "An error occurred" });
      } else if (result.length === 0) {
        res.status(404).json({ success: false, message: "Customer not found" });
      } else {
        res.status(200).json({
          success: true,
          data: result[0],
          message: "Customer fetched successfully",
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};
const updateCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { customer_name, customer_email, customer_address, customer_phone } =
      req.body;

    console.log("Updating customer ID:", customer_id);

    // Fetch the current data of the customer
    const fetchCurrentDataSql =
      "SELECT * FROM customer_info WHERE customer_id = ?";
    db.get(fetchCurrentDataSql, [customer_id], (fetchErr, currentData) => {
      if (fetchErr) {
        console.error("Database fetch error: ", fetchErr);
        return res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }

      if (!currentData) {
        return res
          .status(404)
          .json({ success: false, message: "Customer not found" });
      }

      // Merge current and new data
      const updatedData = {
        customer_name:
          customer_name !== undefined
            ? customer_name
            : currentData.customer_name,
        customer_email:
          customer_email !== undefined
            ? customer_email
            : currentData.customer_email,
        customer_address:
          customer_address !== undefined
            ? customer_address
            : currentData.customer_address,
        customer_phone:
          customer_phone !== undefined
            ? customer_phone
            : currentData.customer_phone,
      };

      // Update the customer with the merged data
      const updateCustomerQuery = `
        UPDATE customer_info 
        SET customer_name = ?, customer_email = ?, customer_address = ?, customer_phone = ? 
        WHERE customer_id = ?
      `;

      db.run(
        updateCustomerQuery,
        [
          updatedData.customer_name,
          updatedData.customer_email,
          updatedData.customer_address,
          updatedData.customer_phone,
          customer_id,
        ],
        function (updateErr) {
          if (updateErr) {
            console.error("Database query error: ", updateErr);
            return res
              .status(500)
              .json({ success: false, message: "An error occurred" });
          }

          if (this.changes === 0) {
            return res.status(404).json({
              success: false,
              message: "Customer not found or no changes made",
            });
          }

          return res
            .status(200)
            .json({ success: true, message: "Customer updated successfully" });
        },
      );
    });
  } catch (error) {
    console.error("Update customer error: ", error);
    return res
      .status(500)
      .json({ success: false, message: "An error occurred" });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;

    const deleteCustomerQuery = `DELETE FROM customer_info WHERE customer_id = ?`;

    db.run(deleteCustomerQuery, [customer_id], function (err) {
      if (err) {
        console.error("Database query error: ", err);
        return res
          .status(500)
          .json({ success: false, message: "An error occurred" });
      }

      if (this.changes === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Customer not found" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Customer deleted successfully" });
    });
  } catch (error) {
    console.error("Delete customer error: ", error);
    return res
      .status(500)
      .json({ success: false, message: "An error occurred" });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  deleteCustomer,
  getCustomerById,
  updateCustomer,
};
