const db = require("../utils/db");
const { print } = require("pdf-to-printer");
const fs = require("fs");
const path = require("path");
const net = require("net");

const resolveCreatorId = (userId) =>
  new Promise((resolve, reject) => {
    db.get("SELECT is_admin, created_by FROM user WHERE id = ?", [userId], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      resolve(Number(row.is_admin) === 1 ? userId : row.created_by);
    });
  });

async function sendToPrinter(printer, text) {
  // Windows printer
  if (printer.printer_type === "windows") {
    const filePath = path.join(__dirname, `kot_${Date.now()}.txt`);
    fs.writeFileSync(filePath, text, "utf8");

    await print(filePath, {
      printer: printer.printer_path,
    });

    return;
  }

  // Network printer (IP only, port must come from DB)
  if (printer.printer_type === "network") {
    if (!printer.printer_path) {
      throw new Error("Printer IP address is required");
    }

    if (!printer.port) {
      throw new Error("Printer port not configured");
    }

    return new Promise((resolve, reject) => {
      const socket = new net.Socket();

      socket.connect(printer.port, printer.printer_path, () => {
        socket.write(Buffer.from(text + "\n\n\n", "ascii"));
        socket.end();
        resolve();
      });

      socket.on("error", (err) => {
        reject(new Error(`Network printer error: ${err.message}`));
      });
    });
  }

  throw new Error("Unsupported printer type");
}

async function printKOTForKitchen(kitchenId, orderId) {
  try {
    // 1. Fetch items
    const items = await new Promise((resolve, reject) => {
      db.all(
        `SELECT item_name, qty 
         FROM kot_items 
         WHERE kitchen_id = ? AND order_id = ? AND printed = 0`,
        [kitchenId, orderId],
        (err, rows) => (err ? reject(err) : resolve(rows)),
      );
    });

    if (!items.length) return;

    // 2. Fetch printer for this kitchen
    const printer = await new Promise((resolve, reject) => {
      db.get(
        `
    SELECT 
      connection_type AS printer_type,
      path            AS printer_path,
      port
    FROM printers
    WHERE business_id = ?
    LIMIT 1
    `,
        [kitchenId],
        (err, row) => (err ? reject(err) : resolve(row)),
      );
    });

    if (!printer) {
      console.error(`❌ No printer configured for kitchen ${kitchenId}`);
      return;
    }

    // 3. Build KOT
    let text = "";
    text += "==============================\n";
    text += "        KITCHEN ORDER         \n";
    text += "==============================\n";
    text += `Kitchen : ${kitchenId}\n`;
    text += `Order   : ${orderId}\n`;
    text += "------------------------------\n";

    items.forEach((i) => {
      const qty = i.qty.toString().padEnd(4, " ");
      text += `${qty}${i.item_name}\n`;
    });

    text += "------------------------------\n\n\n";

    // 4. Send to correct printer
    await sendToPrinter(printer, text);

    // 5. Update printed
    db.run(
      `UPDATE kot_items SET printed = 1 
       WHERE kitchen_id = ? AND order_id = ?`,
      [kitchenId, orderId],
    );

    console.log(`✅ Printed KOT → Kitchen ${kitchenId}`);
  } catch (err) {
    console.error("❌ KOT Print failed:", err.message);
  }
}

const orderPlace = (req, res) => {
  const {
    customer_id,
    customer_type,
    waiter_id,
    order_details,
    grand_total,
    VAT = 0,
    discount = 0,
    table_id = 0,
    persons = 0,
    print_kot = true,
  } = req.body;

  const created_by = req.id || 1;

  if (
    !customer_id ||
    !Array.isArray(order_details) ||
    order_details.length === 0 ||
    !grand_total
  ) {
    console.log("❌ Validation failed");
    return res.status(400).json({ message: "Invalid request data" });
  }

  db.get(
    "SELECT MAX(order_id) AS maxOrderId FROM customer_order",
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });

      const invoiceId = result?.maxOrderId ? result.maxOrderId + 1 : 1;
      console.log("🧾 Generated invoiceId:", invoiceId);

      db.get(
        `SELECT tokenno FROM customer_order
         WHERE order_date = DATE('now') AND tokenno IS NOT NULL
         ORDER BY order_id DESC LIMIT 1`,
        (err, tokenRow) => {
          let tokenNo = "T1";
          if (tokenRow?.tokenno) {
            const num = parseInt(tokenRow.tokenno.replace("T", ""), 10);
            tokenNo = `T${num + 1}`;
          }

          console.log("🎫 Generated token:", tokenNo);

          const orderQuery = `
            INSERT INTO customer_order (
              saleinvoice, customer_id, cutomertype, waiter_id,
              order_date, order_time, table_no,
              tokenno, totalamount,
              order_status, orderacceptreject, splitpay_status, created_by
            )
            VALUES (?, ?, ?, ?, DATE('now'), TIME('now'), ?, ?, ?, 2, 1, 0, ?)
          `;

          db.run(
            orderQuery,
            [
              invoiceId,
              customer_id,
              customer_type,
              waiter_id || 0,
              table_id,
              tokenNo,
              grand_total,
              created_by,
            ],
            function (err) {
              if (err) return res.status(500).json({ message: err.message });

              const orderId = this.lastID;
              console.log("✅ Order created, orderId:", orderId);

              // 👉 ADD HERE
              if (table_id && persons > 0) {
                db.get(
                  `SELECT person_capicity, occupied_seats 
     FROM rest_table 
     WHERE tableid = ?`,
                  [table_id],
                  (err, table) => {
                    if (err || !table) {
                      console.error("Table not found");
                      return;
                    }

                    const available =
                      table.person_capicity - table.occupied_seats;

                    if (persons > available) {
                      console.log("❌ Not enough seats");
                      return;
                    }

                    const newOccupied = table.occupied_seats + persons;

                    db.run(
                      `UPDATE rest_table 
   SET occupied_seats = ?, 
       status = CASE 
         WHEN ? = 0 THEN 'free'
         WHEN ? < person_capicity THEN 'partial'
         ELSE 'booked'
       END
   WHERE tableid = ?`,
                      [newOccupied, newOccupied, newOccupied, table_id],
                      (err) => {
                        if (err)
                          console.error("Seat update failed:", err.message);
                        else console.log("✅ Seats updated:", newOccupied);
                      },
                    );
                  },
                );
              }

              const orderMenuRows = [];
              const kotItems = {};
              const usedKitchens = new Set();
              let completed = 0;

              order_details.forEach((detail) => {
                console.log("🍽 Processing item:", detail);

                db.get(
                  "SELECT ProductName, kitchenid FROM item_foods WHERE ProductsID = ?",
                  [detail.ProductsID],
                  (err, food) => {
                    if (err) {
                      console.error("DB error:", err);
                      return res.status(500).json({ message: err.message });
                    }

                    console.log("📦 Food from DB:", food);

                    if (!food) {
                      return res.status(400).json({
                        message: `Food not found ${detail.ProductsID}`,
                      });
                    }

                    const kitchenId = Number(food.kitchenid);

                    console.log("🏠 kitchenId resolved:", kitchenId);

                    if (!kitchenId || isNaN(kitchenId)) {
                      console.error("❌ Invalid kitchen for product:", food);
                      return res.status(400).json({
                        message: `Kitchen not assigned to product: ${food.ProductName}`,
                      });
                    }

                    usedKitchens.add(kitchenId);

                    orderMenuRows.push([
                      orderId,
                      detail.ProductsID,
                      detail.price,
                      detail.quantity,
                      "",
                      "",
                      detail.variantid || 0,
                      kitchenId,
                      0,
                      0,
                      0,
                    ]);

                    let itemName = food.ProductName;
                    if (detail.addons?.length) {
                      const addons = detail.addons
                        .map((a) => a.add_on_name)
                        .join(", ");
                      itemName += ` (Addons: ${addons})`;
                    }

                    if (!kotItems[kitchenId]) kotItems[kitchenId] = [];
                    kotItems[kitchenId].push({
                      name: itemName,
                      qty: detail.quantity,
                    });

                    completed++;
                    if (completed === order_details.length) {
                      finalize().catch((err) => {
                        console.error("❌ Finalize failed:", err.message);
                        return res.status(500).json({
                          success: false,
                          message: err.message,
                        });
                      });
                    }
                  },
                );
              });

              async function finalize() {
                console.log("📥 orderMenuRows:", orderMenuRows);
                console.log("📥 kotItems:", kotItems);

                const placeholders = orderMenuRows
                  .map(() => `(?,?,?,?,?,?,?,?,?,?,?)`)
                  .join(",");

                await new Promise((resolve, reject) => {
                  db.run(
                    `INSERT INTO order_menu (
        order_id, menu_id, price, menuqty,
        add_on_id, addonsqty, varientid,
        kitchen_id, food_status, allfoodready, kot_status
      ) VALUES ${placeholders}`,
                    orderMenuRows.flat(),
                    (err) => {
                      if (err) return reject(err);
                      resolve();
                    },
                  );
                });

                // Split Pay needs a sub_order row per line item (same shape
                // holdOrders.js already creates for drafts), tagged
                // source_type='normal' so origin stays distinguishable.
                const subOrderRows = order_details.map((detail) => [
                  orderId,
                  customer_id,
                  VAT,
                  discount,
                  detail.ProductsID,
                  detail.price,
                  detail.quantity,
                  "",
                  "",
                  0,
                  detail.variantid || 0,
                  "normal",
                ]);

                const subOrderPlaceholders = subOrderRows
                  .map(() => `(?,?,?,?,?,?,?,?,?,?,?,?)`)
                  .join(",");

                await new Promise((resolve, reject) => {
                  db.run(
                    `INSERT INTO sub_order (
        order_id, customer_id, vat, discount, order_menu_id,
        total_price, menu_qty, adons_id, adons_qty, status, varient_id,
        source_type
      ) VALUES ${subOrderPlaceholders}`,
                    subOrderRows.flat(),
                    (err) => {
                      if (err) return reject(err);
                      resolve();
                    },
                  );
                });

                // paymentSplitOrder requires a bill row to exist (same
                // pattern already used by holdOrders.js/webUser.js); orderPlace()
                // never created one, which blocked Split Pay for every normal order.
                const update_by = created_by;
                const update_date = new Date().toISOString().split("T")[0];
                const service_charge = 0;
                const total_amount =
                  grand_total -
                  service_charge -
                  (VAT || 0) -
                  (discount || 0);

                await new Promise((resolve, reject) => {
                  db.run(
                    `INSERT INTO bill (
        customer_id, create_by, update_by, update_date, order_id,
        total_amount, discount, service_charge, shipping_type, VAT,
        bill_amount, bill_date, bill_time, create_at,
        bill_status, payment_method_id, create_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE('now'), TIME('now'), DATE('now'), 0, 0, DATE('now'))`,
                    [
                      customer_id,
                      created_by,
                      update_by,
                      update_date,
                      orderId,
                      total_amount,
                      discount || 0,
                      service_charge,
                      null,
                      VAT || 0,
                      grand_total,
                    ],
                    (err) => {
                      if (err) return reject(err);
                      resolve();
                    },
                  );
                });

                for (const kitchenId in kotItems) {
                  for (const item of kotItems[kitchenId]) {
                    await new Promise((resolve, reject) => {
                      db.run(
                        `INSERT INTO kot_items(order_id, kitchen_id, item_name, qty, printed)
           VALUES (?, ?, ?, ?, ?)`,
                        [
                          orderId,
                          kitchenId,
                          item.name,
                          item.qty,
                          print_kot ? 0 : 1,
                        ],
                        (err) => {
                          if (err) return reject(err);
                          resolve();
                        },
                      );
                    });
                  }
                }

                if (print_kot) {
                  for (const kitchenId of usedKitchens) {
                    await printKOTForKitchen(kitchenId, orderId);
                  }
                }

                return res.json({
                  success: true,
                  message: "Order placed successfully",
                  kitchens: [...usedKitchens],
                });
              }
            },
          );
        },
      );
    },
  );
};

const getTodayOrders = async (req, res) => {
  const userId = req.id;
  const { searchItem } = req.query;

  try {
    const checkUserQuery = `
      SELECT is_admin, created_by 
      FROM user 
      WHERE id = ?
    `;

    const userData = await new Promise((resolve, reject) => {
      db.get(checkUserQuery, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isAdmin = userData.is_admin;
    const createdBy = userData.created_by;

    if (!isAdmin && !createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view today's orders.",
      });
    }

    const allowedCreatorId = isAdmin ? userId : createdBy;

    let getTodayOrdersQuery = `
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
        co.shipping_date
      FROM customer_order co
      LEFT JOIN customer_info c ON co.customer_id = c.customer_id
      LEFT JOIN user w ON co.waiter_id = w.id
      LEFT JOIN rest_table rt ON co.table_no = rt.tableid
      LEFT JOIN bill b ON co.order_id = b.order_id
      LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id
      WHERE co.orderacceptreject = 1
      AND DATE(co.order_date) = DATE('now')
      AND co.order_status = 4
      AND b.bill_status = 1
      AND co.created_by = ?
    `;

    const params = [allowedCreatorId];

    if (searchItem) {
      const searchQuery = `%${searchItem}%`;
      const lowerSearch = searchItem.toLowerCase();

      if (lowerSearch.startsWith("p")) {
        getTodayOrdersQuery += `
          AND (
            b.bill_status = 1
            OR co.saleinvoice LIKE ?
            OR c.customer_name LIKE ?
            OR w.firstname LIKE ?
            OR w.lastname LIKE ?
            OR sm.shipping_method LIKE ?
            OR rt.tablename LIKE ?
            OR b.bill_amount LIKE ?
            OR DATE(co.shipping_date) LIKE ?
            OR DATE(co.order_date) LIKE ?
          )
        `;

        params.push(
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
        );
      } else if (lowerSearch.startsWith("d")) {
        getTodayOrdersQuery += `
          AND (
            b.bill_status = 0
            OR co.saleinvoice LIKE ?
            OR c.customer_name LIKE ?
            OR w.firstname LIKE ?
            OR w.lastname LIKE ?
            OR sm.shipping_method LIKE ?
            OR rt.tablename LIKE ?
            OR b.bill_amount LIKE ?
            OR DATE(co.shipping_date) LIKE ?
            OR DATE(co.order_date) LIKE ?
          )
        `;

        params.push(
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
        );
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(searchItem)) {
        getTodayOrdersQuery += ` AND DATE(co.order_date) = ?`;
        params.push(searchItem);
      } else {
        getTodayOrdersQuery += `
          AND (
            co.saleinvoice LIKE ?
            OR c.customer_name LIKE ?
            OR w.firstname LIKE ?
            OR w.lastname LIKE ?
            OR (w.firstname || ' ' || w.lastname) LIKE ?
            OR sm.shipping_method LIKE ?
            OR rt.tablename LIKE ?
            OR b.bill_amount LIKE ?
            OR DATE(co.shipping_date) LIKE ?
            OR DATE(co.order_date) LIKE ?
          )
        `;

        params.push(
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
        );
      }
    }

    getTodayOrdersQuery += ` ORDER BY co.order_id DESC`;

    db.all(getTodayOrdersQuery, params, (err, result) => {
      if (err) {
        console.error("Error fetching today's orders:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching today's orders",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: result || [],
        message: "Today's Orders fetched successfully",
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

const getCategoryList = async (req, res) => {
  try {
    const userId = req.id;
    const creatorId = await resolveCreatorId(userId);
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const getCategoryListQuery = `
  SELECT
    parent.CategoryID AS parentCategoryID,
    parent.Name AS parentCategoryName,
    parent.CategoryIsActive AS parentCategoryIsActive,
    parent.parentid AS parentParentID,
    child.CategoryID AS childCategoryID,
    child.Name AS childCategoryName,
    child.CategoryIsActive AS childCategoryIsActive,
    child.parentid AS childParentID
  FROM item_category parent
  LEFT JOIN item_category child
    ON child.parentid = parent.CategoryID
  WHERE
    (parent.parentid = 0 OR parent.parentid = '' OR parent.parentid IS NULL)
    AND parent.CategoryIsActive = 1
    AND (child.CategoryIsActive = 1 OR child.CategoryID IS NULL)
    AND parent.UserIDInserted = ?
  ORDER BY parent.CategoryID, child.CategoryID;
`;

    db.all(getCategoryListQuery, [creatorId], (err, results) => {
      if (err) {
        console.error("Error fetching category list:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred",
        });
      }

      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No categories found",
        });
      }

      const categoryMap = {};

      results.forEach((row) => {
        const parentID = row.parentCategoryID;

        if (!categoryMap[parentID]) {
          categoryMap[parentID] = {
            CategoryID: row.parentCategoryID,
            CategoryName: row.parentCategoryName,
            CategoryIsActive: row.parentCategoryIsActive,
            ParentID: row.parentParentID || 0,
            children: [],
          };
        }

        if (row.childCategoryID) {
          categoryMap[parentID].children.push({
            CategoryID: row.childCategoryID,
            CategoryName: row.childCategoryName,
            CategoryIsActive: row.childCategoryIsActive,
            ParentID: row.childParentID || 0,
          });
        }
      });

      res.status(200).json({
        success: true,
        data: Object.values(categoryMap),
        message: "Category list fetched successfully",
      });
    });
  } catch (error) {
    console.error("Error in getCategoryList:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred",
    });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const userId = req.id;
    const { categoryId, searchTerm = "" } = req.query;
    const { parentid } = req.params;

    const checkUserQuery = "SELECT created_by, is_admin FROM user WHERE id = ?";

    const userData = await new Promise((resolve, reject) => {
      db.get(checkUserQuery, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isAdmin = userData.is_admin;
    const created_by = userData.created_by;

    let creatorId;

    if (isAdmin === 1) {
      creatorId = userId;
    } else {
      if (!created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view products.",
        });
      }

      creatorId = created_by;
    }

    let queryProducts = `
      SELECT f.*, m.*, k.kitchen_name, p.*
      FROM item_foods f
      LEFT JOIN tbl_menutype m ON f.menutype = m.menutypeid
      LEFT JOIN tbl_kitchen k ON f.kitchenid = k.kitchenid
      LEFT JOIN printers p ON k.printer_id = p.id
    `;

    let params = [];
    let whereConditions = [`f.ProductsIsActive = 1`, `f.UserIDInserted = ?`];

    params.push(creatorId);

    if (categoryId) {
      whereConditions.push(`f.CategoryID = ?`);
      params.push(categoryId);
    } else if (parentid) {
      queryProducts += `
        LEFT JOIN item_category c ON f.CategoryID = c.CategoryID
      `;
      whereConditions.push(`c.parentid = ?`);
      params.push(parentid);
    }

    if (searchTerm) {
      whereConditions.push(`(f.ProductName LIKE ? OR f.descrip LIKE ?)`);
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    queryProducts += ` WHERE ` + whereConditions.join(" AND ");
    queryProducts += ` ORDER BY f.ProductsID DESC`;

    const products = await new Promise((resolve, reject) => {
      db.all(queryProducts, params, (err, results) => {
        if (err) return reject(err);
        resolve(results || []);
      });
    });
    if (products.length === 0) {
      return res.status(200).json([]);
    }

    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const variants = await new Promise((resolve, reject) => {
          const queryVariants = `
            SELECT v.* 
            FROM variant v 
            WHERE v.menuid = ?
          `;

          db.all(queryVariants, [product.ProductsID], (err, results) => {
            if (err) return reject(err);
            resolve(results || []);
          });
        });

        const addons = await new Promise((resolve, reject) => {
          const queryAddons = `
            SELECT a.*
            FROM menu_add_on ma
            LEFT JOIN add_ons a ON ma.add_on_id = a.add_on_id
            WHERE ma.is_active = 1 AND ma.menu_id = ?
          `;

          db.all(queryAddons, [product.ProductsID], (err, results) => {
            if (err) return reject(err);
            resolve(results || []);
          });
        });

        return {
          ...product,
          variants,
          addons,
        };
      }),
    );

    return res.status(200).json(productsWithDetails);
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
      details: err.message,
    });
  }
};

// get waiter

const getWaiter = async (req, res) => {
  try {
    const id = req.id; // From auth middleware

    // Step 1: Fetch current user info
    const checkUserQuery = `
      SELECT created_by, is_admin 
      FROM user 
      WHERE id = ?
    `;

    const userData = await new Promise((resolve, reject) => {
      db.get(checkUserQuery, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isAdmin = userData.is_admin;
    const created_by = userData.created_by;

    // Step 2: Determine creator/admin id
    let roleCreatorId;

    if (isAdmin === 1) {
      roleCreatorId = id;
    } else {
      if (!created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view waiters.",
        });
      }

      roleCreatorId = created_by;
    }

    // Step 3: Get waiter role created by this user
    const fkRoleIdQuery = `
      SELECT role_id 
      FROM sec_role_tbl 
      WHERE LOWER(role_name) = 'waiter' 
      AND create_by = ?
    `;

    const roleData = await new Promise((resolve, reject) => {
      db.all(fkRoleIdQuery, [roleCreatorId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });

    if (roleData.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        warning: true,
        message: "Waiter role not found for this user",
      });
    }

    const fkRoleId = roleData[0].role_id;

    // Step 4: Get waiter users linked to that role
    const getWaiterQuery = `
      SELECT 
        au.fk_role_id, 
        u.* 
      FROM sec_user_access_tbl au
      LEFT JOIN user u 
        ON au.fk_user_id = u.id
      WHERE au.fk_role_id = ? 
      AND u.created_by = ?
    `;

    const data = await new Promise((resolve, reject) => {
      db.all(getWaiterQuery, [fkRoleId, roleCreatorId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });

    return res.status(200).json({
      success: true,
      data,
      message: "Waiter data fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching waiter:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

const getQROrders = async (req, res) => {
  const userId = req.id;
  const { searchItem } = req.query;

  try {
    const checkUserQuery = `
      SELECT is_admin, created_by 
      FROM user 
      WHERE id = ?
    `;

    const userData = await new Promise((resolve, reject) => {
      db.get(checkUserQuery, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isAdmin = userData.is_admin;
    const createdBy = userData.created_by;

    if (!isAdmin && !createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view QR orders.",
      });
    }

    const allowedCreatorId = isAdmin ? userId : createdBy;

    let getQROrdersQuery = `
      SELECT
        co.*,
        c.customer_name,
        w.firstname AS waiter_first_name,
        w.lastname AS waiter_last_name,
        rt.tablename,
        b.discount,
        b.service_charge,
        b.shipping_type AS shipping_type_id,
        b.VAT,
        b.bill_amount,
        b.bill_date,
        b.bill_status,
        b.payment_method_id,
        sm.shipping_method AS shipping_method_name
      FROM customer_order co
      LEFT JOIN customer_info c ON co.customer_id = c.customer_id
      LEFT JOIN user w ON co.waiter_id = w.id
      LEFT JOIN rest_table rt ON co.table_no = rt.tableid
      LEFT JOIN bill b ON co.order_id = b.order_id
      LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id
      WHERE co.cutomertype = 99
      AND co.created_by = ?
    `;

    const params = [allowedCreatorId];

    if (searchItem) {
      const searchQuery = `%${searchItem}%`;

      getQROrdersQuery += `
        AND (
          co.saleinvoice LIKE ?
          OR c.customer_name LIKE ?
          OR w.firstname LIKE ?
          OR w.lastname LIKE ?
          OR (w.firstname || ' ' || w.lastname) LIKE ?
          OR sm.shipping_method LIKE ?
          OR co.shipping_date LIKE ?
          OR rt.tablename LIKE ?
          OR co.order_date LIKE ?
          OR b.bill_amount LIKE ?
          OR (
            (b.bill_status = 1 AND 'paid' LIKE ?)
            OR (b.bill_status = 0 AND 'due' LIKE ?)
          )
        )
      `;

      params.push(
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
      );
    }

    getQROrdersQuery += ` ORDER BY co.order_id DESC`;

    db.all(getQROrdersQuery, params, (err, result) => {
      if (err) {
        console.error("Error fetching QR orders:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching QR orders",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: result || [],
        message: "QR Orders fetched successfully",
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};
// allOrderList
const allOrderList = async (req, res) => {
  try {
    const userId = req.id;
    const creatorId = await resolveCreatorId(userId);
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const getAllOrderList = `
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
      sm.shipping_method AS shipping_method_name
      FROM
      customer_order co
       LEFT JOIN
      customer_info c ON co.customer_id = c.customer_id
       LEFT JOIN
      user w ON co.waiter_id = w.id
        LEFT JOIN
        rest_table rt ON co.table_no = rt.tableid
       LEFT JOIN
      bill b ON co.order_id = b.order_id
      LEFT JOIN
      shipping_method sm ON b.shipping_type = sm.ship_id
      WHERE co.created_by = ?
      ORDER BY co.order_id DESC;
    `;

    db.all(getAllOrderList, [creatorId], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "An error occurred" });
      } else {
        res.status(200).json({
          success: true,
          data: result,
          message: "All Orders fetched successfully",
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};
// getOrderById
const getOrderById = async (req, res) => {
  const order_id = req.params.order_id;

  if (!order_id) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    const userId = req.id;
    const creatorId = await resolveCreatorId(userId);
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });

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
              b.bill_amount,
              b.bill_date,
              b.bill_status,
              b.payment_method_id,
              ct.customer_type,
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
              LEFT JOIN customer_type ct ON co.cutomertype = ct.customer_type_id
          WHERE co.order_id = ? AND co.created_by = ?;
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
    LEFT JOIN add_ons a ON ',' || om.add_on_id || ',' LIKE '%,' || a.add_on_id || ',%'
    LEFT JOIN item_foods f ON om.menu_id = f.ProductsID
    LEFT JOIN variant v ON om.varientid = v.variantid
WHERE
    om.order_id = ?
GROUP BY om.menu_id, om.varientid;

      `;

    db.all(getOrderDetailsQuery, [order_id, creatorId], (err, orderResult) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching order details",
        });
      }

      db.all(getOrderMenuQuery, [order_id], (err, menuResult) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching menu items",
          });
        }

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
          orderDetails: orderResult,
          menuItems: structuredMenuItems,
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

const getOngoingOrder = async (req, res) => {
  try {
    const userId = req.id;
    const creatorId = await resolveCreatorId(userId);
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const getOnGoingOrdersQuery = `
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
          sm.shipping_method AS shipping_method_name
      FROM
        customer_order co
       LEFT JOIN
        customer_info c ON co.customer_id = c.customer_id
       LEFT JOIN
        user w ON co.waiter_id = w.id
         LEFT JOIN
        rest_table rt ON co.table_no = rt.tableid
         LEFT JOIN
      bill b ON co.order_id = b.order_id
      LEFT JOIN
      shipping_method sm ON b.shipping_type = sm.ship_id
      WHERE
      co.orderacceptreject = 1
      AND co.order_status = 2
      AND b.bill_status = 0
      AND co.created_by = ?
      ORDER BY co.order_id DESC;
    `;
    db.all(getOnGoingOrdersQuery, [creatorId], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "An error occurred" });
      } else {
        res.status(200).json({
          success: true,
          data: result,
          message: "Ongoing Orders fetched successfully",
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

const cancelorder = async (req, res) => {
  const { order_id } = req.params;
  const { anyreason } = req.body;

  if (!order_id || !anyreason) {
    return res.status(400).json({
      success: false,
      message: "Missing order_id or cancellation reason",
    });
  }

  try {
    const userId = req.id;
    const creatorId = await resolveCreatorId(userId);
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const getTableQuery = `SELECT table_no FROM customer_order WHERE order_id = ? AND created_by = ?`;
    db.all(getTableQuery, [order_id, creatorId], (err, result) => {
    if (err) {
      console.error("Error fetching table_no:", err);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching the table number",
      });
    }

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No order found with the provided order_id",
      });
    }

    const tableid = result[0].table_no;

    // Step 2: Update table status
    const updateTableQuery = `UPDATE rest_table SET status = 0 WHERE tableid = ?`;
    db.run(updateTableQuery, [tableid], function (err) {
      if (err) {
        console.error("Error updating table status:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while updating the table status",
        });
      }

      // Step 3: Update order status and cancellation reason
      const updateOrderQuery = `
        UPDATE customer_order 
        SET order_status = 5, anyreason = ?
        WHERE order_id = ?`;

      db.run(updateOrderQuery, [anyreason, order_id], function (err) {
        if (err) {
          console.error("Error updating customer_order:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while updating the order",
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: "No order found with the provided order_id",
          });
        }

        // Success response
        res.status(200).json({
          success: true,
          message: "Order canceled successfully",
        });
      });
    });
  });
  } catch (err) {
    console.error("Error in cancelorder:", err);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const cancelOrdersList = async (req, res) => {
  const userId = req.id;
  const { searchItem } = req.query;

  try {
    const checkUserQuery = `
      SELECT is_admin, created_by 
      FROM user 
      WHERE id = ?
    `;

    const userData = await new Promise((resolve, reject) => {
      db.get(checkUserQuery, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isAdmin = userData.is_admin;
    const createdBy = userData.created_by;

    if (!isAdmin && !createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view canceled orders.",
      });
    }

    const allowedCreatorId = isAdmin ? userId : createdBy;

    let cancelOrdersQuery = `
      SELECT
        co.*,
        c.customer_name,
        w.firstname AS waiter_first_name,
        w.lastname AS waiter_last_name,
        ct.customer_type AS customer_type_name,
        rt.tablename,
        b.discount,
        b.service_charge,
        b.shipping_type,
        b.VAT,
        b.bill_amount,
        b.bill_date,
        b.bill_status,
        b.payment_method_id,
        sm.shipping_method AS shipping_method_name
      FROM customer_order co
      LEFT JOIN customer_info c ON co.customer_id = c.customer_id
      LEFT JOIN customer_type ct ON co.cutomertype = ct.customer_type_id
      LEFT JOIN user w ON co.waiter_id = w.id
      LEFT JOIN rest_table rt ON co.table_no = rt.tableid
      LEFT JOIN bill b ON co.order_id = b.order_id
      LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id
      WHERE co.order_status = 5
      AND co.created_by = ?
    `;

    const params = [allowedCreatorId];

    if (searchItem) {
      const searchQuery = `%${searchItem}%`;

      cancelOrdersQuery += `
        AND (
          co.order_id LIKE ?
          OR c.customer_name LIKE ?
          OR w.firstname LIKE ?
          OR w.lastname LIKE ?
          OR ct.customer_type LIKE ?
          OR rt.tablename LIKE ?
          OR b.bill_amount LIKE ?
          OR b.bill_date LIKE ?
          OR co.order_date LIKE ?
        )
      `;

      params.push(
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
      );
    }

    cancelOrdersQuery += ` ORDER BY co.order_id DESC`;

    db.all(cancelOrdersQuery, params, (err, result) => {
      if (err) {
        console.error("Error fetching canceled orders:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching canceled orders",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: result || [],
        message: "Canceled Orders fetched successfully",
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

const completeOrders = async (req, res) => {
  const userId = req.id;
  const { SearchItem } = req.query;

  try {
    const checkUserQuery = `
      SELECT is_admin, created_by 
      FROM user 
      WHERE id = ?
    `;

    const userData = await new Promise((resolve, reject) => {
      db.get(checkUserQuery, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isAdmin = userData.is_admin;
    const createdBy = userData.created_by;

    if (!isAdmin && !createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view complete orders.",
      });
    }

    const allowedCreatorId = isAdmin ? userId : createdBy;

    let getCompleteOrders = `
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
      AND co.created_by = ?
    `;

    let params = [allowedCreatorId];

    if (SearchItem) {
      const searchQuery = `%${SearchItem}%`;

      getCompleteOrders += `
        AND (
          c.customer_name LIKE ?
          OR w.firstname LIKE ?
          OR w.lastname LIKE ?
          OR (w.firstname || ' ' || w.lastname) LIKE ?
          OR rt.tablename LIKE ?
          OR b.bill_amount LIKE ?
          OR ct.customer_type LIKE ?
          OR co.order_id LIKE ?
          OR co.order_date LIKE ?
        )
      `;

      params.push(
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
      );
    }

    getCompleteOrders += ` ORDER BY co.order_id DESC`;

    db.all(getCompleteOrders, params, (err, result) => {
      if (err) {
        console.error("Error fetching complete orders:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching complete orders",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: result || [],
        message: "Complete Orders fetched successfully",
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

//  all order list and filter data
const OrderListBySearchFilter = async (req, res) => {
  try {
    const userId = req.id;
    const { from, to, searchName } = req.query;

    const checkUserQuery = `
      SELECT is_admin, created_by 
      FROM user 
      WHERE id = ?
    `;

    const userData = await new Promise((resolve, reject) => {
      db.get(checkUserQuery, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isAdmin = userData.is_admin;
    const createdBy = userData.created_by;

    if (!isAdmin && !createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view orders.",
      });
    }

    const allowedCreatorId = isAdmin ? userId : createdBy;

    let getAllOrderList = `
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
        sm.shipping_method AS shipping_method_name
      FROM customer_order co
      LEFT JOIN customer_info c ON co.customer_id = c.customer_id
      LEFT JOIN user w ON co.waiter_id = w.id
      LEFT JOIN rest_table rt ON co.table_no = rt.tableid
      LEFT JOIN bill b ON co.order_id = b.order_id
      LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id
      WHERE co.created_by = ?
    `;

    const params = [allowedCreatorId];

    if (from && to) {
      getAllOrderList += ` AND co.order_date BETWEEN ? AND ?`;
      params.push(from, to);
    }

    if (searchName) {
      const searchQuery = `%${searchName}%`;

      getAllOrderList += `
        AND (
          c.customer_name LIKE ?
          OR (w.firstname || ' ' || w.lastname) LIKE ?
          OR rt.tablename LIKE ?
          OR b.bill_amount LIKE ?
          OR co.saleinvoice LIKE ?
          OR co.order_date LIKE ?
          OR co.shipping_date LIKE ?
          OR (b.bill_status = 1 AND 'paid' LIKE ?)
          OR (b.bill_status = 0 AND 'due' LIKE ?)
        )
      `;

      params.push(
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
      );
    }

    getAllOrderList += ` ORDER BY co.order_id DESC`;

    db.all(getAllOrderList, params, (err, result) => {
      if (err) {
        console.error("Error fetching orders:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching orders",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: result || [],
        message: "All Orders fetched successfully",
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};
//pending order
const pendingOrders = async (req, res) => {
  const userId = req.id;
  const { searchItem } = req.query;

  try {
    const checkUserQuery = `
      SELECT is_admin, created_by 
      FROM user 
      WHERE id = ?
    `;

    const userData = await new Promise((resolve, reject) => {
      db.get(checkUserQuery, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isAdmin = userData.is_admin;
    const createdBy = userData.created_by;

    if (!isAdmin && !createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view pending orders.",
      });
    }

    const allowedCreatorId = isAdmin ? userId : createdBy;

    let getPendingOrders = `
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
      WHERE (co.order_status = 1 OR co.order_status = 2)
      AND co.created_by = ?
    `;

    const params = [allowedCreatorId];

    if (searchItem) {
      const searchQuery = `%${searchItem}%`;

      getPendingOrders += `
        AND (
          co.saleinvoice LIKE ?
          OR c.customer_name LIKE ?
          OR w.firstname LIKE ?
          OR w.lastname LIKE ?
          OR rt.tablename LIKE ?
          OR co.order_date LIKE ?
          OR b.bill_amount LIKE ?
          OR co.shipping_date LIKE ?
          OR (b.bill_status = 1 AND 'paid' LIKE ?)
          OR (b.bill_status = 0 AND 'due' LIKE ?)
        )
      `;

      params.push(
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
      );
    }

    getPendingOrders += ` ORDER BY co.order_id DESC`;

    db.all(getPendingOrders, params, (err, result) => {
      if (err) {
        console.error("Error fetching pending orders:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching pending orders",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: result || [],
        message: "Pending Orders fetched successfully",
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};
// online order

const getOnlineOrders = async (req, res) => {
  const userId = req.id;
  const { searchItem } = req.query;

  try {
    const checkUserQuery = `
      SELECT is_admin, created_by 
      FROM user 
      WHERE id = ?
    `;

    const userData = await new Promise((resolve, reject) => {
      db.get(checkUserQuery, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isAdmin = userData.is_admin;
    const createdBy = userData.created_by;

    if (!isAdmin && !createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view online orders.",
      });
    }

    const allowedCreatorId = isAdmin ? userId : createdBy;

    let getOnlineOrdersQuery = `
      SELECT
        co.*,
        c.customer_name,
        c.customer_phone AS customer_number,
        w.firstname AS waiter_first_name,
        w.lastname AS waiter_last_name,
        rt.tablename,
        b.discount,
        b.service_charge,
        b.shipping_type AS shipping_type_id,
        b.VAT,
        b.bill_amount,
        b.bill_date,
        b.bill_status,
        b.payment_method_id,
        sm.shipping_method AS shipping_method_name
      FROM customer_order co
      LEFT JOIN customer_info c ON co.customer_id = c.customer_id
      LEFT JOIN user w ON co.waiter_id = w.id
      LEFT JOIN rest_table rt ON co.table_no = rt.tableid
      LEFT JOIN bill b ON co.order_id = b.order_id
      LEFT JOIN shipping_method sm ON b.shipping_type = sm.ship_id
      WHERE co.cutomertype = 2
      AND co.created_by = ?
    `;

    const params = [allowedCreatorId];

    if (searchItem) {
      const searchQuery = `%${searchItem}%`;
      const lowerSearch = searchItem.toLowerCase();

      if (lowerSearch.startsWith("p")) {
        getOnlineOrdersQuery += `
          AND (
            b.bill_status = 1
            OR c.customer_name LIKE ?
            OR w.firstname LIKE ?
            OR w.lastname LIKE ?
            OR sm.shipping_method LIKE ?
            OR co.shipping_date LIKE ?
            OR rt.tablename LIKE ?
            OR co.saleinvoice LIKE ?
            OR co.order_date LIKE ?
            OR b.bill_amount LIKE ?
            OR b.bill_date LIKE ?
          )
        `;

        params.push(
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
        );
      } else if (lowerSearch.startsWith("d")) {
        getOnlineOrdersQuery += `
          AND (
            b.bill_status = 0
            OR c.customer_name LIKE ?
            OR w.firstname LIKE ?
            OR w.lastname LIKE ?
            OR sm.shipping_method LIKE ?
            OR co.shipping_date LIKE ?
            OR rt.tablename LIKE ?
            OR co.saleinvoice LIKE ?
            OR co.order_date LIKE ?
            OR b.bill_amount LIKE ?
            OR b.bill_date LIKE ?
          )
        `;

        params.push(
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
        );
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(searchItem)) {
        getOnlineOrdersQuery += ` AND DATE(co.order_date) = ?`;
        params.push(searchItem);
      } else {
        getOnlineOrdersQuery += `
          AND (
            co.saleinvoice LIKE ?
            OR c.customer_name LIKE ?
            OR w.firstname LIKE ?
            OR w.lastname LIKE ?
            OR (w.firstname || ' ' || w.lastname) LIKE ?
            OR sm.shipping_method LIKE ?
            OR co.shipping_date LIKE ?
            OR rt.tablename LIKE ?
            OR co.order_date LIKE ?
            OR b.bill_amount LIKE ?
            OR b.bill_date LIKE ?
          )
        `;

        params.push(
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
        );
      }
    }

    getOnlineOrdersQuery += ` ORDER BY co.order_id DESC`;

    db.all(getOnlineOrdersQuery, params, (err, result) => {
      if (err) {
        console.error("Error fetching online orders:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching online orders",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: result || [],
        message: "Online Orders fetched successfully",
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

const getQrorderdata = async (req, res) => {
  const categoryId = req.query.categoryId;
  const searchTerm = req.query.searchTerm || "";

  let queryProducts;
  let params = [];

  if (categoryId) {
    queryProducts = `
          SELECT f.*, m.*, k.kitchen_name, p.*
          FROM item_foods f
          LEFT JOIN tbl_menutype m ON f.menutype = m.menutypeid
          LEFT JOIN tbl_kitchen k ON f.kitchenid = k.kitchenid
          LEFT JOIN printers p ON k.printer_id = p.id
          WHERE f.CategoryID = ? AND f.ProductsIsActive = 1
      `;
    params.push(categoryId);
  } else {
    queryProducts = `
          SELECT f.*, m.*, k.kitchen_name, p.*
          FROM item_foods f
          LEFT JOIN tbl_menutype m ON f.menutype = m.menutypeid
          LEFT JOIN tbl_kitchen k ON f.kitchenid = k.kitchenid
          LEFT JOIN printers p ON k.printer_id = p.id
          WHERE f.ProductsIsActive = 1
      `;
  }

  try {
    const products = await new Promise((resolve, reject) => {
      db.all(queryProducts, params, (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });

    if (products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    const detailedProducts = [];

    for (const product of products) {
      let params2 = [product.ProductsID];
      let queryVariants = `
              SELECT v.*, v.variantName, v.price
              FROM variant v
              WHERE v.menuid = ?
          `;
      if (searchTerm) {
        queryVariants += ` AND (v.variantName LIKE ? OR v.price LIKE ?)`;
        params2.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }

      const variants = await new Promise((resolve, reject) => {
        db.pool.query(queryVariants, params2, (err, results) => {
          if (err) reject(err);
          resolve(results || []);
        });
      });

      const addons = await new Promise((resolve, reject) => {
        const queryAddons = `
                  SELECT a.*
                  FROM menu_add_on ma
                  LEFT JOIN add_ons a ON ma.add_on_id = a.add_on_id
                  WHERE ma.is_active = 1 AND ma.menu_id = ?;
              `;
        db.pool.query(queryAddons, [product.ProductsID], (err, results) => {
          if (err) reject(err);
          resolve(results || []);
        });
      });

      if (variants.length > 0) {
        variants.forEach((variant) => {
          detailedProducts.push({
            ProductName: product.ProductName,
            ProductImage: product.ProductImage,
            productvat: product.productvat,
            CategoryID: product.CategoryID,
            ProductsID: product.ProductsID,
            kitchen_name: product.kitchen_name,
            kitchenid: product.kitchenid,
            menutype: product.menutype,
            variantid: variant.variantid,
            menuid: variant.menuid,
            variantName: variant.variantName,
            price: variant.price,
            addons,
          });
        });
      } else if (searchTerm) {
        if (
          product.ProductName.toLowerCase().includes(
            searchTerm.toLowerCase(),
          ) ||
          product.ProductImage.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          detailedProducts.push({
            ProductName: product.ProductName,
            ProductImage: product.ProductImage,
            productvat: product.productvat,
            CategoryID: product.CategoryID,
            ProductsID: product.ProductsID,
            kitchen_name: product.kitchen_name,
            kitchenid: product.kitchenid,
            menutype: product.menutype,
            variants: [],
            addons,
          });
        }
      } else {
        detailedProducts.push({
          ProductName: product.ProductName,
          ProductImage: product.ProductImage,
          productvat: product.productvat,
          CategoryID: product.CategoryID,
          ProductsID: product.ProductsID,
          kitchen_name: product.kitchen_name,
          kitchenid: product.kitchenid,
          menutype: product.menutype,
          variants: [],
          addons,
        });
      }
    }

    res.status(200).json(detailedProducts);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const Placeqrorder = (req, res) => {
  const {
    order_details,
    grand_total,

    VAT,

    table_id = 7,
    customer_type = 99,

    customer_name,
    customer_note,
    customer_phone,
  } = req.body;

  const create_by = req.id || 178;

  // Validate required fields
  if (
    !order_details ||
    !Array.isArray(order_details) ||
    order_details.length === 0 ||
    !grand_total
  ) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  // Insert customer info
  const customer_query = `INSERT INTO customer_info (customer_name, customer_phone) VALUES (?, ?)`;
  db.pool.query(
    customer_query,
    [customer_name, customer_phone],
    (err, result) => {
      if (err) {
        console.error("Error inserting customer:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      const customer_id = result.insertId;
      console.log("c", customer_id);
      // const total_amount = grand_total - VAT ;
      // Insert the order
      const orderQuery = `INSERT INTO customer_order 
      (saleinvoice, cutomertype, isthirdparty, waiter_id, order_date, order_time, table_no, totalamount, order_status, orderacceptreject, splitpay_status, customer_note, customer_id)
      VALUES (?, ?, 0, 0, NOW(), CURTIME(), ?, ?, 1, 1, 0, ?, ?)`;

      const maxOrderIdQuery =
        "SELECT MAX(order_id) AS maxOrderId FROM customer_order";
      db.pool.query(maxOrderIdQuery, (err, result) => {
        if (err) {
          console.error("Error getting max order ID:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        const maxOrderId = result[0]?.maxOrderId || 0;
        const invoiceId = maxOrderId + 1;
        console.log("grand total aaya ", grand_total);
        db.pool.query(
          orderQuery,
          [
            invoiceId,
            customer_type,
            table_id,
            grand_total,
            customer_note,
            customer_id,
          ],

          (err, result) => {
            if (err) {
              console.error("Error inserting order:", err);
              return res.status(500).json({ message: "Internal server error" });
            }

            const orderId = result.insertId;

            // Insert order details
            const orderDetailsQuery = `INSERT INTO order_menu 
          (order_id, menu_id, price, menuqty, add_on_id, addonsqty, varientid, food_status, allfoodready)
          VALUES ?`;
            const orderDetailsData = order_details.map((detail) => {
              const addOnIds = Array.isArray(detail.checkedaddons)
                ? detail.checkedaddons.map((addon) => addon.add_on_id).join(",")
                : null;
              const addOnQuantities = Array.isArray(detail.checkedaddons)
                ? detail.checkedaddons
                    .map((addon) => addon.add_on_quantity)
                    .join(",")
                : null;
              // console.log("order details", detail);
              return [
                orderId,
                detail.ProductsID,
                // detail.productID,

                detail.price,
                detail.quantity,
                addOnIds,
                addOnQuantities,
                detail.variantid || null,
                0, // food_status
                0, // allfoodready
              ];
            });

            db.pool.query(orderDetailsQuery, [orderDetailsData], (err) => {
              if (err) {
                console.error("Error inserting order details:", err);
                return res
                  .status(500)
                  .json({ message: "Internal server error" });
              }

              // Update table status to booked
              const updateTableStatusQuery =
                "UPDATE rest_table SET status = 1 WHERE tableid = ?";
              db.pool.query(updateTableStatusQuery, [table_id], (err) => {
                if (err) {
                  console.error("Error updating table status:", err);
                  return res
                    .status(500)
                    .json({ message: "Internal server error" });
                }

                const total_amount = grand_total - VAT;
                const shipping_type = customer_type === 99 ? 1 : null;

                // Insert into bill table
                const invoiceQuery = `INSERT INTO bill 
              (create_by, order_id, total_amount,payment_method_id,shipping_type, VAT, bill_amount, bill_date, bill_time, create_at, bill_status, create_date)
              VALUES (?, ?,  ?, 0, ?, ?, ?, NOW(), CURTIME(), NOW(), 0,  NOW())`;

                const billData = [
                  create_by,
                  orderId,
                  total_amount,

                  shipping_type,
                  VAT,
                  grand_total,
                ];

                db.pool.query(invoiceQuery, billData, (err) => {
                  if (err) {
                    console.error("Error inserting invoice:", err);
                    return res
                      .status(500)
                      .json({ message: "Internal server error" });
                  }

                  // Insert into table details if customer_type is 99
                  if (customer_type === 99) {
                    const additionalQuery = `INSERT INTO table_details 
                  (table_id, customer_id, order_id, time_enter, created_at)
                  VALUES (?, ?, ?, CURTIME(), NOW())`;

                    db.pool.query(
                      additionalQuery,
                      [table_id, customer_id, orderId],
                      (err) => {
                        if (err) {
                          console.error("Error inserting table data:", err);
                          return res
                            .status(500)
                            .json({ message: "Internal server error" });
                        }
                      },
                    );
                  }

                  // Success response
                  res.status(201).json({
                    message: "Order placed successfully",
                    orderId,
                    invoiceId,
                  });
                });
              });
            });
          },
        );
      });
    },
  );
};

const getQrOrderById = async (req, res) => {
  const order_id = req.params.id;

  if (!order_id) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    // Query to fetch order details, customer info, waiter info, and bill details
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
            
          WHERE
              co.order_id = ?;
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

    db.pool.query(getOrderDetailsQuery, [order_id], (err, orderResult) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching order details",
        });
      }

      db.pool.query(getOrderMenuQuery, [order_id], (err, menuResult) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching menu items",
          });
        }

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
          orderDetails: orderResult,
          menuItems: structuredMenuItems,
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

const Updateqrorder = (req, res) => {
  const order_id = req.params.id;
  console.log("order id", order_id);
  const {
    order_details,
    grand_total,
    VAT,
    table_id,
    customer_name,
    customer_phone,
    customer_note,
  } = req.body;

  const update_by = req.id || 178;

  // Validate required fields
  if (
    !order_id ||
    !order_details ||
    !Array.isArray(order_details) ||
    order_details.length === 0 ||
    !grand_total
  ) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  // Update customer info
  const updateCustomerQuery = `UPDATE customer_info SET customer_name = ?, customer_phone = ? WHERE customer_id = (SELECT customer_id FROM customer_order WHERE order_id = ?)`;
  db.pool.query(
    updateCustomerQuery,
    [customer_name, customer_phone, order_id],
    (err) => {
      if (err) {
        console.error("Error updating customer:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      // Update order
      const updateOrderQuery = `UPDATE customer_order SET table_no = ?, totalamount = ?, customer_note = ? WHERE order_id = ?`;
      db.pool.query(
        updateOrderQuery,
        [table_id, grand_total, customer_note, order_id],
        (err) => {
          if (err) {
            console.error("Error updating order:", err);
            return res.status(500).json({ message: "Internal server error" });
          }

          // Delete existing order details
          const deleteOrderDetailsQuery = `DELETE FROM order_menu WHERE order_id = ?`;
          db.pool.query(deleteOrderDetailsQuery, [order_id], (err) => {
            if (err) {
              console.error("Error deleting order details:", err);
              return res.status(500).json({ message: "Internal server error" });
            }

            // Insert updated order details
            const insertOrderDetailsQuery = `INSERT INTO order_menu 
          (order_id, menu_id, price, menuqty, add_on_id, addonsqty, varientid, food_status, allfoodready)
          VALUES ?`;

            const orderDetailsData = order_details.map((detail) => {
              const addOnIds = Array.isArray(detail.checkedaddons)
                ? detail.checkedaddons.map((addon) => addon.add_on_id).join(",")
                : null;
              const addOnQuantities = Array.isArray(detail.checkedaddons)
                ? detail.checkedaddons
                    .map((addon) => addon.add_on_quantity)
                    .join(",")
                : null;
              return [
                order_id,
                detail.ProductsID,
                detail.price,
                detail.quantity,
                addOnIds,
                addOnQuantities,
                detail.variantid || null,
                0, // food_status
                0, // allfoodready
              ];
            });

            db.pool.query(
              insertOrderDetailsQuery,
              [orderDetailsData],
              (err) => {
                if (err) {
                  console.error("Error inserting updated order details:", err);
                  return res
                    .status(500)
                    .json({ message: "Internal server error" });
                }

                // Update table status
                const updateTableStatusQuery = `UPDATE rest_table SET status = 1 WHERE tableid = ?`;
                db.pool.query(updateTableStatusQuery, [table_id], (err) => {
                  if (err) {
                    console.error("Error updating table status:", err);
                    return res
                      .status(500)
                      .json({ message: "Internal server error" });
                  }

                  // Update bill
                  const total_amount = grand_total - VAT;
                  const updateBillQuery = `UPDATE bill SET 
              total_amount = ?,
              VAT = ?,
              bill_amount = ?,
              update_by = ?,
              update_date = NOW()
              WHERE order_id = ?`;

                  db.pool.query(
                    updateBillQuery,
                    [total_amount, VAT, grand_total, update_by, order_id],
                    (err) => {
                      if (err) {
                        console.error("Error updating bill:", err);
                        return res
                          .status(500)
                          .json({ message: "Internal server error" });
                      }

                      // Success response
                      res.status(200).json({
                        message: "Order updated successfully",
                        order_id,
                      });
                    },
                  );
                });
              },
            );
          });
        },
      );
    },
  );
};

const getQrOrderDetailsById = async (req, res) => {
  const order_id = req.params.id;

  if (!order_id) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    // Query to fetch order details, customer info, waiter info, and bill details
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
            
          WHERE
              co.order_id = ?;
      `;

    // Query to fetch menu items associated with the order
    const getOrderMenuQuery = `
          SELECT
              om.*,
              om.menuqty AS quantity,
              f.*,
              v.variantName,
              om.varientid AS variantid,
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

    db.pool.query(getOrderDetailsQuery, [order_id], (err, orderResult) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching order details",
        });
      }

      db.pool.query(getOrderMenuQuery, [order_id], (err, menuResult) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching menu items",
          });
        }

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
          orderDetails: orderResult,
          menuItems: structuredMenuItems,
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

module.exports = {
  getCategoryList,
  getProductsByCategory,
  orderPlace,
  getTodayOrders,
  getWaiter,
  getQROrders,
  allOrderList,
  getOrderById,
  getOngoingOrder,
  cancelorder,
  cancelOrdersList,
  completeOrders,
  OrderListBySearchFilter,
  pendingOrders,
  getOnlineOrders,
  getQrorderdata,
  Placeqrorder,
  getQrOrderById,
  Updateqrorder,
  getQrOrderDetailsById,
};
