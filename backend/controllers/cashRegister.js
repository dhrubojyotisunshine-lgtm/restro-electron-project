const db = require("../utils/db");

const dbQuery = (query, values) => {
  return new Promise((resolve, reject) => {
    db.run(query, values, function (err) {
      // Use `db.run` instead of `db.all` for INSERT queries in SQLite
      if (err) {
        console.error("Database error:", err);
        return reject(err);
      }
      resolve({ insertId: this.lastID }); // Correctly return the inserted ID in SQLite
    });
  });
};

const addCashRegisterDetail = async (req, res) => {
  const { opening_balance, openingnote } = req.body;
  const user_id = req.id;

  if (
    !user_id ||
    opening_balance === undefined ||
    opening_balance === null ||
    opening_balance === ""
  ) {
    return res.status(400).json({
      success: false,
      message: "User ID and opening balance are required",
    });
  }

  try {
    const note = openingnote || "";

    const checkUserQuery = `
      SELECT created_by, is_admin 
      FROM user 
      WHERE id = ?
    `;

    db.get(checkUserQuery, [user_id], async (err, userData) => {
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
          message: "User not found",
        });
      }

      const isAdmin = userData.is_admin;
      const created_by = userData.created_by;

      let ownerId;

      if (isAdmin === 1) {
        ownerId = user_id;
      } else {
        if (!created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to open cash register",
          });
        }

        ownerId = created_by;
      }

      const query = `
        INSERT INTO tbl_cashregister 
        (userid, opening_balance, closing_balance, opendate, status, openingnote, created_by)
        VALUES (?, ?, 0, CURRENT_TIMESTAMP, 1, ?, ?)
      `;

      db.run(query, [user_id, opening_balance, note, ownerId], function (err) {
        if (err) {
          console.error("Error inserting cash register detail:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to add cash register detail",
            error: err.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Cash register detail added successfully",
          data: { id: this.lastID },
        });
      });
    });
  } catch (error) {
    console.error("Error inserting cash register detail:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add cash register detail",
      error: error.message,
    });
  }
};

const recenttransaction = async (req, res) => {
  try {
    const id = req.id;

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
          message: "User not found",
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
            message: "You are not authorized to view transactions",
          });
        }

        ownerId = created_by;
      }

      const getCompleteOrders = `
        SELECT
          co.*,
          c.customer_name,
          w.firstname AS waiter_first_name,
          w.lastname AS waiter_last_name,
          rt.tablename,
          b.discount,
          b.service_charge,
          b.shipping_type,
          b.VAT,
          b.bill_amount,
          b.bill_date,
          b.bill_status,
          b.payment_method_id,
          sm.shipping_method AS shipping_method_name,
          ct.customer_type AS customer_type_name
        FROM customer_order co
        LEFT JOIN customer_info c ON co.customer_id = c.customer_id
        LEFT JOIN user w ON co.waiter_id = w.id
        LEFT JOIN rest_table rt ON co.table_no = rt.tableid
        LEFT JOIN bill b ON co.order_id = b.order_id
        LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id
        LEFT JOIN customer_type ct ON co.cutomertype = ct.customer_type_id
        WHERE co.order_status = 4
          AND b.bill_status = 1
          AND co.created_by = ?
        ORDER BY b.bill_date DESC, b.bill_time DESC
        LIMIT 15
      `;

      db.all(getCompleteOrders, [ownerId], (err, result) => {
        if (err) {
          console.error("Error fetching complete orders:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching complete orders.",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          data: result,
          message: "Complete orders fetched successfully",
        });
      });
    });
  } catch (error) {
    console.error("Error fetching complete orders:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching complete orders.",
      error: error.message,
    });
  }
};

// Promisify db methods
const dbGet = (sql, params) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const dbRun = (sql, params) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });

const getCashRegisterDetail = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(new Date().toLocaleString(), "ss", id);

    const now = new Date(); // Current timestamp

    // Step 1: Get the cash register row
    const cashRegisterQuery = `SELECT * FROM tbl_cashregister WHERE id = ?`;
    const cashRegister = await dbGet(cashRegisterQuery, [id]);

    if (!cashRegister) {
      return res.status(404).json({
        success: false,
        message: "No cash register found for the given ID.",
      });
    }

    console.log(cashRegister, "cashregister");

    const { opendate, opening_balance, userid } = cashRegister;

    const userQuery = `
  SELECT 
    TRIM(COALESCE(firstname, '') || ' ' || COALESCE(lastname, '')) AS username,
    email
  FROM user
  WHERE id = ?
`;
    const user = await dbGet(userQuery, [userid]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found for the given ID.",
      });
    }

    const formatDateTime = (dateTime) => {
      const dateObj = new Date(dateTime);
      const date = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
      const time = dateObj.toTimeString().split(" ")[0]; // HH:MM:SS
      return { date, time };
    };

    const openDateTime = formatDateTime(opendate);
    const closeDateTime = formatDateTime(now);

    // Step 3: Get total bill amount during the open-close window
    const billQuery = `
      SELECT SUM(bill.bill_amount) AS billAmount
      FROM bill
      WHERE bill.create_by = ?
        AND bill.bill_status = 1
        AND bill_date = ?
        AND bill.bill_time BETWEEN ? AND ?
    `;
    const billResult = await dbGet(billQuery, [
      userid,
      openDateTime.date,
      openDateTime.time,
      closeDateTime.time,
    ]);

    const billAmount = billResult?.billAmount || 0;

    // Step 4: Update closing balance and close date
    const updateQuery = `
      UPDATE tbl_cashregister 
      SET closing_balance = ?, closedate = ?
      WHERE id = ?
    `;
    await dbRun(updateQuery, [billAmount, now.toISOString(), id]);

    // Step 5: Respond with final result
    res.status(200).json({
      success: true,
      message: "Cash register details updated successfully.",
      data: {
        id: cashRegister.id,
        username: user.username,
        openBalance: opening_balance,
        closingBalance: billAmount,
        openDate: openDateTime.date,
        openTime: openDateTime.time,
        closeDate: closeDateTime.date,
        closeTime: closeDateTime.time,
        Email: user.email,
      },
    });
  } catch (error) {
    console.error("Error in getCashRegisterDetail:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the cash register details.",
      error: error.message,
    });
  }
};

const putCashRegisterDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { closedate, closing_note, closing_balance } = req.body;

    console.log(closedate, closing_note, closing_balance);

    // Validate required fields
    if (!closedate || !closing_note || closing_balance === undefined) {
      return res.status(400).json({
        success: false,
        message: "closedate, closing_note, and closing_balance are required.",
      });
    }

    // SQL Update Query
    const query = `
        UPDATE tbl_cashregister 
        SET closing_note = ?, closedate = ?, closing_balance = ?
        WHERE id = ?
      `;

    // Execute update query
    const result = await dbRun(query, [
      closing_note,
      closedate,
      closing_balance,
      id,
    ]);

    // Check if any rows were updated
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "No cash register record found with this ID.",
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: "Cash register details updated successfully.",
    });
  } catch (error) {
    console.error("Error updating cash register details:", error);
    res.status(500).json({
      success: false,
      message: "Error updating cash register details.",
      error: error.message,
    });
  }
};

module.exports = {
  addCashRegisterDetail,
  getCashRegisterDetail,
  putCashRegisterDetail,
  recenttransaction,
};
