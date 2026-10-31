const db = require("../utils/db");
const axios = require("axios");
const LIVE_API_URL = "https://krayon.softwarestesting.co.in/api";

// const draftOrderPlace = (req, res) => {
//     const {
//       customer_id,
//       customer_type,
//       waiter_id,
//       order_details,
//       grand_total,
//       service_charge,
//       VAT,
//       discount,
//       table_id,

//     } = req.body;
//     const create_by=req.id;

//     // Ensure waiter_id and table_id default to 0 if not provided
//     const waiterId = waiter_id || 0;
//     const tableId = table_id || 0;

//     // Get the max order ID
//     const maxOrderIdQuery =
//       "SELECT MAX(order_id) AS maxOrderId FROM customer_order";
//     db.pool.query(maxOrderIdQuery, (err, result) => {
//       if (err) {
//         console.error("Error getting max order ID:", err);
//         return res.status(500).json({ message: "Internal server error" });
//       }

//       const maxOrderId = result[0].maxOrderId;
//       const invoiceId = maxOrderId ? maxOrderId + 1 : 1;

//       const isthirdparty = customer_type === 3 ? 3 : 0;

//       const orderQuery = `INSERT INTO customer_order(saleinvoice, customer_id, cutomertype, isthirdparty, waiter_id, order_date, order_time, table_no, totalamount, order_status, orderacceptreject, splitpay_status)
//                             VALUES (?, ?, ?, ?, ?, NOW(), CURTIME(), ?, ?, 6, 1, 0)`;
//       db.pool.query(
//         orderQuery,
//         [
//           invoiceId,
//           customer_id,
//           customer_type,
//           isthirdparty,
//           waiterId,
//           tableId,
//           grand_total,
//         ],
//         (err, result) => {
//           if (err) {
//             console.error("Error inserting order:", err);
//             return res.status(500).json({ message: "Internal server error" });
//           }

//           const orderId = result.insertId;

//           const orderDetailsQuery =
//             "INSERT INTO order_menu(order_id, menu_id, price, menuqty, add_on_id, addonsqty, varientid, food_status, allfoodready) VALUES ?";
//           const orderDetailsData = order_details.map((detail) => {
//             const addOnIds = detail.addons
//               .map((addon) => addon.add_on_id)
//               .join(",");
//             const addOnQuantities = detail.addons
//               .map((addon) => addon.add_on_quantity)
//               .join(",");

//             return [
//               orderId,
//               detail.ProductsID,
//               detail.price,
//               detail.quantity,
//               addOnIds,
//               addOnQuantities,
//               detail.variantid,
//               0, // food_status
//               0, // allfoodready
//             ];
//           });

//           db.pool.query(orderDetailsQuery, [orderDetailsData], (err, result) => {
//             if (err) {
//               console.error("Error inserting order details:", err);
//               return res.status(500).json({ message: "Internal server error" });
//             }

//             // Update the table status to 1 (booked)
//             const updateTableStatusQuery =
//               "UPDATE rest_table SET status = 1 WHERE tableid = ?";
//             db.pool.query(updateTableStatusQuery, [table_id], (err, result) => {
//               if (err) {
//                 console.error("Error updating table status:", err);
//                 return res.status(500).json({ message: "Internal server error" });
//               }

//               const total_amount = grand_total - service_charge - VAT - discount;

//               let shipping_type;
//               switch (customer_type) {
//                 case 1:
//                   shipping_type = 3;
//                   break;
//                 case 2:
//                   shipping_type = 1;
//                   break;
//                 case 3:
//                   shipping_type = 1;
//                   break;
//                 case 99:
//                   shipping_type = 1;
//                   break;
//                 case 4:
//                   shipping_type = 2;
//                   break;
//                 default:
//                   shipping_type = null;
//               }

//               // Insert into bill table
//               const invoiceQuery =
//                 "INSERT INTO bill (customer_id,create_by, order_id, total_amount, discount, service_charge, shipping_type, VAT, bill_amount, bill_date, bill_time, create_at, bill_status, payment_method_id, create_date) VALUES (?, ?, ?,?, ?, ?, ?, ?, ?, NOW(), CURTIME(), NOW(), 0, 0, NOW())";
//               const bill_data = [
//                 customer_id,
//                 create_by,
//                 orderId,
//                 total_amount,
//                 discount,
//                 service_charge || 0.0,
//                 shipping_type,
//                 VAT || 0.0,
//                 grand_total,
//               ];

//               db.pool.query(invoiceQuery, bill_data, (err, result) => {
//                 if (err) {
//                   console.error("Error inserting invoice:", err);
//                   return res
//                     .status(500)
//                     .json({ message: "Internal server error" });
//                 }

//                 if (customer_type == 1 || customer_type == 99) {
//                   // Insert into table_details for customer_type 1 or 99
//                   const additionalQuery =
//                     "INSERT INTO table_details(table_id, customer_id, order_id, time_enter, created_at) VALUES (?, ?, ?, CURTIME(), NOW())";
//                   const additionalData = [table_id, customer_id, orderId];
//                   db.pool.query(additionalQuery, additionalData, (err, result) => {
//                     if (err) {
//                       console.error("Error inserting table data:", err);
//                       return res
//                         .status(500)
//                         .json({ message: "Internal server error" });
//                     }
//                   });
//                 }

//                 // Fetch the inserted customer_order data with additional information
//                 const fetchCustomerOrderDataQuery = `
//                   SELECT co.*, c.customer_name,
//                     w.firstname AS waiter_first_name,
//                     w.lastname AS waiter_last_name,
//                     ct.customer_type AS customer_type_name,
//                     CASE co.order_status
//                             WHEN 1 THEN 'Pending'
//                             WHEN 2 THEN 'Processing'
//                             WHEN 3 THEN 'Ready'
//                             WHEN 4 THEN 'Served'
//                             WHEN 5 THEN 'Cancel'
//                           END as order_status_name
//                   FROM customer_order co
//                   LEFT JOIN customer_info c ON co.customer_id = c.customer_id
//                   LEFT JOIN customer_type ct ON co.cutomertype = ct.customer_type_id
//                   LEFT JOIN user w ON co.waiter_id = w.id

//                   WHERE co.order_id = ?`;
//                 db.pool.query(
//                   fetchCustomerOrderDataQuery,
//                   [orderId],
//                   (err, customerOrderData) => {
//                     if (err) {
//                       console.error("Error fetching customer order data:", err);
//                       return res
//                         .status(500)
//                         .json({ message: "Internal server error" });
//                     }

//                     // Fetch the inserted order_menu data with additional information
//                     const fetchOrderMenuDataQuery = `
//                       SELECT om.*,
//                           f.ProductName,
//                           a.add_on_id,
//                           a.add_on_name,
//                           a.price AS addons_price,
//                           v.variantName,
//                           om.addonsqty
//                       FROM order_menu om
//                       LEFT JOIN item_foods f ON om.menu_id = f.ProductsID
//                       LEFT JOIN add_ons a ON FIND_IN_SET(a.add_on_id, om.add_on_id)
//                       LEFT JOIN variant v ON om.varientid = v.variantid
//                       WHERE om.order_id = ?
//                       ORDER BY om.row_id, FIND_IN_SET(a.add_on_id, om.add_on_id)`;
//                     db.pool.query(
//                       fetchOrderMenuDataQuery,
//                       [orderId],
//                       (err, rawOrderMenuData) => {
//                         if (err) {
//                           console.error("Error fetching order menu data:", err);
//                           return res
//                             .status(500)
//                             .json({ message: "Internal server error" });
//                         }

//                         // Process the raw order menu data to group add-ons
//                         const orderMenuData = [];
//                         const orderMenuMap = {};

//                         rawOrderMenuData.forEach((row) => {
//                           if (!orderMenuMap[row.row_id]) {
//                             orderMenuMap[row.row_id] = {
//                               row_id: row.row_id,
//                               order_id: row.order_id,
//                               menu_id: row.menu_id,
//                               ProductName: row.ProductName,
//                               price: row.price,
//                               groupmid: row.groupmid,
//                               notes: row.notes,
//                               menuqty: row.menuqty,
//                               add_on_id: row.add_on_id,
//                               addonsqty: row.addonsqty,
//                               varientid: row.varientid,
//                               groupvarient: row.groupvarient,
//                               addonsuid: row.addonsuid,
//                               qroupqty: row.qroupqty,
//                               isgroup: row.isgroup,
//                               food_status: row.food_status,
//                               allfoodready: row.allfoodready,
//                               isupdate: row.isupdate,
//                               variantName: row.variantName,
//                               addons: [],
//                             };
//                             orderMenuData.push(orderMenuMap[row.row_id]);
//                           }

//                           // Ensure add_on_id and addonsqty are strings before splitting
//                           const addOnIds = String(row.add_on_id).split(",");
//                           const addonQtyArray = String(row.addonsqty).split(",");

//                           addOnIds.forEach((id, index) => {
//                             if (row.add_on_name && row.addons_price) {
//                               orderMenuMap[row.row_id].addons.push({
//                                 add_on_id: id,
//                                 name: row.add_on_name,
//                                 price: row.addons_price,
//                                 quantity: addonQtyArray[index],
//                               });
//                             }
//                           });
//                         });

//                         // Fetch the inserted bill data
//                         const fetchBillDataQuery =
//                           "SELECT b.*, sm.shipping_method AS shipping_method_name FROM bill b LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id WHERE b.order_id = ?";
//                         db.pool.query(
//                           fetchBillDataQuery,
//                           [orderId],
//                           (err, billData) => {
//                             if (err) {
//                               console.error("Error fetching bill data:", err);
//                               return res
//                                 .status(500)
//                                 .json({ message: "Internal server error" });
//                             }

//                             res.status(201).json({
//                               message: "Order placed successfully",
//                               orderId,
//                               invoiceId,
//                               customerOrderData: customerOrderData[0],
//                               orderMenuData,
//                               billData: billData[0],
//                             });
//                           }
//                         );
//                       }
//                     );
//                   }
//                 );
//               });
//             });
//           });
//         }
//       );
//     });
//   };

const draftOrderPlace = (req, res) => {
  const {
    customer_id,
    customer_type,
    waiter_id,
    order_details,
    grand_total,
    service_charge,
    VAT,
    discount,
    table_id,
    persons = 1,
  } = req.body;

  const user_id = req.id;

  const checkSubscriptionQuery =
    "SELECT * FROM superadmin_user_plans WHERE user_id = ?";

  db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    if (subscription) {
      return placeDraftOrder(user_id);
    }

    const checkUserCreatedByQuery = "SELECT created_by FROM user WHERE id = ?";

    db.get(checkUserCreatedByQuery, [user_id], (err, userData) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (!userData || !userData.created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to place draft order.",
        });
      }

      const created_by = userData.created_by;

      db.get(
        checkSubscriptionQuery,
        [created_by],
        (err, creatorSubscription) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: err.message,
            });
          }

          if (!creatorSubscription) {
            return res.status(403).json({
              success: false,
              message: "Creator does not have an active subscription.",
            });
          }

          return placeDraftOrder(created_by);
        },
      );
    });
  });

  function placeDraftOrder(created_by) {
    // Invoice limit check against active subscription plan (uses live count from last sync)
    db.get(
      `SELECT sp.number_of_invoice FROM superadmin_user_plans sup
       JOIN subscription_plans sp ON sup.plan_id = sp.plan_id
       WHERE sup.user_id = ? AND sup.package_status = 'approved'
       ORDER BY sup.user_plan_id DESC LIMIT 1`,
      [created_by],
      (err, planRow) => {
        const invoiceLimit = planRow?.number_of_invoice ?? null;
        if (invoiceLimit !== null && invoiceLimit > 0) {
          // Local Electron orders + main website orders synced at last login = combined total
          db.get(
            "SELECT COUNT(*) AS invoice_count FROM customer_order WHERE created_by = ? AND order_status NOT IN (5, 6)",
            [created_by],
            (err2, localRow) => {
              const localCount = localRow?.invoice_count ?? 0;
              db.get(
                "SELECT live_order_count FROM restaurant_settings WHERE user_id = ? ORDER BY live_order_count DESC LIMIT 1",
                [created_by],
                (err3, usageRow) => {
                  const liveCount = usageRow?.live_order_count ?? 0;
                  const currentCount = localCount + liveCount;
                  console.log("[InvoiceLimit] local:", localCount, "| live:", liveCount, "| total:", currentCount, "| limit:", invoiceLimit);
                  if (currentCount >= invoiceLimit) {
                    return res.status(403).json({
                      success: false,
                      message: `Invoice limit reached (${currentCount}/${invoiceLimit}). Please upgrade your plan.`,
                    });
                  }
                  proceedWithDraftOrder();
                }
              );
            }
          );
        } else {
          proceedWithDraftOrder();
        }
      }
    );

    function proceedWithDraftOrder() {
    const update_by = req.id || 1;
    const update_date = new Date().toISOString().split("T")[0];

    const waiterId = waiter_id || 0;
    const tableId = table_id || 0;

    const maxOrderIdQuery =
      "SELECT MAX(order_id) AS maxOrderId FROM customer_order";

    db.get(maxOrderIdQuery, (err, result) => {
      if (err) {
        console.error("Error getting max order ID:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      const maxOrderId = result.maxOrderId;
      const invoiceId = maxOrderId ? maxOrderId + 1 : 1;
      const isthirdparty = customer_type === 3 ? 3 : 0;

      const orderQuery = `
        INSERT INTO customer_order(
          saleinvoice, customer_id, cutomertype, isthirdparty, waiter_id,
          order_date, order_time, table_no, totalamount, order_status,
          orderacceptreject, splitpay_status, created_by
        )
        VALUES (?, ?, ?, ?, ?, DATETIME('now'), TIME('now'), ?, ?, 6, 1, 0, ?)
      `;

      db.run(
        orderQuery,
        [
          invoiceId,
          customer_id,
          customer_type,
          isthirdparty,
          waiterId,
          tableId,
          grand_total,
          created_by,
        ],
        function (err) {
          if (err) {
            console.error("Error inserting order:", err);
            return res.status(500).json({ message: "Internal server error" });
          }

          const orderId = this.lastID;

          const orderDetailsData = order_details.map((detail) => {
            const addOnIds = detail.addons
              .map((addon) => addon.add_on_id)
              .join(",");

            const addOnQuantities = detail.addons
              .map((addon) => addon.add_on_quantity)
              .join(",");

            return [
              orderId,
              detail.ProductsID,
              detail.price,
              detail.quantity,
              addOnIds,
              addOnQuantities,
              detail.variantid ?? 0,
              0,
              0,
            ];
          });

          const placeholders = orderDetailsData
            .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .join(", ");

          const flattenedValues = orderDetailsData.flat();

          const orderDetailsQuery = `
            INSERT INTO order_menu(
              order_id, menu_id, price, menuqty, add_on_id,
              addonsqty, varientid, food_status, allfoodready
            )
            VALUES ${placeholders}
          `;

          db.run(orderDetailsQuery, flattenedValues, (err) => {
            if (err) {
              console.error("Error inserting order details:", err);
              return res.status(500).json({ message: "Internal server error" });
            }

            const orderDetailsData1 = order_details.map((detail) => {
              const addOnIds = detail.addons
                .map((addon) => addon.add_on_id)
                .join(",");

              const addOnQuantities = detail.addons
                .map((addon) => addon.add_on_quantity)
                .join(",");

              return [
                orderId,
                customer_id,
                VAT,
                discount,
                detail.ProductsID,
                detail.price,
                detail.quantity,
                addOnIds,
                addOnQuantities,
                0,
                detail.variantid,
              ];
            });

            const insertValues = orderDetailsData1
              .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
              .join(", ");

            const flattenedOrderDetails = orderDetailsData1.flat();

            const insertQuery = `
              INSERT INTO sub_order 
              (
                order_id, customer_id, vat, discount, order_menu_id,
                total_price, menu_qty, adons_id, adons_qty, status, varient_id
              )
              VALUES ${insertValues}
            `;

            db.run(insertQuery, flattenedOrderDetails, (err) => {
              if (err) {
                console.error("Error inserting sub order:", err);
                return res
                  .status(500)
                  .json({ message: "Internal server error" });
              }

              const updateTableStatusQuery = `
                UPDATE rest_table
                SET occupied_seats = CASE WHEN occupied_seats + ? >= person_capicity THEN person_capicity ELSE occupied_seats + ? END,
                    status = CASE
                      WHEN (occupied_seats + ?) >= person_capicity THEN 'booked'
                      WHEN (occupied_seats + ?) > 0 THEN 'partial'
                      ELSE 'free'
                    END
                WHERE tableid = ?`;

              db.run(updateTableStatusQuery, [persons, persons, persons, persons, tableId], (err) => {
                if (err) {
                  console.error("Error updating table status:", err);
                  return res
                    .status(500)
                    .json({ message: "Internal server error" });
                }

                const total_amount =
                  grand_total - service_charge - VAT - discount;

                let shipping_type;

                switch (customer_type) {
                  case 1:
                    shipping_type = 3;
                    break;
                  case 2:
                  case 3:
                  case 99:
                    shipping_type = 1;
                    break;
                  case 4:
                    shipping_type = 2;
                    break;
                  default:
                    shipping_type = null;
                }

                const invoiceQuery = `
                  INSERT INTO bill (
                    customer_id, create_by, update_by, update_date, order_id,
                    total_amount, discount, service_charge, shipping_type, VAT,
                    bill_amount, bill_date, bill_time, create_at,
                    bill_status, payment_method_id, create_date
                  )
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE('now'), TIME('now'), DATE('now'), 0, 0, DATE('now'))
                `;

                const bill_data = [
                  customer_id,
                  created_by,
                  update_by,
                  update_date,
                  orderId,
                  total_amount,
                  discount,
                  service_charge || 0.0,
                  shipping_type,
                  VAT || 0.0,
                  grand_total,
                ];

                db.run(invoiceQuery, bill_data, (err) => {
                  if (err) {
                    console.error("Error inserting invoice:", err);
                    return res
                      .status(500)
                      .json({ message: "Internal server error" });
                  }

                  if (customer_type === 1 || customer_type === 99) {
                    const additionalQuery = `
                      INSERT INTO table_details(
                        table_id, customer_id, order_id, time_enter, total_people, created_at
                      )
                      VALUES (?, ?, ?, TIME('now'), ?, DATETIME('now'))
                    `;

                    db.run(additionalQuery, [tableId, customer_id, orderId, persons], (err) => {
                      if (err) console.error("Error inserting table_details:", err);
                    });
                  }

                  const fetchCustomerOrderDataQuery = `
                    SELECT co.*, c.customer_name,
                      w.firstname AS waiter_first_name,
                      w.lastname AS waiter_last_name,
                      ct.customer_type AS customer_type_name
                    FROM customer_order co
                    LEFT JOIN customer_info c ON co.customer_id = c.customer_id
                    LEFT JOIN customer_type ct ON co.cutomertype = ct.customer_type_id
                    LEFT JOIN user w ON co.waiter_id = w.id
                    WHERE co.order_id = ?
                  `;

                  db.all(
                    fetchCustomerOrderDataQuery,
                    [orderId],
                    (err, customerOrderData) => {
                      if (err) {
                        return res
                          .status(500)
                          .json({ message: "Internal server error" });
                      }

                      const fetchBillDataQuery = `
                      SELECT b.*, sm.shipping_method AS shipping_method_name
                      FROM bill b
                      LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id
                      WHERE b.order_id = ?
                    `;

                      db.all(fetchBillDataQuery, [orderId], (err, billData) => {
                        if (err) {
                          return res
                            .status(500)
                            .json({ message: "Internal server error" });
                        }

                        // Fire-and-forget: push net electron-added order count to main website
                        (async () => {
                          try {
                            const usageRow = await new Promise((r) =>
                              db.get(
                                "SELECT live_order_count FROM restaurant_settings WHERE user_id = ? ORDER BY live_order_count DESC LIMIT 1",
                                [created_by], (e, row) => r(row)
                              )
                            );
                            const liveAtLogin = usageRow?.live_order_count ?? 0;
                            const countRow = await new Promise((r) =>
                              db.get(
                                "SELECT COUNT(*) AS c FROM customer_order WHERE created_by = ? AND order_status NOT IN (5, 6)",
                                [created_by], (e, row) => r(row)
                              )
                            );
                            const localCount = countRow?.c ?? 0;
                            const electronAdded = Math.max(0, localCount - liveAtLogin);
                            console.log("[ElectronSync] draft orders — local:", localCount, "| liveAtLogin:", liveAtLogin, "| electronAdded:", electronAdded);
                            const resp = await axios.post(`${LIVE_API_URL}/update-electron-counts`,
                              { user_id: created_by, electron_order_count: electronAdded },
                              { timeout: 5000 }
                            );
                            console.log("[ElectronSync] draft order push response:", resp.data);
                          } catch (e) {
                            console.log("[ElectronSync] draft order push FAILED:", e.message);
                          }
                        })();

                        return res.status(201).json({
                          success: true,
                          message: "Order placed successfully",
                          orderId,
                          invoiceId,
                          customerOrderData: customerOrderData[0],
                          billData: billData[0],
                        });
                      });
                    },
                  );
                });
              });
            });
          });
        },
      );
    });
    } // end proceedWithDraftOrder
  }
};

const dbQuery = (query, values) => {
  return new Promise((resolve, reject) => {
    db.all(query, values, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const updateOrder = async (req, res) => {
  const order_id = parseInt(req.params.id, 10);
  const {
    customer_id,
    customer_type,
    waiter_id,
    order_details,
    grand_total,
    service_charge = 0,
    VAT = 0,
    discount = 0,
    table_id,
    persons = 1,
  } = req.body;

  if (
    !order_id ||
    !customer_id ||
    !order_details ||
    !Array.isArray(order_details) ||
    !grand_total
  ) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  const waiterId = waiter_id || 0;
  const tableId = table_id || 0;
  const isthirdparty = customer_type === 3 ? 3 : 0;

  try {
    // Update customer_order
    const updateOrderQuery = `
      UPDATE customer_order 
      SET customer_id = ?, cutomertype = ?, isthirdparty = ?, waiter_id = ?, 
          order_date = DATETIME('now'), order_time = TIME('now'), table_no = ?, 
          totalamount = ?, order_status = 2, orderacceptreject = 1, splitpay_status = 0
      WHERE order_id = ?`;
    await dbQuery(updateOrderQuery, [
      customer_id,
      customer_type,
      isthirdparty,
      waiterId,
      tableId,
      grand_total,
      order_id,
    ]);

    // Delete existing order_menu
    await dbQuery("DELETE FROM order_menu WHERE order_id = ?", [order_id]);

    // Prepare insert for order_menu
    const orderDetailsValues = [];
    const orderDetailsPlaceholders = [];

    order_details.forEach((detail) => {
      const addOnIds = detail.addons.map((addon) => addon.add_on_id).join(",");
      const addOnQuantities = detail.addons
        .map((addon) => addon.add_on_quantity)
        .join(",");

      orderDetailsPlaceholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?)");
      orderDetailsValues.push(
        order_id,
        detail.ProductsID,
        detail.price,
        detail.quantity,
        addOnIds,
        addOnQuantities,
        detail.variantid ?? 0,
        0,
        0,
      );
    });

    const orderDetailsQuery = `
      INSERT INTO order_menu(order_id, menu_id, price, menuqty, add_on_id, addonsqty, varientid, food_status, allfoodready)
      VALUES ${orderDetailsPlaceholders.join(",")}`;
    await dbQuery(orderDetailsQuery, orderDetailsValues);
    await dbQuery("DELETE FROM sub_order WHERE order_id = ?", [order_id]);

    const subOrderData = [];
    const subOrderPlaceholders = [];

    order_details.forEach((detail) => {
      subOrderPlaceholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      subOrderData.push(
        order_id,
        customer_id,
        VAT,
        discount,
        0,
        detail.product_id || detail.ProductsID || null,
        detail.price,
        detail.quantity,
        detail.addons.map((addon) => addon.add_on_id).join(","),
        detail.addons.map((addon) => addon.add_on_quantity).join(","),
        0, // status
        detail.variantid,
      );
    });

    const subOrderQuery = `
      INSERT INTO sub_order (
        order_id, customer_id, vat, discount, s_charge, order_menu_id,
        total_price, menu_qty, adons_id, adons_qty, status, varient_id
      ) VALUES ${subOrderPlaceholders.join(",")}`;

    await dbQuery(subOrderQuery, subOrderData);

    // Update table status
    await dbQuery("UPDATE rest_table SET status = 1 WHERE tableid = ?", [
      table_id,
    ]);

    const total_amount = grand_total - service_charge - VAT - discount;
    let shipping_type = null;
    switch (customer_type) {
      case 1:
      case 2:
      case 3:
      case 99:
        shipping_type = 1;
        break;
      case 4:
        shipping_type = 2;
        break;
    }

    // Update bill table
    const updateBillQuery = `
      UPDATE bill 
      SET customer_id = ?, total_amount = ?, discount = ?, service_charge = ?, 
          shipping_type = ?, VAT = ?, bill_amount = ?, bill_date = DATETIME('now'), 
          bill_time = TIME('now'), create_at = DATETIME('now'), bill_status = 0, 
          payment_method_id = 0, create_date = DATETIME('now')
      WHERE order_id = ?`;
    await dbQuery(updateBillQuery, [
      customer_id,
      total_amount,
      discount,
      service_charge,
      shipping_type,
      VAT,
      grand_total,
      order_id,
    ]);

    // Insert into table_details if dine-in
    if (customer_type === 1 || customer_type === 99) {
      const additionalQuery = `
        INSERT INTO table_details(table_id, customer_id, order_id, time_enter, total_people, created_at)
        VALUES (?, ?, ?, TIME('now'), ?, DATETIME('now'))`;
      await dbQuery(additionalQuery, [table_id, customer_id, order_id, persons]);
    }

    // Create KOT items so kitchen sees this order
    const kotItems = {};
    for (const detail of order_details) {
      const foodRows = await dbQuery(
        "SELECT ProductName, kitchenid FROM item_foods WHERE ProductsID = ?",
        [detail.ProductsID]
      );
      const food = foodRows[0];
      const kitchenId = Number(food?.kitchenid);
      if (!kitchenId || isNaN(kitchenId)) continue;
      if (!kotItems[kitchenId]) kotItems[kitchenId] = [];
      kotItems[kitchenId].push({ name: food.ProductName, qty: detail.quantity });
    }

    await dbQuery("DELETE FROM kot_items WHERE order_id = ?", [order_id]);

    for (const [kitchenId, items] of Object.entries(kotItems)) {
      for (const item of items) {
        await dbQuery(
          "INSERT INTO kot_items(order_id, kitchen_id, item_name, qty, printed) VALUES (?, ?, ?, ?, ?)",
          [order_id, kitchenId, item.name, item.qty, 1]
        );
      }
    }

    // Fetch customer order
    const fetchCustomerOrderDataQuery = `
      SELECT co.*, c.customer_name,
        w.firstname AS waiter_first_name, w.lastname AS waiter_last_name,
        ct.customer_type AS customer_type_name,
        CASE co.order_status
            WHEN 1 THEN 'Pending'
            WHEN 2 THEN 'Processing'
            WHEN 3 THEN 'Ready'
            WHEN 4 THEN 'Served'
            WHEN 5 THEN 'Cancel'
            WHEN 6 THEN 'Hold'
        END AS order_status_name
      FROM customer_order co
      LEFT JOIN customer_info c ON co.customer_id = c.customer_id
      LEFT JOIN customer_type ct ON co.cutomertype = ct.customer_type_id
      LEFT JOIN user w ON co.waiter_id = w.id
      WHERE co.order_id = ?`;
    const customerOrderData = await dbQuery(fetchCustomerOrderDataQuery, [
      order_id,
    ]);

    // Fetch order menu
    const fetchOrderMenuDataQuery = `
      SELECT om.*, f.ProductName, a.add_on_id, a.add_on_name,
        a.price AS addons_price, v.variantName, om.addonsqty
      FROM order_menu om
      LEFT JOIN item_foods f ON om.menu_id = f.ProductsID
    
       LEFT JOIN add_ons a ON ',' || om.add_on_id || ',' LIKE '%,' || a.add_on_id || ',%'
      LEFT JOIN variant v ON om.varientid = v.variantid
      WHERE om.order_id = ?
      ORDER BY om.row_id`;
    const rawOrderMenuData = await dbQuery(fetchOrderMenuDataQuery, [order_id]);

    // Group order menu data
    const orderMenuData = [];
    const orderMenuMap = {};
    rawOrderMenuData.forEach((row) => {
      if (!orderMenuMap[row.row_id]) {
        orderMenuMap[row.row_id] = {
          row_id: row.row_id,
          order_id: row.order_id,
          menu_id: row.menu_id,
          ProductName: row.ProductName,
          price: row.price,
          menuqty: row.menuqty,
          varientid: row.varientid,
          variantName: row.variantName,
          food_status: row.food_status,
          allfoodready: row.allfoodready,
          addons: [],
        };
        orderMenuData.push(orderMenuMap[row.row_id]);
      }

      const addOnIds = String(row.add_on_id || "").split(",");
      const addonQtyArray = String(row.addonsqty || "").split(",");

      addOnIds.forEach((id, index) => {
        if (row.add_on_name && row.addons_price) {
          orderMenuMap[row.row_id].addons.push({
            add_on_id: id,
            name: row.add_on_name,
            price: row.addons_price,
            quantity: addonQtyArray[index],
          });
        }
      });
    });

    // Fetch bill shipping method
    const fetchBillDataQuery = `
      SELECT b.*, sm.shipping_method AS shipping_method_name 
      FROM bill b 
      LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id 
      WHERE b.order_id = ?`;
    const shipData = await dbQuery(fetchBillDataQuery, [order_id]);

    // Final response
    res.status(201).json({
      message: "Updated order successfully",
      data: {
        order_id,
        order: customerOrderData[0],
        invoiceId: customerOrderData[0].saleinvoice,
        orderdetails: orderMenuData,
        shipData: shipData[0],
      },
    });
  } catch (error) {
    console.error("Error in updateOrder function:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const updateOrder = async (req, res) => {
//   const order_id = req.params.id;
//   const {
//     customer_id,
//     customer_type,
//     waiter_id,
//     order_details,
//     grand_total,
//     service_charge,
//     VAT,
//     discount,
//     table_id,
//   } = req.body;

//   if (
//     !order_id ||
//     !customer_id ||
//     !order_details ||
//     !Array.isArray(order_details) ||
//     !grand_total
//   ) {
//     return res.status(400).json({ message: "Invalid request data" });
//   }

//   const waiterId = waiter_id || 0;
//   const tableId = table_id || 0;
//   const isthirdparty = customer_type === 3 ? 3 : 0;

//   try {
//     // Update customer_order table
//     const updateOrderQuery = `
//       UPDATE customer_order
//       SET customer_id = ?, cutomertype = ?, isthirdparty = ?, waiter_id = ?, order_date = NOW(), order_time = CURTIME(), table_no = ?, totalamount = ?, order_status=2, orderacceptreject=1, splitpay_status=0
//       WHERE order_id = ?`;
//     await dbQuery(updateOrderQuery, [
//       customer_id,
//       customer_type,
//       isthirdparty,
//       waiterId,
//       tableId,
//       grand_total,
//       order_id,
//     ]);

//     // Delete existing order_menu entries for this order_id
//     const deleteOrderDetailsQuery = "DELETE FROM order_menu WHERE order_id = ?";
//     await dbQuery(deleteOrderDetailsQuery, [order_id]);

//     // Insert new order details
//     const orderDetailsQuery = `
//       INSERT INTO order_menu(order_id, menu_id, price, menuqty, add_on_id, addonsqty, varientid, food_status, allfoodready)
//       VALUES ?`;

//     const orderDetailsData = order_details.map((detail) => {
//       const addOnIds = detail.addons.map((addon) => addon.add_on_id).join(",");
//       const addOnQuantities = detail.addons
//         .map((addon) => addon.add_on_quantity)
//         .join(",");
//       return [
//         order_id,
//         detail.ProductsID,
//         detail.price,
//         detail.quantity,
//         addOnIds,
//         addOnQuantities,
//         detail.variantid,
//         0,
//         0,
//       ];
//     });
//     await dbQuery(orderDetailsQuery, [orderDetailsData]);

//     // Update table status if necessary
//     const updateTableStatusQuery =
//       "UPDATE rest_table SET status = 1 WHERE tableid = ?";
//     await dbQuery(updateTableStatusQuery, [table_id]);

//     const total_amount = grand_total - service_charge - VAT - discount;
//     let shipping_type;
//     switch (customer_type) {
//       case 1:
//         shipping_type = 3;
//         break;
//       case 2:
//         shipping_type = 1;
//         break;
//       case 3:
//         shipping_type = 1;
//         break;
//       case 99:
//         shipping_type = 1;
//         break;
//       case 4:
//         shipping_type = 2;
//         break;
//       default:
//         shipping_type = null;
//     }

//     // Update bill table
//     const updateBillQuery = `
//       UPDATE bill
//       SET customer_id = ?, total_amount = ?, discount = ?, service_charge = ?, shipping_type = ?, VAT = ?, bill_amount = ?, bill_date = NOW(), bill_time = CURTIME(), create_at = NOW(),bill_status=0,payment_method_id=0,create_date = NOW()
//       WHERE order_id = ?`;
//     const billData = [
//       customer_id,
//       total_amount,
//       discount,
//       service_charge || 0.0,
//       shipping_type,
//       VAT || 0.0,
//       grand_total,
//       order_id,
//     ];
//     await dbQuery(updateBillQuery, billData);
//     console.log("hiiii",customer_type)

//     if (customer_type === 1 || customer_type === 99) {
//       console.log("customer",customer_type)
//       // Insert into table_details
//       const additionalQuery =
//         "INSERT INTO table_details(table_id, customer_id, order_id, time_enter, created_at) VALUES (?, ?, ?, CURTIME(), NOW())";
//       await dbQuery(additionalQuery, [table_id, customer_id, order_id]);
//     }

//     // Fetch customer order data
//     const fetchCustomerOrderDataQuery = `
//       SELECT co.*, c.customer_name,
//         w.firstname AS waiter_first_name,
//         w.lastname AS waiter_last_name,
//         ct.customer_type AS customer_type_name,
//         CASE co.order_status
//                 WHEN 1 THEN 'Pending'
//                 WHEN 2 THEN 'Processing'
//                 WHEN 3 THEN 'Ready'
//                 WHEN 4 THEN 'Served'
//                 WHEN 5 THEN 'Cancel'
//                 WHEN 6 THEN 'Hold'
//               END as order_status_name
//       FROM customer_order co
//       LEFT JOIN customer_info c ON co.customer_id = c.customer_id
//       LEFT JOIN customer_type ct ON co.cutomertype = ct.customer_type_id
//       LEFT JOIN user w ON co.waiter_id = w.id
//       WHERE co.order_id = ?`;
//     const customerOrderData = await dbQuery(fetchCustomerOrderDataQuery, [order_id]);

//     // Fetch order_menu data
//     const fetchOrderMenuDataQuery = `
//       SELECT om.*,
//           f.ProductName,
//           a.add_on_id,
//           a.add_on_name,
//           a.price AS addons_price,
//           v.variantName,
//           om.addonsqty
//       FROM order_menu om
//       LEFT JOIN item_foods f ON om.menu_id = f.ProductsID
//       LEFT JOIN add_ons a ON FIND_IN_SET(a.add_on_id, om.add_on_id)
//       LEFT JOIN variant v ON om.varientid = v.variantid
//       WHERE om.order_id = ?
//       ORDER BY om.row_id, FIND_IN_SET(a.add_on_id, om.add_on_id)`;
//     const rawOrderMenuData = await dbQuery(fetchOrderMenuDataQuery, [order_id]);

//     // Process the raw order menu data to group add-ons
//     const orderMenuData = [];
//     const orderMenuMap = {};
//     rawOrderMenuData.forEach((row) => {
//       if (!orderMenuMap[row.row_id]) {
//         orderMenuMap[row.row_id] = {
//           row_id: row.row_id,
//           order_id: row.order_id,
//           menu_id: row.menu_id,
//           ProductName: row.ProductName,
//           price: row.price,
//           groupmid: row.groupmid,
//           notes: row.notes,
//           menuqty: row.menuqty,
//           add_on_id: row.add_on_id,
//           addonsqty: row.addonsqty,
//           varientid: row.varientid,
//           groupvarient: row.groupvarient,
//           addonsuid: row.addonsuid,
//           qroupqty: row.qroupqty,
//           isgroup: row.isgroup,
//           food_status: row.food_status,
//           allfoodready: row.allfoodready,
//           isupdate: row.isupdate,
//           variantName: row.variantName,
//           addons: [],
//         };
//         orderMenuData.push(orderMenuMap[row.row_id]);
//       }
//       const addOnIds = String(row.add_on_id).split(",");
//       const addonQtyArray = String(row.addonsqty).split(",");
//       addOnIds.forEach((id, index) => {
//         if (row.add_on_name && row.addons_price) {
//           orderMenuMap[row.row_id].addons.push({
//             add_on_id: id,
//             name: row.add_on_name,
//             price: row.addons_price,
//             quantity: addonQtyArray[index],
//           });
//         }
//       });
//     });
//     const fetchBillDataQuery =
//     "SELECT b.*, sm.shipping_method AS shipping_method_name FROM bill b LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id WHERE b.order_id = ?";

//     const shipData= await dbQuery(fetchBillDataQuery,[order_id])

//     res.status(201).json({
//       message: "Updated order successfully",
//       data: {
//         order_id:order_id,
//         order: customerOrderData[0],
//         invoiceId:customerOrderData[0].saleinvoice,
//         orderdetails: orderMenuData,
//         shipData:shipData[0]
//       },
//     });
//   } catch (error) {
//     console.error("Error in updateOrder function:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const draftgetOrderById = async (req, res) => {
  const order_id = req.params.id;

  try {
    // Query to fetch order details
    const getOrderDetailsQuery = `
            SELECT
                co.*,
                c.customer_name,
                c.customer_email,
                c.customer_address,
                c.customer_phone,
                w.firstname AS waiter_first_name,
                w.lastname AS waiter_last_name,
                b.discount,
               
                b.shipping_type,
                b.VAT,
                b.bill_amount,
                b.bill_date,
                b.bill_status,
                b.payment_method_id,
                sm.shipping_method AS shipping_method_name,
                CASE co.order_status
                    WHEN 1 THEN 'Pending'
                    WHEN 2 THEN 'Processing'
                    WHEN 3 THEN 'Ready'
                    WHEN 4 THEN 'Served'
                    WHEN 5 THEN 'Cancel'
                    WHEN 6 THEN 'Hold'
                END as order_status_name
            FROM
                customer_order co
                LEFT JOIN customer_info c ON co.customer_id = c.customer_id
                LEFT JOIN user w ON co.waiter_id = w.id
                LEFT JOIN bill b ON co.order_id = b.order_id
                LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id
            WHERE
               co.order_id=?;
        `;

    // Query to fetch menu items associated with the order
    const getOrderMenuQuery = `
            SELECT
                om.*,
                f.*,
                v.variantName,
                GROUP_CONCAT(a.add_on_id) AS add_on_ids,
                GROUP_CONCAT(a.add_on_name) AS add_on_names,
                GROUP_CONCAT(a.price) AS add_on_prices
            FROM
                order_menu om
                LEFT JOIN add_ons a ON FIND_IN_SET(a.add_on_id, om.add_on_id)
                LEFT JOIN item_foods f ON om.menu_id = f.ProductsID
                LEFT JOIN variant v ON om.varientid = v.variantid
            WHERE
                om.order_id = ?
            GROUP BY om.menu_id, om.varientid;
        `;

    // Execute first query to get order details
    db.pool.query(getOrderDetailsQuery, [order_id], (err, orderResult) => {
      if (err) {
        console.error("Error fetching order details:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching order details",
        });
      }

      console.log("Order Details Result:", orderResult); // Debugging log
      // const order_id=orderResult[0].order_id;

      if (orderResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No order found with the given ID",
        });
      }

      // Execute second query to get menu items
      db.pool.query(getOrderMenuQuery, [order_id], (err, menuResult) => {
        if (err) {
          console.error("Error fetching menu items:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching menu items",
          });
        }

        console.log("Menu Items Result:", menuResult); // Debugging log

        // Process menuResult to structure add-on data
        const structuredMenuItems = menuResult.map((item) => {
          const addOnIds = item.add_on_ids ? item.add_on_ids.split(",") : [];
          const addOnNames = item.add_on_names
            ? item.add_on_names.split(",")
            : [];
          const addOnPrices = item.add_on_prices
            ? item.add_on_prices.split(",")
            : [];
          const addOnQuantities = item.addonsqty
            ? item.addonsqty.split(",")
            : [];

          const addOns = addOnIds.map((id, index) => ({
            add_on_id: id,
            add_on_name: addOnNames[index] || null,
            add_on_price: addOnPrices[index] || null,
            add_on_quantity: addOnQuantities[index] || null,
          }));

          return {
            ...item,
            add_ons: addOns,
          };
        });

        res.status(200).json({
          orderDetails: orderResult, // Return single object instead of array
          menuItems: structuredMenuItems,
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

const draftgetOrders = async (req, res) => {
  try {
    const user_id = req.id;

    const checkSubscriptionQuery =
      "SELECT * FROM superadmin_user_plans WHERE user_id = ?";

    db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (subscription) {
        return fetchDraftOrders(user_id, res);
      }

      const checkUserCreatedByQuery =
        "SELECT created_by FROM user WHERE id = ?";

      db.get(checkUserCreatedByQuery, [user_id], (err, userData) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message,
          });
        }

        if (!userData || !userData.created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to view draft orders.",
          });
        }

        const created_by = userData.created_by;

        db.get(
          checkSubscriptionQuery,
          [created_by],
          (err, creatorSubscription) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: err.message,
              });
            }

            if (!creatorSubscription) {
              return res.status(403).json({
                success: false,
                message: "Creator does not have an active subscription.",
              });
            }

            return fetchDraftOrders(created_by, res);
          },
        );
      });
    });
  } catch (error) {
    console.error("Error fetching draft orders:", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

function fetchDraftOrders(created_by, res) {
  const sql = `
    SELECT o.*, o.order_id, ci.customer_name, ctype.customer_type
    FROM customer_order o
    LEFT JOIN customer_info ci ON ci.customer_id = o.customer_id 
    LEFT JOIN customer_type ctype ON ctype.customer_type_id = o.cutomertype 
    WHERE o.order_status = 6
      AND o.created_by = ?
    ORDER BY o.order_id DESC
  `;

  db.all(sql, [created_by], (err, result) => {
    if (err) {
      console.error("Error fetching draft orders:", err.message);
      return res.status(500).json({
        message: "Internal Server Error",
        success: false,
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  });
}

module.exports = {
  draftOrderPlace,
  updateOrder,
  draftgetOrderById,
  draftgetOrders,
};
