const db = require("../utils/db");
// const dbQuery = (query, values) => {
//     return new Promise((resolve, reject) => {
//       db.all(query, values, (err, result) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(result);
//       });
//     });
//   };

//   const getPackagingWasteDetails = async (req, res) => {
//     const { from, to, searchItem } = req.query;

//     try {
//       // Base SQL query to get packaging food waste details along with ingredient name
//       let getWasteDetailsQuery = `
//         SELECT
//           pfw.order_id,
//           pfw.id,
//           pfw.ingradient_id,
//           pfw.qnty,
//           pfw.l_price,
//           pfw.note,
//           pfw.created_at,
//           ing.ingredient_name
//         FROM packaging_food_waste pfw
//         INNER JOIN ingredients ing ON pfw.ingradient_id = ing.id
//       `;

//       let queryParams = [];
//       let whereConditions = [];

//       // Date filtering condition
//       if (from && to) {
//         whereConditions.push(`pfw.created_at BETWEEN ? AND ?`);
//         queryParams.push(from, to);
//       }

//       // Search filtering condition for all relevant columns
//       if (searchItem) {
//         const searchValue = `%${searchItem}%`; // Wildcard for partial match
//         whereConditions.push(`
//           (pfw.order_id LIKE ?
//           OR pfw.ingradient_id LIKE ?
//           OR pfw.qnty LIKE ?
//           OR pfw.l_price LIKE ?
//           OR pfw.note LIKE ?
//           OR pfw.created_at LIKE ?
//           OR ing.ingredient_name LIKE ?)
//         `);
//         queryParams.push(searchValue, searchValue, searchValue, searchValue, searchValue, searchValue, searchValue);
//       }

//       // If there are conditions, add them to the query
//       if (whereConditions.length > 0) {
//         getWasteDetailsQuery += ` WHERE ` + whereConditions.join(' AND ');

//       }

//       getWasteDetailsQuery+=` ORDER BY pfw.id DESC`

//       const wasteDetails = await dbQuery(getWasteDetailsQuery, queryParams);

//       // If no records found, send 404 response
//       if (wasteDetails.length === 0) {
//         return res.status(404).send({ message: 'No packaging food waste records found' });
//       }

//       // Send the result back in response
//       res.status(200).send({ data: wasteDetails });
//     } catch (error) {
//       console.error("Error fetching packaging waste details:", error);
//       res.status(500).send({ message: 'Server error', error });
//     }
//   };
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

const getPackagingWasteDetails = async (req, res) => {
  const { from, to, searchItem } = req.query;
  const user_id = req.id;

  try {
    const subscriptionQuery = `
      SELECT *
      FROM superadmin_user_plans
      WHERE user_id = ?
    `;

    db.all(subscriptionQuery, [user_id], (err, subscriptionResult) => {
      if (err) {
        console.error("Subscription check error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      const fetchWasteDetails = (ownerId) => {
        let getWasteDetailsQuery = `
          SELECT
            pfw.order_id,
            pfw.id,
            pfw.ingradient_id,
            pfw.qnty,
            pfw.l_price,
            pfw.note,
            pfw.created_at,
            ing.ingredient_name
          FROM packaging_food_waste pfw
          INNER JOIN ingredients ing
            ON pfw.ingradient_id = ing.id
          WHERE pfw.createdby = ?
        `;

        const queryParams = [ownerId];

        if (from && to) {
          getWasteDetailsQuery += `
            AND pfw.created_at BETWEEN ? AND ?
          `;
          queryParams.push(from, to);
        }

        if (searchItem && searchItem.trim() !== "") {
          const searchValue = `%${searchItem.trim()}%`;

          getWasteDetailsQuery += `
            AND (
              CAST(pfw.order_id AS TEXT) LIKE ?
              OR CAST(pfw.ingradient_id AS TEXT) LIKE ?
              OR CAST(pfw.qnty AS TEXT) LIKE ?
              OR CAST(pfw.l_price AS TEXT) LIKE ?
              OR pfw.note LIKE ?
              OR pfw.created_at LIKE ?
              OR ing.ingredient_name LIKE ?
            )
          `;

          queryParams.push(
            searchValue,
            searchValue,
            searchValue,
            searchValue,
            searchValue,
            searchValue,
            searchValue
          );
        }

        getWasteDetailsQuery += ` ORDER BY pfw.id DESC`;

        db.all(getWasteDetailsQuery, queryParams, (err, wasteDetails) => {
          if (err) {
            console.error(
              "Error fetching packaging waste details:",
              err
            );

            return res.status(500).json({
              success: false,
              message: "Server error",
              error: err.message,
            });
          }

          return res.status(200).json({
            success: true,
            data: wasteDetails,
            message:
              wasteDetails.length > 0
                ? "Packaging food waste records fetched successfully"
                : "No packaging food waste records found",
          });
        });
      };

      // User has direct subscription
      if (subscriptionResult.length > 0) {
        return fetchWasteDetails(user_id);
      }

      // Check creator
      const userQuery = `
        SELECT created_by
        FROM user
        WHERE id = ?
      `;

      db.get(userQuery, [user_id], (err, userData) => {
        if (err) {
          console.error("User lookup error:", err);

          return res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
          });
        }

        if (!userData || !userData.created_by) {
          return res.status(403).json({
            success: false,
            message:
              "You are not authorized to access packaging waste details.",
          });
        }

        const createdBy = userData.created_by;

        // Check creator subscription
        db.all(subscriptionQuery, [createdBy], (err, creatorSubResult) => {
          if (err) {
            console.error(
              "Creator subscription check error:",
              err
            );

            return res.status(500).json({
              success: false,
              message: "Database error",
              error: err.message,
            });
          }

          if (creatorSubResult.length === 0) {
            return res.status(403).json({
              success: false,
              message: "Creator does not have an active subscription.",
            });
          }

          fetchWasteDetails(createdBy);
        });
      });
    });
  } catch (error) {
    console.error(
      "Unexpected error in getPackagingWasteDetails:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

const insertPackageInformation = async (req, res) => {
  const { orderdetails, itemdetails } = req.body;
  const saveid = req.id;
  const newDate = new Date().toISOString().slice(0, 10);

  try {
    if (
      !orderdetails ||
      !Array.isArray(orderdetails) ||
      orderdetails.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Order details are required",
      });
    }

    if (
      !itemdetails ||
      !Array.isArray(itemdetails) ||
      itemdetails.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Item details are required",
      });
    }

    const { orderid } = orderdetails[0];

    if (!orderid) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Step 1: Check logged-in user subscription
    const checkSubscriptionQuery = `
      SELECT * 
      FROM superadmin_user_plans 
      WHERE user_id = ?
    `;

    const subscriptionResult = await dbQuery(checkSubscriptionQuery, [saveid]);

    let created_by;

    if (subscriptionResult.length > 0) {
      created_by = saveid;
    } else {
      // Step 2: Check logged-in user's created_by
      const checkUserCreatedByQuery = `
        SELECT created_by 
        FROM user 
        WHERE id = ?
      `;

      const userResult = await dbQuery(checkUserCreatedByQuery, [saveid]);

      if (userResult.length === 0 || !userResult[0].created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to insert packaging information.",
        });
      }

      const userCreatedBy = userResult[0].created_by;

      // Step 3: Check creator subscription
      const checkCreatorSubscriptionQuery = `
        SELECT * 
        FROM superadmin_user_plans 
        WHERE user_id = ?
      `;

      const creatorSubscription = await dbQuery(checkCreatorSubscriptionQuery, [
        userCreatedBy,
      ]);

      if (creatorSubscription.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Creator does not have an active subscription.",
        });
      }

      created_by = userCreatedBy;
    }

    // Check if order already exists
    const checkWasteQuery = `
      SELECT * 
      FROM packaging_food_waste 
      WHERE order_id = ? 
      AND createdby = ?
    `;

    const wasteResult = await dbQuery(checkWasteQuery, [orderid, created_by]);

    if (wasteResult.length > 0) {
      return res.status(400).json({
        success: false,
        message: "The order already exists",
      });
    }

    // Check order exists for current date
    const checkOrderQuery = `
      SELECT order_id 
      FROM customer_order 
      WHERE order_id = ? 
      AND DATE(order_date) = ?
      AND created_by = ?
    `;

    const orderResult = await dbQuery(checkOrderQuery, [
      orderid,
      newDate,
      created_by,
    ]);

    if (orderResult.length !== 1) {
      return res.status(400).json({
        success: false,
        message: "Order not found for the current date",
      });
    }

    for (let index = 0; index < itemdetails.length; index++) {
      const { ingradient_id, qnty, l_price, note } = itemdetails[index];

      if (!ingradient_id || !qnty || !l_price) {
        return res.status(400).json({
          success: false,
          message: "Ingredient ID, quantity and price are required",
        });
      }

      const finallostprice = Number(qnty) * Number(l_price);

      const updateStockQuery = `
        UPDATE ingredients 
        SET stock_qty = stock_qty - ? 
        WHERE id = ?
        AND created_by = ?
      `;

      await dbQuery(updateStockQuery, [qnty, ingradient_id, created_by]);

      const insertWasteQuery = `
        INSERT INTO packaging_food_waste 
          (order_id, ingradient_id, qnty, l_price, note, createdby, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await dbQuery(insertWasteQuery, [
        orderid,
        ingradient_id,
        qnty,
        finallostprice,
        note || "",
        created_by,
        newDate,
      ]);
    }

    return res.status(200).json({
      success: true,
      message: "Packaging information inserted successfully",
    });
  } catch (err) {
    console.error("Error processing request:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const getAuthorizedCreatedBy = async (userId) => {
  const subscriptionResult = await dbQuery(
    `SELECT * FROM superadmin_user_plans WHERE user_id = ?`,
    [userId],
  );

  if (subscriptionResult.length > 0) {
    return userId;
  }

  const userResult = await dbQuery(`SELECT created_by FROM user WHERE id = ?`, [
    userId,
  ]);

  if (userResult.length === 0 || !userResult[0].created_by) {
    return null;
  }

  const createdBy = userResult[0].created_by;

  const creatorSubscription = await dbQuery(
    `SELECT * FROM superadmin_user_plans WHERE user_id = ?`,
    [createdBy],
  );

  if (creatorSubscription.length === 0) {
    return null;
  }

  return createdBy;
};

const getPackageFoodWasteDetails = async (req, res) => {
  const { start_date, end_date, searchItem } = req.query;
  const userId = req.id;

  try {
    const createdBy = await getAuthorizedCreatedBy(userId);

    if (!createdBy) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view ingredient food waste records.",
      });
    }

    let query = `
      SELECT ingradient_food_waste.*, ingredients.ingredient_name, 
             IFNULL(user.firstname, '') || ' ' || IFNULL(user.lastname, '') AS Checkedby
      FROM ingradient_food_waste
      JOIN ingredients ON ingradient_food_waste.ingradient_id = ingredients.id
      JOIN user ON ingradient_food_waste.check_by = user.id
      WHERE ingradient_food_waste.createdby = ?
    `;

    const queryParams = [createdBy];

    if (start_date && end_date) {
      query += ` AND ingradient_food_waste.created_at BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    if (searchItem && searchItem.trim() !== "") {
      const searchValue = `%${searchItem.trim()}%`;

      query += `
        AND (
          ingradient_food_waste.id LIKE ?
          OR ingredients.ingredient_name LIKE ?
          OR user.firstname LIKE ?
          OR ingradient_food_waste.l_price LIKE ?
          OR user.lastname LIKE ?
          OR ingradient_food_waste.note LIKE ?
          OR ingradient_food_waste.qnty LIKE ?
          OR ingradient_food_waste.created_at LIKE ?
        )
      `;

      queryParams.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
      );
    }

    query += ` ORDER BY ingradient_food_waste.id DESC`;

    const results = await dbQuery(query, queryParams);

    return res.status(200).json({
      success: true,
      data: results,
      message:
        results.length === 0
          ? "No ingredient food waste records found"
          : "Ingredient food waste records fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching ingredient information in food waste:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const getTotalPrice = async (req, res) => {
  const { id } = req.params;
  const userId = req.id;

  try {
    const createdBy = await getAuthorizedCreatedBy(userId);

    if (!createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this data.",
      });
    }

    const query = `
      SELECT SUM(quantity) AS totalquantity,
             SUM(totalprice) AS totalprice
      FROM purchase_details
      WHERE indredientid = ?
      GROUP BY indredientid
    `;

    const result = await dbQuery(query, [id]);

    if (result.length === 0) {
      return res.status(404).send("Ingredient not found");
    }

    const { totalquantity, totalprice } = result[0];
    const pricePerIngredient = totalprice / totalquantity;

    const query2 = `SELECT stock_qty FROM ingredients WHERE id = ? AND created_by = ?`;
    const result1 = await dbQuery(query2, [id, createdBy]);

    if (result1.length === 0) {
      return res.status(404).send("Ingredient not found");
    }

    const total_stock = result1[0].stock_qty;

    return res.status(200).json({
      data: [{ Price: pricePerIngredient, Stock: total_stock }],
    });
  } catch (err) {
    console.error("Error fetching total quantity and price:", err);
    return res.status(500).send("Server error");
  }
};
// const insertingRdInformation = async (req, res) => {
//   const { userdetails, itemdetails } = req.body;
//   const { user } = userdetails[0];
//   const saveId = req.id;
//   const newDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

//   try {
//     // Start a database transaction
//     await dbQuery('START TRANSACTION');

//     for (let index = 0; index < itemdetails.length; index++) {
//       const { ingradientvalue: ingredientId, qnty, l_price, note, quantitystock } = itemdetails[index];

//       // Calculate the new stock quantity
//       const product_quantity = quantitystock - qnty;

//       const data1 = {
//         check_by: user,
//         ingradient_id: ingredientId,
//         qnty: product_quantity,
//         l_price: l_price,
//         note: note,
//         createdby: saveId,
//         created_at: newDate,
//       };

//       // Update stock quantity
//       const updateStockQuery = 'UPDATE ingredients SET stock_qty = stock_qty - ? WHERE id = ?';
//       await dbQuery(updateStockQuery, [product_quantity, ingredientId]);

//       // Insert food waste information
//       const insertWasteQuery = 'INSERT INTO ingradient_food_waste SET ?';
//       await dbQuery(insertWasteQuery, data1);
//     }

//     // Commit transaction
//     await dbQuery('COMMIT');

//     // Send success response
//     return res.status(200).send('Ingredient information inserted successfully');
//   } catch (err) {
//     // Rollback transaction in case of error
//     await dbQuery('ROLLBACK');
//     console.error('Error inserting ingredient information:', err);
//     return res.status(500).send('Server error');
//   }
// };

// const showItemsFoodWaste = async (req, res) => {
//   const { start_date, end_date, searchItem } = req.query; // Extract start_date, end_date, and searchItem from query parameters

//   // Base query
//   let query = `
//     SELECT items_food_waste.*,
//     items_food_waste.qnty,
//     items_food_waste.l_price,
//     items_food_waste.note,
//     items_food_waste.created_at,
//            item_foods.ProductName,
//            variant.variantName,
//            CONCAT_WS(' ', user.firstname, user.lastname) AS fullname
//     FROM items_food_waste
//     LEFT JOIN item_foods ON items_food_waste.itms_id = item_foods.ProductsID
//     LEFT JOIN variant ON items_food_waste.wvarientid = variant.variantid
//     LEFT JOIN user ON items_food_waste.check_by = user.id
//   `;

//   let queryParams = [];
//   let whereConditions = [];

//   // Date filtering condition (if start_date and end_date are provided)
//   if (start_date && end_date) {
//     whereConditions.push(`items_food_waste.created_at BETWEEN ? AND ?`);
//     queryParams.push(start_date, end_date);
//   }

//   // Search filtering condition for all relevant columns (ProductName, variantName, fullname)
//   if (searchItem) {
//     const searchValue = `%${searchItem}%`; // Wildcard for partial match
//     whereConditions.push(`
//       (item_foods.ProductName LIKE ?
//       OR variant.variantName LIKE ?
//       OR CONCAT_WS(' ', user.firstname, user.lastname) LIKE ?
//       OR  items_food_waste.qnty LIKE ?
//        OR  items_food_waste.l_price LIKE ?
//      OR items_food_waste.note LIKE ?
//     OR items_food_waste.created_at LIKE ?)
//     `);
//     queryParams.push(searchValue, searchValue,searchValue,searchValue,searchValue,searchValue, searchValue);
//   }

//   // If there are conditions, add them to the query
//   if (whereConditions.length > 0) {
//     query += ` WHERE ` + whereConditions.join(' AND ');
//   }

//   // Order by condition (optional)
//   query += ` ORDER BY items_food_waste.id DESC`;

//   try {
//     // Execute the SQL query with queryParams
//     const results = await dbQuery(query, queryParams);

//     // If no records found, send 404 response
//     if (results.length === 0) {
//       return res.status(404).send({ message: 'No food waste records found' });
//     }

//     // Send the result in response
//     res.status(200).json({data:results});
//   } catch (err) {
//     console.error('Error fetching food waste records:', err);
//     res.status(500).send('Server error');
//   }
// };

// price accours=din food name and variant

const insertingRdInformation = async (req, res) => {
  const { userdetails, itemdetails } = req.body;
  const saveId = req.id;

  if (!userdetails || userdetails.length === 0) {
    return res.status(400).json({
      success: false,
      message: "User details are missing.",
    });
  }

  if (!itemdetails || itemdetails.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Item details are missing.",
    });
  }

  const { user } = userdetails[0];
  const newDate = new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    const createdBy = await getAuthorizedCreatedBy(saveId);

    if (!createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to insert ingredient waste.",
      });
    }

    for (let index = 0; index < itemdetails.length; index++) {
      const {
        ingradientvalue: ingredientId,
        qnty,
        l_price,
        note,
        quantitystock,
      } = itemdetails[index];

      if (!ingredientId || !qnty || !l_price) {
        return res.status(400).json({
          success: false,
          message: "Ingredient, quantity and price are required.",
        });
      }

      const product_quantity = Number(quantitystock) - Number(qnty);

      const updateStockQuery = `
        UPDATE ingredients 
        SET stock_qty = stock_qty - ? 
        WHERE id = ? 
        AND created_by = ?
      `;

      await dbQuery(updateStockQuery, [qnty, ingredientId, createdBy]);

      const insertWasteQuery = `
        INSERT INTO ingradient_food_waste 
        (check_by, ingradient_id, qnty, l_price, note, createdby, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await dbQuery(insertWasteQuery, [
        user,
        ingredientId,
        product_quantity,
        l_price,
        note || "",
        createdBy,
        newDate,
      ]);
    }

    return res.status(200).json({
      success: true,
      message: "Ingredient information inserted successfully",
    });
  } catch (err) {
    console.error("Error inserting ingredient information:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const showItemsFoodWaste = async (req, res) => {
  const { start_date, end_date, searchItem } = req.query;
  const userId = req.id;

  try {
    const createdBy = await getAuthorizedCreatedBy(userId);

    if (!createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view food waste records.",
      });
    }

    let query = `
      SELECT items_food_waste.*, 
             items_food_waste.qnty,
             items_food_waste.l_price,
             items_food_waste.note,
             items_food_waste.created_at,
             item_foods.ProductName, 
             variant.variantName, 
             user.firstname || ' ' || user.lastname AS fullname
      FROM items_food_waste
      LEFT JOIN item_foods ON items_food_waste.itms_id = item_foods.ProductsID
      LEFT JOIN variant ON items_food_waste.wvarientid = variant.variantid
      LEFT JOIN user ON items_food_waste.check_by = user.id
      WHERE items_food_waste.createdby = ?
    `;

    const queryParams = [createdBy];

    if (start_date && end_date) {
      query += ` AND items_food_waste.created_at BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    if (searchItem && searchItem.trim() !== "") {
      const searchValue = `%${searchItem.trim()}%`;

      query += `
        AND (
          item_foods.ProductName LIKE ? 
          OR variant.variantName LIKE ?
          OR (user.firstname || ' ' || user.lastname) LIKE ?
          OR items_food_waste.qnty LIKE ?
          OR items_food_waste.l_price LIKE ?
          OR items_food_waste.note LIKE ?
          OR items_food_waste.created_at LIKE ?
        )
      `;

      queryParams.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
      );
    }

    query += ` ORDER BY items_food_waste.id DESC`;

    const results = await dbQuery(query, queryParams);

    return res.status(200).json({
      success: true,
      data: results,
      message:
        results.length === 0
          ? "No food waste records found"
          : "Food waste records fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching food waste records:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// const getalldetailsProductiondetails = async (req, res) => {
//   const { foodid, pvarientid } = req.query;

//   try {
//     // Step 1: Fetch foodid and pvarientid from production_details
//     let foodVariantQuery = `
//       SELECT foodid, pvarientid, ingredientid, qty AS productionqty
//       FROM production_details
//       WHERE foodid = ? AND pvarientid = ?
//     `;

//     const productionDetails = await dbQuery(foodVariantQuery, [foodid, pvarientid]);

//     if (!productionDetails || productionDetails.length === 0) {
//       return res.status(404).send({ message: 'No production details found' });
//     }

//     // Step 2: Extract ingredient IDs and fetch purchase details for each ingredient
//     const ingredientIds = productionDetails.map(item => item.ingredientid);

//     const purchaseQuery = `
//       SELECT pd.indredientid, SUM(pd.quantity) AS total_quantity, SUM(pd.totalprice) AS total_price
//       FROM purchase_details pd
//       WHERE pd.indredientid IN (?)
//       GROUP BY pd.indredientid
//     `;
//     const purchaseDetails = await dbQuery(purchaseQuery, [ingredientIds]);
//     console.log(purchaseDetails,"indredientid")

//     if (!purchaseDetails || purchaseDetails.length === 0) {
//       return res.status(404).send({ message: 'No purchase details found for the ingredient(s)' });
//     }

//     // Step 3: Fetch food names, variant names, and ingredient names
//     const foodIds = [...new Set(productionDetails.map(item => item.foodid))];
//     const variantIds = [...new Set(productionDetails.map(item => item.pvarientid))];

//     const foodNameQuery = `
//       SELECT items.ProductName AS foodName, items.ProductsID
//       FROM item_foods items
//       WHERE items.ProductsID IN (?)
//     `;
//     const foodNameResults = await dbQuery(foodNameQuery, [foodIds]);

//     const variantNameQuery = `
//       SELECT v.variantName, v.variantid
//       FROM variant v
//       WHERE v.variantid IN (?)
//     `;
//     const variantNameResults = await dbQuery(variantNameQuery, [variantIds]);

//     const ingredientNameQuery = `
//       SELECT id, ingredient_name
//       FROM ingredients
//       WHERE id IN (?)
//     `;
//     const ingredientNames = await dbQuery(ingredientNameQuery, [ingredientIds]);

//     // Step 4: Create lookups for food, variant, and ingredient names
//     const foodNameLookup = {};
//     foodNameResults.forEach(item => {
//       foodNameLookup[item.ProductsID] = item.foodName;
//     });

//     const variantNameLookup = {};
//     variantNameResults.forEach(item => {
//       variantNameLookup[item.variantid] = item.variantName;
//     });

//     const ingredientNameLookup = {};
//     ingredientNames.forEach(item => {
//       ingredientNameLookup[item.id] = item.ingredient_name;
//     });

//     // Step 5: Merge production details with purchase details and group by foodid and pvarientid
//     const result = {};

//     productionDetails.forEach(detail => {

//       const ingredientPurchaseDetail = purchaseDetails.find(purchase => purchase.indredientid === detail.ingredientid);

//       console.log(ingredientPurchaseDetail,"ingredientpurchasedetaiol")
//       const pricePerUnit = ingredientPurchaseDetail ? (ingredientPurchaseDetail.total_price / ingredientPurchaseDetail.total_quantity) : 0;
//       const productionPrice = pricePerUnit * detail.productionqty;

//       const key = `${detail.foodid}-${detail.pvarientid}`;
//       if (!result[key]) {
//         result[key] = {
//           foodid: detail.foodid,
//           pvarientid: detail.pvarientid,
//           totalAmount: 0,
//           foodName: foodNameLookup[detail.foodid] || 'Unknown',
//           variantName: variantNameLookup[detail.pvarientid] || 'Unknown'
//         };
//       }

//       result[key].totalAmount += productionPrice;
//     });

//     // Step 6: Send filtered results
//     const filteredResults = Object.values(result);

//     res.status(200).send({ data: filteredResults });
//   } catch (error) {
//     console.error("Error fetching production details:", error);
//     res.status(500).send({ message: 'Server Error', error });
//   }
// };
// post maing food waste

const getalldetailsProductiondetails = async (req, res) => {
  const { foodid, pvarientid } = req.query;
  const userId = req.id;

  try {
    const createdBy = await getAuthorizedCreatedBy(userId);

    if (!createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access production details.",
      });
    }

    // Step 1: Fetch production details
    let foodVariantQuery = `
        SELECT foodid, pvarientid, ingredientid, qty AS productionqty
        FROM production_details
        WHERE foodid = ? AND pvarientid = ? AND createdby = ?
      `;

    const productionDetails = await dbQuery(foodVariantQuery, [
      foodid,
      pvarientid,
      createdBy,
    ]);

    if (!productionDetails || productionDetails.length === 0) {
      return res.status(404).send({ message: "No production details found" });
    }

    const ingredientIds = productionDetails.map((item) => item.ingredientid);
    if (ingredientIds.length === 0) {
      return res.status(404).send({ message: "No ingredient IDs found" });
    }

    const placeholders = ingredientIds.map(() => "?").join(",");

    // Step 2: Fetch purchase details
    const purchaseQuery = `
        SELECT pd.indredientid, SUM(pd.quantity) AS total_quantity, SUM(pd.totalprice) AS total_price
        FROM purchase_details pd
        WHERE pd.indredientid IN (${placeholders})
        GROUP BY pd.indredientid
      `;
    const purchaseDetails = await dbQuery(purchaseQuery, ingredientIds);

    if (!purchaseDetails || purchaseDetails.length === 0) {
      return res
        .status(404)
        .send({ message: "No purchase details found for the ingredient(s)" });
    }

    // Step 3: Fetch names
    const foodIds = [...new Set(productionDetails.map((item) => item.foodid))];
    const variantIds = [
      ...new Set(productionDetails.map((item) => item.pvarientid)),
    ];

    const foodPlaceholders = foodIds.map(() => "?").join(",");
    const foodNameQuery = `
        SELECT items.ProductName AS foodName, items.ProductsID 
        FROM item_foods items 
        WHERE items.ProductsID IN (${foodPlaceholders})
      `;
    const foodNameResults = await dbQuery(foodNameQuery, foodIds);

    const variantPlaceholders = variantIds.map(() => "?").join(",");
    const variantNameQuery = `
        SELECT v.variantName, v.variantid 
        FROM variant v 
        WHERE v.variantid IN (${variantPlaceholders})
      `;
    const variantNameResults = await dbQuery(variantNameQuery, variantIds);

    const ingredientNameQuery = `
        SELECT id, ingredient_name 
        FROM ingredients 
        WHERE id IN (${placeholders})
      `;
    const ingredientNames = await dbQuery(ingredientNameQuery, ingredientIds);

    // Step 4: Lookups
    const foodNameLookup = {};
    foodNameResults.forEach((item) => {
      foodNameLookup[item.ProductsID] = item.foodName;
    });

    const variantNameLookup = {};
    variantNameResults.forEach((item) => {
      variantNameLookup[item.variantid] = item.variantName;
    });

    const ingredientNameLookup = {};
    ingredientNames.forEach((item) => {
      ingredientNameLookup[item.id] = item.ingredient_name;
    });

    // Step 5: Merge & group
    const result = {};
    productionDetails.forEach((detail) => {
      const ingredientPurchaseDetail = purchaseDetails.find(
        (purchase) => purchase.indredientid === detail.ingredientid,
      );
      const pricePerUnit = ingredientPurchaseDetail
        ? ingredientPurchaseDetail.total_price /
          ingredientPurchaseDetail.total_quantity
        : 0;
      const productionPrice = pricePerUnit * detail.productionqty;

      const key = `${detail.foodid}-${detail.pvarientid}`;
      if (!result[key]) {
        result[key] = {
          foodid: detail.foodid,
          pvarientid: detail.pvarientid,
          totalAmount: 0,
          foodName: foodNameLookup[detail.foodid] || "Unknown",
          variantName: variantNameLookup[detail.pvarientid] || "Unknown",
        };
      }

      result[key].totalAmount += productionPrice;
    });

    // Step 6: Return result
    const filteredResults = Object.values(result);
    res.status(200).send({ data: filteredResults });
  } catch (error) {
    console.error("Error fetching production details:", error);
    res.status(500).send({ message: "Server Error", error });
  }
};

// const insertFoodInformation = async (req, res) => {
//   const { userdetails, itemdetails } = req.body;
//   const { user } = userdetails[0]; // Assuming userdetails[0] has the user property

//   const saveid = req.id; // Assuming session is managed in req.session
//   const newDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format date as 'YYYY-MM-DD HH:mm:ss'

//   try {
//     for (let index = 0; index < itemdetails.length; index++) {
//       const { itms_id, wvarientid, qnty, l_price, note } = itemdetails[index];

//       // Construct the data to be inserted
//       const data1 = {
//         check_by: user,             // From userdetails
//         itms_id: itms_id,           // Product ID from itemdetails
//         wvarientid: wvarientid,     // Variant ID from itemdetails
//         qnty: qnty,                 // Quantity from itemdetails
//         l_price: l_price,           // Lost price from itemdetails
//         note: note,                 // Note from itemdetails
//         createdby: saveid,          // Assuming session ID or creator ID
//         created_at: newDate         // Timestamp
//       };

//       // Insert data into the 'items_food_waste' table
//       const insertWasteQuery = `INSERT INTO items_food_waste SET ?`;
//       await dbQuery(insertWasteQuery, data1);

//     }

//     return res.status(200).send('Food information inserted successfully');
//   } catch (err) {
//     console.error('Error processing request:', err);
//     return res.status(500).send('Server error');
//   }
// };

const insertFoodInformation = async (req, res) => {
  const { userdetails, itemdetails } = req.body;
  const saveid = req.id;
  const newDate = new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    if (!userdetails || !Array.isArray(userdetails) || userdetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User details are missing.",
      });
    }

    if (!itemdetails || !Array.isArray(itemdetails) || itemdetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Item details are missing.",
      });
    }

    const { user } = userdetails[0];

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Check by user is required.",
      });
    }

    const createdBy = await getAuthorizedCreatedBy(saveid);

    if (!createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to insert food waste.",
      });
    }

    for (let index = 0; index < itemdetails.length; index++) {
      const { itms_id, wvarientid, qnty, l_price, note } = itemdetails[index];

      if (!itms_id || !qnty || !l_price) {
        return res.status(400).json({
          success: false,
          message: "Item, quantity and price are required.",
        });
      }

      const insertWasteQuery = `
        INSERT INTO items_food_waste (
          check_by, 
          itms_id, 
          wvarientid, 
          qnty, 
          l_price, 
          note, 
          createdby, 
          created_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        user,
        itms_id,
        wvarientid || null,
        qnty,
        l_price,
        note || "",
        createdBy,
        newDate,
      ];

      await dbQuery(insertWasteQuery, values);
    }

    return res.status(200).json({
      success: true,
      message: "Food information inserted successfully",
    });
  } catch (err) {
    console.error("Error processing request:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
module.exports = {
  getPackagingWasteDetails,
  insertPackageInformation,
  getPackageFoodWasteDetails,
  getTotalPrice,
  insertingRdInformation,
  showItemsFoodWaste,
  getalldetailsProductiondetails,
  insertFoodInformation,
};
