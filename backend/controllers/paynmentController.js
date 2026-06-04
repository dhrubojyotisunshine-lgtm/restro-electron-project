const db = require("../utils/db");

// const getPaymentMethods = (req, res) => {
//   const sql = "SELECT *  FROM payment_method WHERE is_active = 1";

const getPaymentMethods = (req, res) => {
 const sql = "SELECT * FROM payment_method WHERE is_active = '1'";

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(rows);
  });
}

const makePayment = (req, res) => {
  const { order_id } = req.params;
  const { payment_method_id, paidAmount, discount, service_charge } = req.body;

  console.log(req.body);

  const checkOrderQuery = "SELECT * FROM customer_order WHERE order_id = ?";
  db.get(checkOrderQuery, [order_id], (err, orderResult) => {
    if (err) {
      console.error("Error checking customer_order:", err);
      return res
        .status(500)
        .json({
          success: false,
          message: "An error occurred while checking order.",
        });
    }

    if (!orderResult) {
      console.log("Order not found for order_id:", order_id);
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const updateOrderQuery = `UPDATE customer_order SET customerpaid = ?, order_status = 4 WHERE order_id = ?`;
    db.run(updateOrderQuery, [paidAmount, order_id], function (err) {
      if (err) {
        console.error("Error updating customer_order:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "An error occurred while updating customer_order.",
          });
      }

      if (this.changes === 0) {
        console.log(
          "No rows updated in customer_order for order_id:",
          order_id
        );
        return res
          .status(404)
          .json({
            success: false,
            message: "No rows updated in customer_order.",
          });
      }

      const table_no = orderResult.table_no;

      // Update rest_table if table_no is not 0
      const updateTable =
        table_no !== 0
          ? new Promise((resolve, reject) => {
              const updateTableQuery = `UPDATE rest_table SET status = 0 WHERE tableid = ?`;
              db.run(updateTableQuery, [table_no], function (err) {
                if (err) {
                  console.error("Error updating rest_table:", err);
                  reject({
                    success: false,
                    message: "An error occurred while updating rest_table.",
                  });
                } else if (this.changes === 0) {
                  console.log(
                    "No rows updated in rest_table for tableid:",
                    table_no
                  );
                  reject({
                    success: false,
                    message: "No rows updated in rest_table.",
                  });
                } else {
                  resolve();
                }
              });
            })
          : Promise.resolve();

      updateTable
        .then(() => {
          const updateBillQuery = `
          UPDATE bill
          SET
            payment_method_id = ?,
            bill_date = DATE('now'),
            service_charge = ?,
            bill_time = TIME('now'),
            discount = ?,      
            bill_amount = ?,
            bill_status = 1
          WHERE order_id = ?
        `;

          db.run(
            updateBillQuery,
            [payment_method_id, service_charge, discount, paidAmount, order_id],
            function (err) {
              if (err) {
                console.error("Error updating bill:", err);
                return res
                  .status(500)
                  .json({
                    success: false,
                    message: "An error occurred while updating bill.",
                  });
              }

              if (this.changes === 0) {
                console.log("No rows updated in bill for order_id:", order_id);
                return res
                  .status(404)
                  .json({
                    success: false,
                    message: "No rows updated in bill.",
                  });
              }

              res
                .status(200)
                .json({ success: true, message: "Payment done successfully." });
            }
          );
        })
        .catch((error) => {
          return res.status(500).json(error);
        });
    });
  });
};

module.exports = { getPaymentMethods, makePayment };
