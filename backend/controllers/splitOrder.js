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

const showsplitorder = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // ORDER DETAILS
    const orderQuery = `
      SELECT co.*, b.*
      FROM customer_order co
      LEFT JOIN bill b ON b.order_id = co.order_id
      WHERE co.order_id = ?
    `;

    db.get(orderQuery, [orderId], (err, orderResult) => {
      if (err) return res.status(500).json({ message: "Error fetching order" });

      if (!orderResult) {
        return res.status(404).json({ message: "Order not found" });
      }

      const menuQuery = `
  SELECT
    s.sub_id,
    s.order_menu_id,
    s.menu_qty,
    s.varient_id,
    v.variantName,
    f.ProductsID,
    f.ProductName,
    f.productvat,
    s.total_price,
    GROUP_CONCAT(a.add_on_id) AS add_on_ids,
    GROUP_CONCAT(a.add_on_name) AS add_on_names,
    GROUP_CONCAT(a.price) AS add_on_prices,
    s.adons_qty AS addonsqty
  FROM sub_order s

  LEFT JOIN item_foods f
    ON s.order_menu_id = f.ProductsID

  LEFT JOIN variant v
    ON s.varient_id = v.variantid

  LEFT JOIN add_ons a
    ON s.adons_id IS NOT NULL
    AND ',' || s.adons_id || ',' LIKE '%,' || a.add_on_id || ',%'

  WHERE s.order_id = ? AND s.status = 0

  GROUP BY s.sub_id
`;

      db.all(menuQuery, [parseInt(orderId, 10)], (err, menuItems) => {
        if (err) return res.status(500).json({ message: "Menu error" });

        const structured = menuItems.map((item) => {
          const ids = item.add_on_ids?.split(",") || [];
          const names = item.add_on_names?.split(",") || [];
          const prices = item.add_on_prices?.split(",") || [];
          const qtys = item.addonsqty?.split(",") || [];

          const addOns = ids.map((id, i) => ({
            id,
            name: names[i],
            price: Number(prices[i] || 0),
            quantity: Number(qtys[i] || 1),
          }));

          return {
            sub_id: item.sub_id,
            order_menu_id: item.order_menu_id,
            menu_qty: item.menu_qty,
            varient_id: item.varient_id,
            variantName: item.variantName,
            ProductName: item.ProductName,
            total_price: item.total_price,
            Product_vat: item.productvat,
            add_ons: addOns,
          };
        });

        res.json({
          success: true,
          order: orderResult,
          menuItems: structured,
        });
      });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const mergeMakePayment = (req, res) => {
  const orderIds = req.body.orderid;

  // Validate order IDs
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ message: "Invalid order IDs" });
  }

  console.log("Order IDs:", orderIds);

  const allOrder = orderIds.join(",");
  const { payment_method_id, paidAmount, discount } = req.body;

  console.log("Request Body:", req.body);

  // SQLite - Use placeholders for dynamic number of IDs
  const placeholders = orderIds.map(() => "?").join(", ");
  const checkOrderQuery = `SELECT * FROM customer_order WHERE order_id IN (${placeholders})`;

  db.all(checkOrderQuery, orderIds, (err, orderResult) => {
    if (err) {
      console.error("Error checking customer_order:", err);
      return res
        .status(500)
        .json({ success: false, message: "An error occurred" });
    }

    if (orderResult.length === 0) {
      console.log("Order not found for order IDs:", orderIds);
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Update customer_order
    const updateOrderQuery = `
        UPDATE customer_order 
        SET marge_order_id = ?, customerpaid = ?, order_status = 4 
        WHERE order_id IN (${placeholders})
      `;
    db.run(
      updateOrderQuery,
      [allOrder, paidAmount, ...orderIds],
      function (err) {
        if (err) {
          console.error("Error updating customer_order:", err);
          return res
            .status(500)
            .json({ success: false, message: "An error occurred" });
        }

        if (this.changes === 0) {
          console.log(
            "No rows updated in customer_order for order IDs:",
            orderIds,
          );
          return res.status(404).json({
            success: false,
            message: "No rows updated in customer_order",
          });
        }

        // If table_no is not 0, update rest_table
        const tableNos = orderResult
          .map((order) => order.table_no)
          .filter((table_no) => table_no !== 0);

        if (tableNos.length > 0) {
          const tablePlaceholders = tableNos.map(() => "?").join(", ");
          const updateTableQuery = `
            UPDATE rest_table 
            SET status = 0 
            WHERE tableid IN (${tablePlaceholders})
          `;
          db.run(updateTableQuery, tableNos, function (err) {
            if (err) {
              console.error("Error updating rest_table:", err);
              return res
                .status(500)
                .json({ success: false, message: "An error occurred" });
            }

            if (this.changes === 0) {
              console.log(
                "No rows updated in rest_table for table IDs:",
                tableNos,
              );
            }
          });
        }

        // Update bill table
        const updateBillQuery = `
          UPDATE bill
          SET
            payment_method_id = ?,
            bill_date = datetime('now'),
            bill_time = time('now'),
            discount = ?,      
            bill_amount = ?,
            bill_status = 1
          WHERE order_id IN (${placeholders})
        `;
        db.run(
          updateBillQuery,
          [payment_method_id, discount, paidAmount, ...orderIds],
          function (err) {
            if (err) {
              console.error("Error updating bill:", err);
              return res
                .status(500)
                .json({ success: false, message: "An error occurred" });
            }

            if (this.changes === 0) {
              console.log("No rows updated in bill for order IDs:", orderIds);
              return res
                .status(404)
                .json({ success: false, message: "No rows updated in bill" });
            }

            res
              .status(200)
              .json({ success: true, message: "Payment done successfully" });
          },
        );
      },
    );
  });
};

const paymentSplitOrder = async (req, res) => {
  const { sub_order_ids, paidAmount, payment_method_id, discount } = req.body;
console.log("=== paymentSplitOrder ===");
console.log("Payload:", req.body);
  if (
    !Array.isArray(sub_order_ids) ||
    sub_order_ids.length === 0 ||
    !Array.isArray(payment_method_id)
  ) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    // Step 1: Update discount and status for each sub_order_id
    for (const sub_id of sub_order_ids) {
      await new Promise((resolve, reject) => {
        
        db.run(
          "UPDATE sub_order SET discount = ?, status = 1 WHERE sub_id = ?",
          [discount, sub_id],
          function (err) {
            if (err) return reject(err);

            console.log(
              `UPDATE sub_order WHERE sub_id=${sub_id}, rows affected=${this.changes}`
            );

            resolve();
          }
        );
      });
    }

    // Step 2: Fetch sub_order details
    const subOrderDetails = await Promise.all(
      sub_order_ids.map(
        (sub_id) =>
          new Promise((resolve, reject) => {
         
            db.get(
                "SELECT * FROM sub_order WHERE sub_id = ?",
                [sub_id],
                (err, row) => {

                  console.log("Searching sub_id:", sub_id);
                  console.log("Result:", row);

                  if (err) return reject(err);

                  if (!row) {
                    console.log("Sub-order not found for sub_id:", sub_id);
                    db.all(
                      "SELECT rowid, * FROM sub_order ORDER BY rowid DESC LIMIT 20",
                      (dumpErr, dumpRows) => {
                        console.log(
                          "Last 20 sub_order rows by rowid:",
                          dumpErr ? dumpErr.message : dumpRows
                        );
                      }
                    );
                    return reject(new Error("Sub-order not found"));
                  }

                  resolve(row);
                }
              );
          }),
      ),
    );

    const order_id = subOrderDetails[0].order_id;
    const menu_ids = subOrderDetails.map((row) => row.order_menu_id);
    console.log("subOrderDetails:", subOrderDetails);
    console.log("order_id:", order_id, typeof order_id);

    // Step 3: Update order_menu food status
    const placeholders = menu_ids.map(() => "?").join(",");
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE order_menu SET food_status = 1 WHERE order_id = ? AND menu_id IN (${placeholders})`,
        [order_id, ...menu_ids],
        (err) => {
          if (err) return reject(err);
          resolve();
        },
      );
    });

    // Step 4: Fetch bill details
    const billInfo = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM bill WHERE order_id = ?",
        [order_id],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return reject(new Error("Bill not found"));
          resolve(row);
        },
      );
    });

    const bill_id = billInfo.bill_id;

    // Step 5: Insert into multipay_bill
    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO multipay_bill (order_id, multipayid, payment_type_id, amount) VALUES (?, ?, ?, ?)",
        [order_id, bill_id, payment_method_id[0], paidAmount],
        (err) => {
          if (err) return reject(err);
          resolve();
        },
      );
    });

    // Step 6: Update customer_order
    await new Promise((resolve, reject) => {
      db.run(
        "UPDATE customer_order SET splitpay_status = 1, invoiceprint = 2 WHERE order_id = ?",
        [order_id],
        (err) => {
          if (err) return reject(err);
          resolve();
        },
      );
    });

    // Step 7: Check for any remaining sub_orders with status = 0
    const totalOrder = await new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) AS total FROM sub_order WHERE status = 0 AND order_id = ?",
        [order_id],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        },
      );
    });

    if (totalOrder.total === 0) {
      const totalDiscount = await new Promise((resolve, reject) => {
        db.get(
          "SELECT SUM(discount) AS totaldiscount FROM sub_order WHERE order_id = ?",
          [order_id],
          (err, row) => {
            if (err) return reject(err);
            resolve(row.totaldiscount || 0);
          },
        );
      });

      const billDetails = await new Promise((resolve, reject) => {
        db.get(
          "SELECT bill_amount FROM bill WHERE order_id = ?",
          [order_id],
          (err, row) => {
            if (err) return reject(err);
            resolve(row.bill_amount);
          },
        );
      });

      const orderResult = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM customer_order WHERE order_id = ?",
          [order_id],
          (err, row) => {
            if (err) return reject(err);
            resolve(row);
          },
        );
      });

      // Release table if table_no is not 0
      if (orderResult && orderResult.table_no !== 0) {
        await new Promise((resolve, reject) => {
          db.run(
            "UPDATE rest_table SET status = 0, occupied_seats = 0 WHERE tableid = ?",
            [orderResult.table_no],
            (err) => {
              if (err) return reject(err);
              resolve();
            },
          );
        });
      }

      // Update customer_order status
      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE customer_order SET order_status = 4 WHERE order_id = ?",
          [order_id],
          (err) => {
            if (err) return reject(err);
            resolve();
          },
        );
      });

      // Update bill with discount and payment
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE bill SET bill_status = ?, discount = ?, bill_amount = ?, payment_method_id = ?, create_at = ? WHERE order_id = ?`,
          [
            1,
            totalDiscount,
            billDetails - totalDiscount,
            payment_method_id[0],
            new Date().toISOString(),
            order_id,
          ],
          (err) => {
            if (err) return reject(err);
            resolve();
          },
        );
      });

      // Delete table_details
      await new Promise((resolve, reject) => {
        db.run(
          "DELETE FROM table_details WHERE order_id = ?",
          [order_id],
          (err) => {
            if (err) return reject(err);
            resolve();
          },
        );
      });

      const finalBill = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM bill WHERE order_id = ?",
          [order_id],
          (err, row) => {
            if (err) return reject(err);
            resolve(row);
          },
        );
      });

      return res.status(200).json({
        message: "Order processed successfully",
        finalBillAmount: finalBill.bill_amount,
        splitpay_status: orderResult.splitpay_status,
      });
    } else {
      return res.status(200).json({
        message: "Partial payment received, awaiting remaining payments",
        splitpay_status: 1,
      });
    }
  } catch (error) {
    console.error("Error processing the order:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  showsplitorder,
  mergeMakePayment,
  paymentSplitOrder,
};
