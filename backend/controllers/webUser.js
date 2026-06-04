const db = require("../utils/db");
const jwt = require("jsonwebtoken");
const nodemailer=require('nodemailer')
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

  const JWT_SECRET = process.env.JWT_SECRET;

  const bcrypt = require('bcryptjs');
  const saltRounds = 10; // You can increase this value for more security

  const loginCustomer = async (req, res) => {
    try {
      const { customer_email, password } = req.body;
  
      console.log("email", customer_email, password);
      // Check if email exists in the database
      const findCustomerQuery = `SELECT * FROM customer_info WHERE customer_email = ?`;
      db.all(findCustomerQuery, [customer_email], async (err, results) => {
        if (err) {
          console.error("Database Error:", err);
          return res
            .status(500)
            .json({ success: false, message: "An error occurred" });
        }
  
        // If no user is found
        if (results.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }
  
        const customer = results[0];
  const payload = {
                id: customer.customer_id,
                email: customer.customer_email,
              };
    
              const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '3600s' });
              console.log(token,"customer")
        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, customer.password);
        if (!isPasswordValid) {
          return res
            .status(401)
            .json({ success: false, message: "Invalid credentials" });
        }
  
        // On successful login
        return res.status(200).json({
          success: true,
          message: "Login successful",
          data: {
            customer_id: customer.customer_id,
            customer_name: customer.customer_name,
            customer_email: customer.customer_email,
            customer_address:customer.customer_address,
            customer_picture:customer.customer_picture,
            customer_phone:customer.customer_phone,
            token:token
          },
        });
      });
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ success: false, message: "An error occurred" });
    }
  };
  const newCreateCustomer = async (req, res) => {
    try {
      const {
        customer_name,
        customer_email,
        customer_address,
        customer_phone,
        password,
      } = req.body;
  
      // Check if the email already exists in the database (SQLite)
      const checkEmailQuery = `SELECT * FROM customer_info WHERE customer_email = ?`;
      db.all(checkEmailQuery, [customer_email], async (err, result) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while checking the email.",
          });
        }
  
        if (result.length > 0) {
          // Email already exists
          return res
            .status(400)
            .json({ success: false, message: "Email already exists." });
        }
  
        // Hash the password
        const hashedpassword = await bcrypt.hash(password, saltRounds);
  
        // Check if a file is uploaded
        const customer_picture = req.file ? req.file.filename : null;
  
        const createCustomerQuery = `INSERT INTO customer_info (customer_name, customer_email, customer_address, customer_phone, customer_picture, password) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [
          customer_name,
          customer_email,
          customer_address,
          customer_phone,
          customer_picture,
          hashedpassword,
        ];
  
        // Insert the new customer (SQLite)
        db.run(createCustomerQuery, values, function (err) {
          if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
              success: false,
              message: "An error occurred while creating the customer.",
            });
          } else {
            return res
              .status(200)
              .json({ success: true, message: "Customer created successfully." });
          }
        });
      });
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ success: false, message: "An error occurred." });
    }
  };
  

  const getCustomerById = async (req, res) => {
    try {
      const customer_id = req.params.id;
      const getCustomerByIdQuery = `SELECT customer_id, customer_name, customer_picture, customer_email, customer_phone, customer_address FROM customer_info WHERE customer_id = ?`;
  
      db.all(getCustomerByIdQuery, [customer_id], (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).json({ success: false, message: "An error occurred" });
        } else if (result.length === 0) {
          res.status(404).json({ success: false, message: "Customer not found" });
        } else {
          res.status(200).json({
            success: true,
            data: result,
            message: "Customer fetched successfully",
          });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "An error occurred" });
    }
  };
  

  const NewupdateCustomer = async (req, res) => {
    try {
      const { customer_id } = req.params;
      const { customer_name, customer_email, customer_address, customer_phone, password } = req.body;
      const customer_picture = req.file ? req.file.filename : null;
  
      console.log(customer_name, customer_id, customer_picture);
  
      // Fetch the current data of the customer
      const fetchCurrentDataSql = "SELECT * FROM customer_info WHERE customer_id = ?";
      db.all(fetchCurrentDataSql, [customer_id], async (fetchErr, fetchData) => {
        if (fetchErr) {
          console.error("Database fetch error: ", fetchErr);
          return res.status(500).json({ error: "Internal Server Error" });
        }
  
        if (fetchData.length === 0) {
          return res.status(404).json({ success: false, message: "Customer not found" });
        }
  
        const currentData = fetchData[0];
  
        // Hash the password if it is provided
        const hashedPassword = password ? await bcrypt.hash(password, 10) : currentData.password;
  
        // Merge current and new data
        const updatedData = {
          customer_name: customer_name || currentData.customer_name,
          customer_email: customer_email || currentData.customer_email,
          customer_address: customer_address || currentData.customer_address,
          customer_phone: customer_phone || currentData.customer_phone,
          customer_picture: customer_picture ? customer_picture : currentData.customer_picture,
        };
  
        // Update the customer with the merged data
        const updateCustomerQuery = `
          UPDATE customer_info 
          SET customer_name = ?, customer_picture = ?, password = ?, customer_email = ?, 
              customer_address = ?, customer_phone = ? 
          WHERE customer_id = ?
        `;
        db.run(
          updateCustomerQuery,
          [
            updatedData.customer_name,
            updatedData.customer_picture,
            hashedPassword,
            updatedData.customer_email,
            updatedData.customer_address,
            updatedData.customer_phone,
            customer_id,
          ],
          function (err) {
            if (err) {
              console.error("Database query error: ", err);
              return res.status(500).json({ success: false, message: "An error occurred while updating" });
            }
  
            if (this.changes === 0) {
              return res.status(404).json({ success: false, message: "Customer not found" });
            }
  
            return res.status(200).json({
              success: true,
              message: "Customer updated successfully",
            });
          }
        );
      });
    } catch (error) {
      console.error("Update customer error: ", error);
      return res.status(500).json({ success: false, message: "An error occurred while updating" });
    }
  };
  

  const getReservationById = async (req, res) => {
    const { id } = req.params;
  
    const query = `
      SELECT 
          ci.customer_name, 
          rt.tablename, 
          r.person_capicity, 
          r.formtime AS start_time, 
          r.totime AS end_time, 
          r.reserveday AS date, 
          ci.customer_email,
          ci.customer_phone,
          CASE 
              WHEN r.status = 0 THEN 'free' 
              WHEN r.status = 1 THEN 'Booked' 
              ELSE 'unknown' 
          END AS status 
      FROM 
          tblreservation r
      LEFT JOIN 
          customer_info ci ON r.cid = ci.customer_id
      LEFT JOIN 
          rest_table rt ON r.tableid = rt.tableid
      WHERE 
          r.cid = ?
    `;
  
    try {
      db.all(query, [id], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database query error' });
        }
  
        if (result.length === 0) {
          return res.status(404).json({ message: 'Reservation not found' });
        }
  
        res.status(200).json({ data: result });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while retrieving the reservation' });
    }
  };
  

const createReservationNew = (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_mobile,
    tablename,
    person_capacity,
    formtime,
    totime,
    reserveday,
  } = req.body;
  console.log(req.body);
  // Insert into customer_info
  const customerInfoSql = `SELECT customer_id FROM customer_info WHERE customer_email=? `;
  const customerInfoValues = [customer_email];

  db.all(customerInfoSql, customerInfoValues, (err, customerResult) => {
    if (err) {
      console.error("Error inserting into customer_info:", err);
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to create customer",
          error: err,
        });
    }

    const customer_id = customerResult[0].customer_id;
    console.log("customer",customer_id)

    // Retrieve the table ID from rest_table using tablename
    const tblSql = `SELECT * FROM rest_table WHERE tablename = ?`;
    db.all(tblSql, [tablename], (err, tableResult) => {
      if (err) {
        console.error("Error retrieving table information:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "Failed to find table",
            error: err,
          });
      }

      // Check if a table was found
      if (tableResult.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Table not found" });
      }

      const tableid = tableResult[0].tableid; // Corrected to fetch tableid

      // Insert into tbl_reservation
      const reservationSql = `INSERT INTO tblreservation (cid, tableid, person_capicity, formtime, totime, reserveday, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const reservationValues = [
        customer_id,
        tableid,
        person_capacity,
        formtime,
        totime,
        reserveday,
        1,
      ];

      db.run(reservationSql, reservationValues, (err, reservationResult) => {
        if (err) {
          console.error("Error inserting into tbl_reservation:", err);
          return res
            .status(500)
            .json({
              success: false,
              message: "Failed to create reservation",
              error: err,
            });
        }

        res
          .status(201)
          .json({ success: true, message: "Reservation created successfully" });
      });
    });
  });
};


// const  weborderPlace = (req, res) => {
//   const {
  
//     order_details,
//     grand_total,
//     service_charge=0,
//     VAT=0,
//     discount = 0,
//     table_id = 0,
//     customerDetails,
//     customer_id,
//     shipping_type,
//     order_notes,
//     payment_method_id=0,
//   } = req.body;
// const {firstname,lastname,address,email,phone}=customerDetails;
 

//   if (
   
//     !order_details ||
//     !Array.isArray(order_details) ||
//     !grand_total
//   ) {
//     return res.status(400).json({ message: "Invalid request data" });
//   }

//   const waiterId = 0; // Default waiter_id as 0
//   const customer_type = 2; // Default customer type
//   const isthirdparty = customer_type === 3 ? 3 : 0;

//   // Query to get max order_id
//   const maxOrderIdQuery = "SELECT MAX(order_id) AS maxOrderId FROM customer_order";
//   db.all(maxOrderIdQuery, (err, result) => {
//     if (err) {
//       console.error("Error getting max order ID:", err);
//       return res.status(500).json({ message: "Internal server error" });
//     }

//     const maxOrderId = result[0]?.maxOrderId || 0;
//     const invoiceId = maxOrderId + 1;


//         // Insert order details
//         const orderInsertQuery = `
//           INSERT INTO customer_order (
//             saleinvoice, customer_id, cutomertype, isthirdparty, waiter_id,
//             order_date, order_time, table_no, totalamount, order_status,
//             orderacceptreject, splitpay_status, customer_note
//           ) VALUES (?, ?, ?, ?, ?, NOW(), CURTIME(), ?, ?, 1, 1, 0, ?)`;

//         db.pool.query(
//           orderInsertQuery,
//           [
//             invoiceId,
//             customer_id,
//             customer_type,
//             isthirdparty,
//             waiterId,
//             table_id,
//             grand_total,
//             order_notes,
//           ],
//           (err, orderResult) => {
//             if (err) {
//               console.error("Error inserting order:", err);
//               return res.status(500).json({ message: "Internal server error" });
//             }

//             const orderId = orderResult.insertId;

//             // Insert order menu details
//             const orderDetailsQuery = `
//               INSERT INTO order_menu (
//                 order_id, menu_id, price, menuqty, add_on_id,
//                 addonsqty, varientid, food_status, allfoodready
//               ) VALUES ?`;

//             const orderDetailsData = order_details.map((detail) => [
//               orderId,
//               detail.ProductsID,
//               detail.price,
//               detail.quantity,
//               detail.addons?.map((addon) => addon.add_on_id).join(",") || "",
//               detail.addons?.map((addon) => addon.add_on_quantity).join(",") || "",
//               detail.variantid,
//               0, // food_status
//               0, // allfoodready
//             ]);

//             db.pool.query(orderDetailsQuery, [orderDetailsData], (err) => {
//               if (err) {
//                 console.error("Error inserting order details:", err);
//                 return res.status(500).json({ message: "Internal server error" });
//               }

//               // Update table status
//               const updateTableStatusQuery = `
//                 UPDATE rest_table SET status = 1 WHERE tableid = ?`;
//               db.pool.query(updateTableStatusQuery, [table_id], (err) => {
//                 if (err) {
//                   console.error("Error updating table status:", err);
//                   return res.status(500).json({ message: "Internal server error" });
//                 }

//                 const total_amount =
//                   grand_total - service_charge - VAT - discount;

//                 // Insert into bill table
//                 const billInsertQuery = `
//                   INSERT INTO bill (
//                     customer_id,  order_id, total_amount, discount,
//                     service_charge, shipping_type, VAT, bill_amount, bill_date,
//                     bill_time, create_at, bill_status, payment_method_id
//                   ) VALUES (?, ?, ?, ?,  ?, ?, ?, ?, NOW(), CURTIME(), NOW(), 0, ?)`;

//                 db.pool.query(
//                   billInsertQuery,
//                   [
//                     customer_id,
                   
//                     orderId,
//                     total_amount,
//                     discount,
//                     service_charge,
//                     shipping_type,
//                     VAT,
//                     grand_total,
//                     payment_method_id,
//                   ],
//                   (err) => {
//                     if (err) {
//                       console.error("Error inserting bill:", err);
//                       return res
//                         .status(500)
//                         .json({ message: "Internal server error" });
//                     }

//                     // Insert into billing address table
//                     const billingAddressQuery = `
//                       INSERT INTO tbl_billingaddress (
//                         orderid, firstname, lastname, email, phone, address, DateInserted
//                       ) VALUES (?, ?, ?, ?, ?, ?, NOW())`;

//                     db.pool.query(
//                       billingAddressQuery,
//                       [
//                         orderId,
//                         firstname,
//                         lastname,
//                         email,
//                         phone,
                       
//                         address,
//                       ],
//                       (err) => {
//                         if (err) {
//                           console.error("Error inserting billing address:", err);
//                           return res
//                             .status(500)
//                             .json({ message: "Internal server error" });
//                         }

//                         res.status(201).json({
//                           message: "Order placed successfully",
//                           orderId,
//                           invoiceId,
//                         });
//                       }
//                     );
//                   }
//                 );
//               });
//             });
//           }
//         );
//       }
//     );

// };


const weborderPlace = (req, res) => {
  const {
    order_details,
    grand_total,
    service_charge = 0,
    VAT = 0,
    discount = 0,
    table_id = 0,
    customerDetails,
    customer_id,
    shipping_type,
    order_notes,
    payment_method_id = 0,
  } = req.body;

  const { firstname, lastname, address, email, phone } = customerDetails;

  if (!order_details || !Array.isArray(order_details) || !grand_total) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  const waiterId = 0; // Default waiter_id
  const customer_type = 2; // Default customer type
  const isthirdparty = customer_type === 3 ? 3 : 0;

  // Query to get max order_id
  const maxOrderIdQuery = "SELECT MAX(order_id) AS maxOrderId FROM customer_order";
  db.all(maxOrderIdQuery, (err, result) => {
    if (err) {
      console.error("Error getting max order ID:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    const maxOrderId = result[0]?.maxOrderId || 0;
    const invoiceId = maxOrderId + 1;

    // Insert order details
    const orderInsertQuery = `
      INSERT INTO customer_order (
        saleinvoice, customer_id, cutomertype, isthirdparty, waiter_id,
        order_date, order_time, table_no, totalamount, order_status,
        orderacceptreject, splitpay_status, customer_note
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), time('now'), ?, ?, 1, 1, 0, ?)`;

    db.run(
      orderInsertQuery,
      [
        invoiceId,
        customer_id,
        customer_type,
        isthirdparty,
        waiterId,
        table_id,
        grand_total,
        order_notes,
      ],
      function (err) {
        if (err) {
          console.error("Error inserting order:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        const orderId = this.lastID;

        // Insert order menu items one by one for SQLite
        const orderDetailsQuery = `
          INSERT INTO order_menu (
            order_id, menu_id, price, menuqty, add_on_id,
            addonsqty, varientid, food_status, allfoodready
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertMenuItems = order_details.map((detail) => {
          const values = [
            orderId,
            detail.ProductsID,
            detail.price,
            detail.quantity,
            detail.addons?.map((addon) => addon.add_on_id).join(",") || "",
            detail.addons?.map((addon) => addon.add_on_quantity).join(",") || "",
            detail.variantid,
            0,
            0,
          ];

          return new Promise((resolve, reject) => {
            db.run(orderDetailsQuery, values, function (err) {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        Promise.all(insertMenuItems)
          .then(() => {
            // Update table status
            const updateTableStatusQuery = `
              UPDATE rest_table SET status = 1 WHERE tableid = ?`;
            db.run(updateTableStatusQuery, [table_id], (err) => {
              if (err) {
                console.error("Error updating table status:", err);
                return res.status(500).json({ message: "Internal server error" });
              }

              const total_amount =
                grand_total - service_charge - VAT - discount;

              // Insert into bill table
              const billInsertQuery = `
                INSERT INTO bill (
                  customer_id, order_id, total_amount, discount,
                  service_charge, shipping_type, VAT, bill_amount,
                  bill_date, bill_time, create_at, bill_status, payment_method_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), time('now'), datetime('now'), 0, ?)`;

              db.run(
                billInsertQuery,
                [
                  customer_id,
                  orderId,
                  total_amount,
                  discount,
                  service_charge,
                  shipping_type,
                  VAT,
                  grand_total,
                  payment_method_id,
                ],
                (err) => {
                  if (err) {
                    console.error("Error inserting bill:", err);
                    return res.status(500).json({ message: "Internal server error" });
                  }

                  // Insert into billing address table
                  const billingAddressQuery = `
                    INSERT INTO tbl_billingaddress (
                      orderid, firstname, lastname, email, phone, address, DateInserted
                    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;

                  db.run(
                    billingAddressQuery,
                    [
                      orderId,
                      firstname,
                      lastname,
                      email,
                      phone,
                      address,
                    ],
                    (err) => {
                      if (err) {
                        console.error("Error inserting billing address:", err);
                        return res.status(500).json({ message: "Internal server error" });
                      }

                      res.status(201).json({
                        message: "Order placed successfully",
                        orderId,
                        invoiceId,
                      });
                    }
                  );
                }
              );
            });
          })
          .catch((err) => {
            console.error("Error inserting order menu details:", err);
            res.status(500).json({ message: "Internal server error" });
          });
      }
    );
  });
};

// const getWebOrderById = async (req, res) => {
//   const customer_id = req.params.customer_id;

//   if (!customer_id) {
//     return res.status(400).json({ message: "Customer ID is required" });
//   }

//   try {
//     const getOrderDetailsQuery = `
//       SELECT
//           co.*,
//           c.customer_name,
//           c.customer_email,
//           c.customer_address,
//           c.customer_phone,
//           w.firstname AS waiter_first_name,
//           w.lastname AS waiter_last_name,
//           b.discount,
//           b.service_charge,
//           b.shipping_type,
//           b.VAT,
//           b.bill_id,
//           b.bill_amount,
//           b.bill_date,
//           b.bill_status,
//           b.payment_method_id,
//           sm.shipping_method AS shipping_method_name,
//           CASE co.order_status
//               WHEN 1 THEN 'Pending'
//               WHEN 2 THEN 'Processing'
//               WHEN 3 THEN 'Ready'
//               WHEN 4 THEN 'Served'
//               WHEN 5 THEN 'Cancel'
//               WHEN 6 THEN 'Hold'
//           END as order_status_name
//       FROM
//           customer_order co
//           LEFT JOIN customer_info c ON co.customer_id = c.customer_id
//           LEFT JOIN user w ON co.waiter_id = w.id
//           LEFT JOIN bill b ON co.order_id = b.order_id
//           LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id
//       WHERE
//           c.customer_id = ?;
//     `;

//     const getOrderMenuQuery = `
//       SELECT
//           om.*,
//           f.*,
//           v.variantName,
//           GROUP_CONCAT(a.add_on_id) AS add_on_ids,
//           GROUP_CONCAT(a.add_on_name) AS add_on_names,
//           GROUP_CONCAT(a.price) AS add_on_prices
//       FROM
//           order_menu om
//           LEFT JOIN add_ons a ON FIND_IN_SET(a.add_on_id, om.add_on_id)
//           LEFT JOIN item_foods f ON om.menu_id = f.ProductsID
//           LEFT JOIN variant v ON om.varientid = v.variantid
//       WHERE
//           om.order_id IN (?)
//       GROUP BY om.menu_id, om.varientid;  
//     `;

//     db.pool.query(getOrderDetailsQuery, [customer_id], (err, orderResult) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).json({
//           success: false,
//           message: "An error occurred while fetching order details",
//         });
//       }

//       if (!orderResult || orderResult.length === 0) {
//         return res.status(404).json({
//           success: false,
//           message: "No orders found for the given customer ID",
//         });
//       }

//       // Extract all order IDs
//       const order_ids = orderResult.map(order => order.order_id);

//       db.pool.query(getOrderMenuQuery, [order_ids], (err, menuResult) => {
//         if (err) {
//           console.error(err);
//           return res.status(500).json({
//             success: false,
//             message: "An error occurred while fetching menu items",
//           });
//         }

//         // Process menu items for each order
//         const structuredMenuItems = menuResult.map((item) => {
//           const addOnIds = item.add_on_ids ? item.add_on_ids.split(",") : [];
//           const addOnNames = item.add_on_names
//             ? item.add_on_names.split(",")
//             : [];
//           const addOnPrices = item.add_on_prices
//             ? item.add_on_prices.split(",")
//             : [];
//           const addOnQuantities = item.addonsqty
//             ? item.addonsqty.split(",")
//             : [];

//           const addOns = addOnIds.map((id, index) => ({
//             add_on_id: id,
//             add_on_name: addOnNames[index] || null,
//             add_on_price: addOnPrices[index] || null,
//             add_on_quantity: addOnQuantities[index] || null,
//           }));

//           return {
//             ...item,
//             add_ons: addOns,
//           };
//         });

//         res.status(200).json({
//           success: true,
//           orders: orderResult,
//           menuItems: structuredMenuItems,
//         });
//       });
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "An unexpected error occurred",
//     });
//   }
// };

const getWebOrderById = async (req, res) => {
  const customer_id = req.params.customer_id;

  if (!customer_id) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  try {
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
          b.service_charge,
          b.shipping_type,
          b.VAT,
          b.bill_id,
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
          END AS order_status_name
      FROM
          customer_order co
          LEFT JOIN customer_info c ON co.customer_id = c.customer_id
          LEFT JOIN user w ON co.waiter_id = w.id
          LEFT JOIN bill b ON co.order_id = b.order_id
          LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id
      WHERE
          c.customer_id = ?;
    `;

    const getOrderMenuQuery = `
      SELECT
          om.*,
          f.*,
          v.variantName,
          (
            SELECT GROUP_CONCAT(a.add_on_id)
            FROM add_ons a
            WHERE ',' || om.add_on_id || ',' LIKE '%,' || a.add_on_id || ',%'
          ) AS add_on_ids,
          (
            SELECT GROUP_CONCAT(a.add_on_name)
            FROM add_ons a
            WHERE ',' || om.add_on_id || ',' LIKE '%,' || a.add_on_id || ',%'
          ) AS add_on_names,
          (
            SELECT GROUP_CONCAT(a.price)
            FROM add_ons a
            WHERE ',' || om.add_on_id || ',' LIKE '%,' || a.add_on_id || ',%'
          ) AS add_on_prices
      FROM
          order_menu om
          LEFT JOIN item_foods f ON om.menu_id = f.ProductsID
          LEFT JOIN variant v ON om.varientid = v.variantid
      WHERE
          om.order_id IN (${req.params.customer_id})
      GROUP BY om.menu_id, om.varientid;
    `;

    db.all(getOrderDetailsQuery, [customer_id], (err, orderResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching order details",
        });
      }

      if (!orderResult || orderResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No orders found for the given customer ID",
        });
      }

      const order_ids = orderResult.map(order => order.order_id);

      const placeholders = order_ids.map(() => '?').join(',');
      const menuQueryWithPlaceholders = getOrderMenuQuery.replace(
        `(${req.params.customer_id})`,
        `(${placeholders})`
      );

      db.all(menuQueryWithPlaceholders, order_ids, (err, menuResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching menu items",
          });
        }

        const structuredMenuItems = menuResult.map((item) => {
          const addOnIds = item.add_on_ids ? item.add_on_ids.split(",") : [];
          const addOnNames = item.add_on_names ? item.add_on_names.split(",") : [];
          const addOnPrices = item.add_on_prices ? item.add_on_prices.split(",") : [];
          const addOnQuantities = item.addonsqty ? item.addonsqty.split(",") : [];

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
          success: true,
          orders: orderResult,
          menuItems: structuredMenuItems,
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};












const getInTouch = async (req, res) => {
  const { firstname, lastname, phone, email_address, message } = req.body;

  if (!firstname || !lastname || !phone || !email_address || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  const transporter = nodemailer.createTransport({
    host: "mail.theprojectxyz.xyz",
    port: 465, // or 587
    secure: true, 
    auth: {
      user: "akashlakshkar@theprojectxyz.xyz",
      pass: "jBkPx@+Wjj^A",
    },
  });



  const mailOptions = {
    from: 'your_email@gmail.com',
    to:`${email_address}`,
    subject: 'New Get in Touch Submission',
  html: `
   <div style="font-family: 'Roboto', Arial, sans-serif; line-height: 1.6; color: #444; max-width: 650px; margin: 20px auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); background: linear-gradient(135deg, #ffffff, #f7f7f7);">
  <h1 style="text-align: center; color: #007BFF; font-size: 28px; margin-bottom: 10px;">📧 New Contact Submission</h1>
  <p style="text-align: center; font-size: 16px; margin-bottom: 30px; color: #666;">You’ve received a new message through the <strong>Get in Touch</strong> form.</p>
  
  <div style="background-color: #fdfdfd; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
    <table style="width: 100%; border-collapse: collapse; margin: 0 auto; font-size: 15px;">
      <tr>
        <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; width: 40%; color: #555;">📝 First Name:</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">${firstname}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; color: #555;">📝 Last Name:</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">${lastname}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; color: #555;">📞 Phone:</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">${phone}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; color: #555;">📧 Email Address:</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">${email_address}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; color: #555;">💬 Comments:</td>
        <td style="padding: 10px; color: #333;">${message}</td>
      </tr>
    </table>
  </div>
  
  <p style="margin-top: 30px; text-align: center; font-size: 14px; color: #888; font-style: italic;">
    This email was automatically generated. Please do not reply to this message.
  </p>
</div>

  `,

  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    res.status(200).json({ message: 'Your message has been sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'An error occurred while sending your message.', error: error.message });
  }
};

const ForgetPasswordController = async (req, res) => {
  const { email } = req.body;

  console.log("Email:", email);
  try {
    // Fetch user from the database
    const rows = await dbQuery(
      "SELECT * FROM customer_info WHERE customer_email = ?",
      [email]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }
    const user = rows[0];
    const id = user.customer_id;
    // Generate a JWT token
    const token = jwt.sign(
      { id: id },
      process.env.JWT_SECRET || "uhkjhkh@13142#$", 
    );

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      host: "mail.theprojectxyz.xyz",
      port: 465, // or 587
      secure: true, 
      auth: {
        user: "akashlakshkar@theprojectxyz.xyz",
        pass: "jBkPx@+Wjj^A",
      },
    });
    // Email options
    const mailOptions = {
      from: 'support@krayon.upgradu.in',
      to: user.customer_email, 
      subject: "Password Reset Request",
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="https://krayon.theprojectxyz.xyz/restro-frontend/newresetpassword/${id}/${token}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };
  
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    res.status(200).json({ message: "Password reset link sent to email" });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
const newResetPassword= async (req, res) => {
  const { id, token } = req.params;
  const { newPassword } = req.body;
  console.log("id",id,token);
  console.log("passord",newPassword)
  try {
    // Verify the token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET || 'uhkjhkh@13142#$');
    // if (decoded.id !== parseInt(id, 10)) {
    //   return res.status(400).json({ message: 'Invalid token or user ID' });
    // }

    // Update the password in the database
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbQuery('UPDATE customer_info SET password = ? WHERE customer_id = ?', [hashedPassword, id]);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
}
  module.exports={
    loginCustomer,
    newCreateCustomer,
    getCustomerById,
    NewupdateCustomer,
    getReservationById,
    createReservationNew,
    weborderPlace,
    getWebOrderById,
    getInTouch,
    ForgetPasswordController,
    newResetPassword
  }