const db = require("../utils/db");

// Helper function to execute queries with a promise
// function queryDb(query, params) {
//   return new Promise((resolve, reject) => {
//     db.all(query, params, (error, results) => {
//       if (error) {
//         return reject(error);
//       }
//       resolve(results);
//     });
//   });
// }

// const dbQuery = (sql, params) => {
//   return new Promise((resolve, reject) => {
//     db.all(sql, params, (err, results) => {
//       if (err) {
//         return reject(err);
//       }
//       resolve(results);
//     });
//   });
// };

// const getalldetailsProductiondetails = async (req, res) => {
//   try {
//     const { searchItem } = req.query; // Get searchItem from query parameters
//     console.log(searchItem);

//     // Step 1: Fetch foodid and pvarientid from production_details
//     let foodVariantQuery = `
//       SELECT foodid, pvarientid, ingredientid, qty AS productionqty,pro_detailsid
//       FROM production_details
//     `;

//     let queryParams = []; // Array to hold query parameters for the SQL query

//     // Adding search condition if searchItem is provided
//     if (searchItem) {
//       const searchValue = `%${searchItem}%`; // Wildcard for partial match
//       foodVariantQuery += `
//         WHERE foodid IN (
//           SELECT ProductsID FROM item_foods WHERE ProductName LIKE ?
//         )
//         OR pvarientid IN (
//           SELECT variantid FROM variant WHERE variantName LIKE ?
//         )
//       `;
//       // Push the search values to the queryParams array
//       queryParams.push(searchValue, searchValue);
//     }
//     foodVariantQuery += " ORDER BY pro_detailsid DESC";
//     const productionDetails = await queryDb(foodVariantQuery, queryParams);

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
//     const purchaseDetails = await queryDb(purchaseQuery, [ingredientIds]);

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
//     const foodNameResults = await queryDb(foodNameQuery, [foodIds]);

//     const variantNameQuery = `
//       SELECT v.variantName, v.variantid
//       FROM variant v
//       WHERE v.variantid IN (?)
//     `;
//     const variantNameResults = await queryDb(variantNameQuery, [variantIds]);

//     const ingredientNameQuery = `
//       SELECT id, ingredient_name
//       FROM ingredients
//       WHERE id IN (?)
//     `;
//     const ingredientNames = await queryDb(ingredientNameQuery, [ingredientIds]);

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

//     // Step 6: Filter results based on searchItem for totalAmount
//     let filteredResults = Object.values(result);
//     if (searchItem) {
//       filteredResults = filteredResults.filter(item =>
//         item.foodName.toLowerCase().includes(searchItem.toLowerCase()) ||
//         item.variantName.toLowerCase().includes(searchItem.toLowerCase()) ||
//         item.totalAmount.toString().includes(searchItem)
//       );
//     }

//     res.status(200).send({ data: filteredResults });
//   } catch (error) {
//     console.error("Error fetching production details:", error);
//     res.status(500).send({ message: 'Server Error', error });
//   }
// };

function queryDb(query, params) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
}

const resolveCreatorId = async (userId) => {
  const [row] = await queryDb("SELECT is_admin, created_by FROM user WHERE id = ?", [userId]);
  if (!row) return null;
  return Number(row.is_admin) === 1 ? Number(userId) : Number(row.created_by);
};

const getalldetailsProductiondetails = async (req, res) => {
  try {
    const { searchItem } = req.query;
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized user" });
    }

    const userData = await queryDb(
      `SELECT is_admin, created_by FROM user WHERE id = ?`,
      [userId]
    );

    if (!userData || userData.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { is_admin, created_by } = userData[0];
    const creatorId = is_admin === 1 ? userId : created_by;

    if (!creatorId) {
      return res.status(403).json({ success: false, message: "Unauthorized to view production details" });
    }

    let query = `
      SELECT
        pd.foodid,
        pd.pvarientid,
        pd.pro_detailsid,
        f.ProductName AS foodName,
        COALESCE(v.variantName, 'No Variant') AS variantName,
        COALESCE(v.price, 0) AS totalAmount
      FROM production_details pd
      LEFT JOIN item_foods f ON f.ProductsID = pd.foodid
      LEFT JOIN variant v ON v.variantid = pd.pvarientid
      WHERE pd.createdby = ?
    `;
    const params = [creatorId];

    if (searchItem && searchItem.trim() !== "") {
      const s = `%${searchItem.trim()}%`;
      query += ` AND (f.ProductName LIKE ? OR v.variantName LIKE ?)`;
      params.push(s, s);
    }

    query += ` GROUP BY pd.foodid, pd.pvarientid ORDER BY pd.pro_detailsid DESC`;

    const rows = await queryDb(query, params);

    return res.status(200).json({
      success: true,
      data: rows || [],
      message: "Production details fetched successfully",
    });
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// const foodNameFetchApi = async (req, res) => {

//   // Corrected SQL query
//   const sql = `
//     SELECT ProductName,ProductsID
//     FROM item_foods WHERE item_foods.ProductsIsActive=1;

//   `;

//   try {
//     // Await the dbQuery function result
//     const result = await dbQuery(sql);

//     // Return the result as JSON response
//     return res.status(200).json({ success: true, data: result });

//   } catch (err) {
//     console.error('Error in foodNAME:', err);
//     return res.status(500).json({ success: false, message: 'An internal error occurred' });
//   }
// };
// variant name accourding to food
const foodNameFetchApi = async (req, res) => {
  try {
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // Step 1: Get logged-in user role and creator
    const userQuery = `
      SELECT is_admin, created_by 
      FROM user 
      WHERE id = ?
    `;

    db.get(userQuery, [userId], async (err, userData) => {
      if (err) {
        console.error("User fetch error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error while fetching user info",
          error: err.message,
        });
      }

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const { is_admin, created_by } = userData;

      // Admin/subscription owner => own id
      // Staff/user => creator id
      const creatorId = is_admin === 1 ? userId : created_by;

      if (!creatorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to view foods",
        });
      }

      const sql = `
  SELECT
    ProductName,
    ProductsID
  FROM item_foods
  WHERE ProductsIsActive = 1
  AND UserIDInserted = ?
  ORDER BY ProductsID DESC
`;

      try {
        const result = await queryDb(sql, [creatorId]);

        return res.status(200).json({
          success: true,
          data: result || [],
          message: "Food names fetched successfully",
        });
      } catch (err) {
        console.error("Error in foodNameFetchApi:", err);
        return res.status(500).json({
          success: false,
          message: "An internal error occurred",
          error: err.message,
        });
      }
    });
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred on the server",
      error: error.message,
    });
  }
};

// const foodWithVariant = async (req, res) => {
//   const { foodid } = req.query;
//   console.log(foodid);

//   // Corrected SQL query
//   const sql = `
//     SELECT v.variantname, i.ProductName,variantid
//     FROM variant v
//     LEFT JOIN item_foods i ON i.ProductsID = v.menuid
//     WHERE  i.ProductsID = ?
//   `;

//   try {
//     // Await the dbQuery function result
//     const result = await dbQuery(sql, [foodid]);

//     // Return the result as JSON response
//     return res.status(200).json({ success: true, data: result });

//   } catch (err) {
//     console.error('Error in foodWithVariant:', err);
//     return res.status(500).json({ success: false, message: 'An internal error occurred' });
//   }
// };

const foodWithVariant = async (req, res) => {
  const { foodid } = req.query;
  const userId = req.id;

  const sql = `
    SELECT v.variantname, i.ProductName, v.variantid
    FROM variant v
    LEFT JOIN item_foods i ON i.ProductsID = v.menuid
    WHERE i.ProductsID = ? AND i.UserIDInserted = ?
  `;

  try {
    const creatorId = await resolveCreatorId(userId);
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });
    const result = await queryDb(sql, [foodid, creatorId]);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Error in foodWithVariant:", err);
    return res
      .status(500)
      .json({ success: false, message: "An internal error occurred" });
  }
};

// const createProduction = async (req, res) => {
//   const { itemid, itemvid, itemquantity, saveddate, productionexpiredate } = req.body;
//  const savedby=req.id;
//   try {
//     // Step 1: Get ingredient quantities per unit for the item and variant
//     const ingredientQuery = `
//       SELECT ingredientid, qty AS ingredient_quantity_per_unit
//       FROM production_details
//       WHERE foodid = ? AND pvarientid = ?`;
//     const ingredientResults = await dbQuery(ingredientQuery, [itemid, itemvid]);

//     if (!ingredientResults || ingredientResults.length === 0) {
//       return res.status(404).json({ message: 'Please set Ingredients first!' });
//     }

//     // Step 2: Iterate over ingredients and calculate the new stock based on units served
//     for (const ingredient of ingredientResults) {
//       const ingredientId = ingredient.ingredientid;
//       const qtyPerUnit = ingredient.ingredient_quantity_per_unit; // qty required per unit for this ingredient

//       // Get the current stock of the ingredient
//       const stockQuery = 'SELECT stock_qty FROM ingredients WHERE id = ?';
//       const [stockResult] = await dbQuery(stockQuery, [ingredientId]);

//       if (!stockResult) {
//         return res.status(404).json({ message: `Ingredient with ID ${ingredientId} not found!` });
//       }

//       const stockQty = stockResult.stock_qty;

//       // Calculate the total quantity to deduct based on the units served
//       const totalQtyToDeduct = itemquantity * qtyPerUnit;

//       // Check if stock is sufficient for this ingredient
//       if (totalQtyToDeduct > stockQty) {
//         return res.status(400).json({ message: `Insufficient stock for ingredient ID ${ingredientId}. Stock available: ${stockQty}kg, required: ${totalQtyToDeduct}kg` });
//       }

//       // Deduct the quantity from the stock
//       const newStockQty = stockQty - totalQtyToDeduct;
//       const updateStockQuery = 'UPDATE ingredients SET stock_qty = ? WHERE id = ?';
//       await dbQuery(updateStockQuery, [newStockQty, ingredientId]);
//     }

//     // Step 3: Update or insert the production record
//     const checkProductionQuery = 'SELECT itemquantity FROM production WHERE itemid = ? AND itemvid = ?';
//     const [productionResult] = await dbQuery(checkProductionQuery, [itemid, itemvid]);

//     if (productionResult) {
//       // Update existing production record
//       const existingQuantity = productionResult.itemquantity;
//       const newQuantity = existingQuantity + itemquantity;

//       const updateProductionQuery = `
//         UPDATE production
//         SET itemquantity = ?, savedby = ?, saveddate = ?, productionexpiredate = ?
//         WHERE itemid = ? AND itemvid = ?`;
//       await dbQuery(updateProductionQuery, [newQuantity, savedby, saveddate, productionexpiredate, itemid, itemvid]);

//       return res.status(200).json({ success: true, message: 'Production entry updated successfully' });
//     } else {
//       // Insert new production record
//       const insertProductionQuery = `
//         INSERT INTO production (itemid, itemvid, itemquantity, savedby, saveddate, productionexpiredate)
//         VALUES (?, ?, ?, ?, ?, ?)`;
//       const result = await dbQuery(insertProductionQuery, [itemid, itemvid, itemquantity, savedby, saveddate, productionexpiredate]);

//       return res.status(201).json({ success: true, message: 'Production entry created successfully', productionid: result.insertId });
//     }
//   } catch (err) {
//     console.error('Error in createProduction:', err);
//     return res.status(500).json({ success: false, message: 'An error occurred during production creation' });
//   }
// };
// get supplier leddger

const createProduction = async (req, res) => {
  const { itemid, itemvid, itemquantity, saveddate, productionexpiredate } =
    req.body;

  const user_id = req.id;
  const savedby = req.id;

  try {
    // Step 1: Check if logged-in user has subscription
    const [userPlan] = await queryDb(
      "SELECT * FROM superadmin_user_plans WHERE user_id = ?",
      [user_id],
    );

    let created_by = user_id;

    if (!userPlan) {
      // Step 2: If user has no plan, check who created this user
      const [userRecord] = await queryDb(
        "SELECT created_by FROM user WHERE id = ?",
        [user_id],
      );

      if (!userRecord || !userRecord.created_by) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to create production (no subscription).",
        });
      }

      created_by = userRecord.created_by;

      // Step 3: Check creator subscription
      const [creatorPlan] = await queryDb(
        "SELECT * FROM superadmin_user_plans WHERE user_id = ?",
        [created_by],
      );

      if (!creatorPlan) {
        return res.status(403).json({
          success: false,
          message: "Creator does not have an active subscription.",
        });
      }
    }

    // Step 4: Get ingredient quantities per unit
    const ingredientQuery = `
      SELECT ingredientid, qty AS ingredient_quantity_per_unit
      FROM production_details
      WHERE foodid = ? AND pvarientid = ?`;

    const ingredientResults = await queryDb(ingredientQuery, [itemid, itemvid]);

    if (!ingredientResults || ingredientResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Please set Ingredients first!",
      });
    }

    // Step 5: Check and deduct ingredient stock
    for (const ingredient of ingredientResults) {
      const ingredientId = ingredient.ingredientid;
      const qtyPerUnit = Number(ingredient.ingredient_quantity_per_unit);
      const productionQty = Number(itemquantity);

      const stockQuery = "SELECT stock_qty FROM ingredients WHERE id = ?";
      const [stockResult] = await queryDb(stockQuery, [ingredientId]);

      if (!stockResult) {
        return res.status(404).json({
          success: false,
          message: `Ingredient with ID ${ingredientId} not found!`,
        });
      }

      const stockQty = Number(stockResult.stock_qty);
      const totalQtyToDeduct = productionQty * qtyPerUnit;

      if (totalQtyToDeduct > stockQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ingredient ID ${ingredientId}. Stock available: ${stockQty}kg, required: ${totalQtyToDeduct}kg`,
        });
      }

      const newStockQty = stockQty - totalQtyToDeduct;

      await queryDb("UPDATE ingredients SET stock_qty = ? WHERE id = ?", [
        newStockQty,
        ingredientId,
      ]);
    }

    // Step 6: Update or insert production record
    const checkProductionQuery =
      "SELECT itemquantity FROM production WHERE itemid = ? AND itemvid = ?";

    const [productionResult] = await queryDb(checkProductionQuery, [
      itemid,
      itemvid,
    ]);

    if (productionResult) {
      const existingQuantity = Number(productionResult.itemquantity);
      const newQuantity = existingQuantity + Number(itemquantity);

      const updateProductionQuery = `
        UPDATE production
        SET itemquantity = ?, savedby = ?, saveddate = ?, productionexpiredate = ?
        WHERE itemid = ? AND itemvid = ?`;

      await queryDb(updateProductionQuery, [
        newQuantity,
        savedby,
        saveddate,
        productionexpiredate,
        itemid,
        itemvid,
      ]);

      return res.status(200).json({
        success: true,
        message: "Production entry updated successfully",
      });
    }

    const insertProductionQuery = `
      INSERT INTO production 
      (itemid, itemvid, itemquantity, savedby, saveddate, productionexpiredate)
      VALUES (?, ?, ?, ?, ?, ?)`;

    const result = await queryDb(insertProductionQuery, [
      itemid,
      itemvid,
      itemquantity,
      savedby,
      saveddate,
      productionexpiredate,
    ]);

    return res.status(201).json({
      success: true,
      message: "Production entry created successfully",
      productionid: result.lastID,
    });
  } catch (err) {
    console.error("Error in createProduction:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred during production creation",
    });
  }
};

// const getPurchaseTransactions = (req, res) => {
//   const { startDate, endDate, supplier_id } = req.query;

//   // Base query
//   let query = `
//     SELECT
//       p.suplierID,
//       p.total_price AS credit,
//       p.paid_amount AS debit,
//       p.purchasedate AS purchase_date,
//       p.details AS description,
//       s.amount AS ledger_amount,
//       s.d_c,
//       p.invoiceid

//     FROM purchaseitem p
//     LEFT JOIN supplier_ledger s
//       ON p.suplierID = s.supplier_id
//     WHERE 1 = 1
//   `;

//   // Array to hold the query parameters
//   const queryParams = [];

//   // Conditionally add supplier_id filter if provided
//   if (supplier_id) {
//     query += " AND p.suplierID = ?";
//     queryParams.push(supplier_id);
//   }

//   // Conditionally add date range filter if startDate and endDate are provided
//   if (startDate && endDate) {
//     query += " AND p.purchasedate BETWEEN ? AND ?";
//     queryParams.push(startDate, endDate);
//   }

//   // Execute the query with the parameters
//   db.pool.query(query, queryParams, (err, results) => {
//     if (err) {
//       console.error('Error fetching purchase transactions:', err);
//       res.status(500).json({ success: false, message: 'An error occurred while fetching purchase transactions' });
//     } else {
//       res.status(200).json({ success: true, data: results, message: 'Purchase transactions fetched successfully' });
//     }
//   });
// };

// set production unit //

const getPurchaseTransactions = async (req, res) => {
  const { startDate, endDate, supplier_id } = req.query;
  const userId = req.id;

  try {
    const creatorId = await resolveCreatorId(userId);
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });

    let query = `
      SELECT
        p.suplierID,
        p.total_price AS credit,
        p.paid_amount AS debit,
        p.purchasedate AS purchase_date,
        p.details AS description,
        s.amount AS ledger_amount,
        s.d_c,
        p.invoiceid
      FROM purchaseitem p
      LEFT JOIN supplier_ledger s
        ON p.suplierID = s.supplier_id
      WHERE p.savedby = ?
    `;

    const queryParams = [creatorId];

    if (supplier_id) {
      query += " AND p.suplierID = ?";
      queryParams.push(supplier_id);
    }

    if (startDate && endDate) {
      query += " AND p.purchasedate BETWEEN ? AND ?";
      queryParams.push(startDate, endDate);
    }

    const results = await queryDb(query, queryParams);
    res.status(200).json({
      success: true,
      data: results,
      message: "Purchase transactions fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching purchase transactions:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching purchase transactions",
    });
  }
};

const getAllStockIngredients = async (req, res) => {
  const userId = req.id;

  try {
    // Step 1: Get logged-in user info
    const userQuery = "SELECT is_admin, created_by FROM user WHERE id = ?";
    const [userResult] = await queryDb(userQuery, [userId]);

    if (!userResult) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const { is_admin, created_by } = userResult;

    // Step 2: If admin, use own id. Otherwise use creator id
    const creatorId = Number(is_admin) === 1 ? userId : created_by;

    if (!creatorId) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to view ingredients",
      });
    }

    // Step 3: Fetch active ingredients created by creator/admin
    const query = `
      SELECT ingredient_name, id
      FROM ingredients
      WHERE is_active = 1
        AND created_by = ?
    `;

    const results = await queryDb(query, [creatorId]);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error in getAllStockIngredients:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const getAllStockIngredientswithone = async (req, res) => {
  const userId = req.id;

  try {
    // Step 1: Get logged-in user info
    const userQuery = "SELECT is_admin, created_by FROM user WHERE id = ?";
    const [userResult] = await queryDb(userQuery, [userId]);

    if (!userResult) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const { is_admin, created_by } = userResult;

    // Step 2: If admin, use own id. Otherwise use creator id
    const creatorId = Number(is_admin) === 1 ? userId : created_by;

    if (!creatorId) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to view ingredients",
      });
    }

    // Step 3: Fetch active ingredients with stock > 0
    const query = `
      SELECT ingredient_name, id
      FROM ingredients
      WHERE is_active = 1
        AND stock_qty > 0
        AND created_by = ?
    `;

    const results = await queryDb(query, [creatorId]);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error in getAllStockIngredientswithone:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to retrieve ingredients due to a database error",
    });
  }
};

const getPerItemPrice = async (req, res) => {
  const { id } = req.params;
  const userId = req.id;

  const query = `
    SELECT SUM(quantity) AS totalquantity,
           SUM(totalprice) AS totalprice
    FROM purchase_details
    WHERE indredientid = ? AND purchaseby = ?
    GROUP BY indredientid
  `;

  try {
    const creatorId = await resolveCreatorId(userId);
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });
    const result = await queryDb(query, [id, creatorId]);

    // Check if the ingredient exists
    if (result.length === 0) {
      return res.status(404).send("Ingredient not found");
    }

    // Extract total quantity and price from the result
    const { totalquantity, totalprice } = result[0];
    const pricePerIngredient = totalprice / totalquantity; // Calculate price per ingredient

    // Return the result in a response
    return res.status(200).json({
      data: [{ Price: pricePerIngredient }],
    });
  } catch (err) {
    // Handle errors in the database query
    console.error("Error fetching total quantity and price:", err);
    return res.status(500).send("Server error");
  }
};

// function queryDb(query, params) {
//   return new Promise((resolve, reject) => {
//     db.all(query, params, (error, results) => {
//       if (error) {
//         return reject(error);
//       }
//       resolve(results);
//     });
//   });
// }

const createproductiondata = async (req, res) => {
  try {
    const fooddetails = req.body.fooddetails; // Array of food details
    const itemdetails = req.body.itemdetails; // Array of item details
    const newDate = new Date().toISOString();
    const user_id = req.id;

    // Step 1: Check user subscription
    const [userPlan] = await queryDb(
      "SELECT * FROM superadmin_user_plans WHERE user_id = ?",
      [user_id],
    );

    let createdby = user_id;

    if (!userPlan) {
      // Step 2: Check user creator
      const [userRecord] = await queryDb(
        "SELECT created_by FROM user WHERE id = ?",
        [user_id],
      );

      if (!userRecord || !userRecord.created_by) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to create production details (no subscription).",
        });
      }

      createdby = userRecord.created_by;

      // Step 3: Check creator subscription
      const [creatorPlan] = await queryDb(
        "SELECT * FROM superadmin_user_plans WHERE user_id = ?",
        [createdby],
      );

      if (!creatorPlan) {
        return res.status(403).json({
          success: false,
          message: "Creator does not have an active subscription.",
        });
      }
    }

    // Step 4: Validate fooddetails and itemdetails
    if (
      !fooddetails ||
      fooddetails.length === 0 ||
      !itemdetails ||
      itemdetails.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No food details or item details provided",
      });
    }

    // Step 5: Loop through food details
    for (let food of fooddetails) {
      const { foodid, pvarientid } = food;

      const checkQuery = `
        SELECT * FROM production_details 
        WHERE foodid = ? AND pvarientid = ?
      `;

      const existingRecords = await queryDb(checkQuery, [foodid, pvarientid]);

      if (existingRecords.length > 0) {
        const foodRow = await queryDb("SELECT ProductName FROM item_foods WHERE ProductsID = ?", [foodid]);
        const variantRow = await queryDb("SELECT variantName FROM variant WHERE variantid = ?", [pvarientid]);
        const foodName = foodRow[0]?.ProductName || `Food #${foodid}`;
        const variantName = variantRow[0]?.variantName || `Variant #${pvarientid}`;
        return res.status(400).json({
          success: false,
          message: `Production details for '${foodName} - ${variantName}' already exist. Please edit the existing record instead of creating a new one.`,
        });
      }

      // Step 6: Insert item details
      for (let item of itemdetails) {
        const { p_id, quantity } = item;

        if (!quantity || !p_id) {
          return res.status(400).json({
            success: false,
            message: "Invalid item details provided",
          });
        }

        await queryDb(
          `
          INSERT INTO production_details 
          (foodid, pvarientid, ingredientid, qty, created_date, createdby)
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [foodid, pvarientid, p_id, quantity, newDate, createdby],
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Successfully added production details",
    });
  } catch (err) {
    console.error("Error in createproductiondata:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const findbyIdProductiondetails = async (req, res) => {
  const { foodid, pvarientid } = req.params;
  const userId = req.id;

  try {
    const creatorId = await resolveCreatorId(userId);
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const sql = `
      SELECT p.foodid, p.pvarientid, p.ingredientid, p.qty AS productionqty
      FROM production_details p
      WHERE p.foodid = ? AND p.pvarientid = ? AND p.createdby = ?
    `;

    const productionDetails = await queryDb(sql, [foodid, pvarientid, creatorId]);

    if (!productionDetails || productionDetails.length === 0) {
      return res.status(404).send({ message: "No production details found" });
    }

    const ingredientIds = productionDetails.map((item) => item.ingredientid);

    // SQLite doesn't support `IN (?)` with an array directly; convert to placeholders
    const placeholders = ingredientIds.map(() => "?").join(", ");
    const sql2 = `
      SELECT pd.indredientid, SUM(pd.quantity) AS total_quantity, SUM(pd.totalprice) AS total_price
      FROM purchase_details pd
      WHERE pd.indredientid IN (${placeholders})
      GROUP BY pd.indredientid
    `;
    const purchaseDetails = await queryDb(sql2, ingredientIds);

    const foodNameQuery = await queryDb(
      "SELECT items.ProductName AS foodName FROM item_foods items WHERE items.ProductsID = ?",
      [foodid],
    );

    const variantNameQuery = await queryDb(
      "SELECT v.variantName FROM variant v WHERE v.variantid = ?",
      [pvarientid],
    );

    const ingredientNameFetchQuery = await queryDb(
      `SELECT id, ingredient_name FROM ingredients WHERE id IN (${placeholders})`,
      ingredientIds,
    );

    if (!purchaseDetails || purchaseDetails.length === 0) {
      return res
        .status(404)
        .send({ message: "No purchase details found for the ingredient(s)" });
    }

    const foodDetails = {
      foodName: foodNameQuery[0]?.foodName || "not found",
      variantName: variantNameQuery[0]?.variantName || "not found",
      foodid: foodid,
      pvarientid: pvarientid,
    };

    const itemDetails = purchaseDetails.map((detail) => {
      const productionDetail = productionDetails.find(
        (item) => item.ingredientid === detail.indredientid,
      );
      const ingredientName = ingredientNameFetchQuery.find(
        (item) => String(item.id) === String(detail.indredientid),
      );
      const ingredientNameValue = ingredientName
        ? ingredientName.ingredient_name
        : "Unknown Ingredient";

      const productionQty = productionDetail
        ? productionDetail.productionqty
        : 0;
      const pricePerUnit = detail.total_price / detail.total_quantity;
      const totalPriceForProduction = pricePerUnit * productionQty;

      return {
        ingredientid: detail.indredientid,
        productionDetailqty: productionQty,
        total_quantity: detail.total_quantity,
        total_price: detail.total_price,
        price: pricePerUnit,
        totalPriceofproductioningredient: totalPriceForProduction.toFixed(2),
        ingredient_name: ingredientNameValue,
      };
    });

    const response = {
      data: {
        fooddetails: [foodDetails],
        itemdetails: itemDetails,
      },
    };

    res.status(200).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error", error });
  }
};

const viewProductiondetails = async (req, res) => {
  const { foodid, pvarientid } = req.params;
  const userId = req.id;

  try {
    const creatorId = await resolveCreatorId(userId);
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const sql = `
        SELECT p.foodid, p.pvarientid, p.ingredientid, p.qty AS productionqty
        FROM production_details p
        WHERE p.foodid = ? AND p.pvarientid = ? AND p.createdby = ?
      `;

    const productionDetails = await queryDb(sql, [foodid, pvarientid, creatorId]);

    if (!productionDetails || productionDetails.length === 0) {
      return res.status(404).send({ message: "No production details found" });
    }

    const ingredientIds = productionDetails.map((item) => item.ingredientid);

    // NOTE: SQLite requires dynamic IN (?) to be manually formatted as placeholders.
    const placeholders = ingredientIds.map(() => "?").join(",");

    const sql2 = `
        SELECT pd.indredientid, SUM(pd.quantity) AS total_quantity, SUM(pd.totalprice) AS total_price
        FROM purchase_details pd
        WHERE pd.indredientid IN (${placeholders})
        GROUP BY pd.indredientid
      `;

    const purchaseDetails = await queryDb(sql2, ingredientIds);

    const foodNameQuery = await queryDb(
      "SELECT items.ProductName AS foodName FROM item_foods items WHERE items.ProductsID = ?",
      [foodid],
    );

    const variantNameQuery = await queryDb(
      "SELECT v.variantName FROM variant v WHERE v.variantid = ?",
      [pvarientid],
    );

    const ingredientNameFetchQuery = await queryDb(
      `SELECT id, ingredient_name FROM ingredients WHERE id IN (${placeholders})`,
      ingredientIds,
    );

    if (!purchaseDetails || purchaseDetails.length === 0) {
      return res
        .status(404)
        .send({ message: "No purchase details found for the ingredient(s)" });
    }

    const foodDetails = {
      foodName: foodNameQuery[0]?.foodName || "not found",
      variantName: variantNameQuery[0]?.variantName || "not found",
      foodid: foodid,
      pvarientid: pvarientid,
    };

    const itemDetails = purchaseDetails.map((detail) => {
      const productionDetail = productionDetails.find(
        (item) => item.ingredientid === detail.indredientid,
      );
      const ingredientName = ingredientNameFetchQuery.find(
        (item) => String(item.id) === String(detail.indredientid),
      );
      const ingredientNameValue = ingredientName
        ? ingredientName.ingredient_name
        : "Unknown Ingredient";

      const productionQty = productionDetail
        ? productionDetail.productionqty
        : 0;
      const pricePerUnit = detail.total_price / detail.total_quantity;
      const totalPriceForProduction = pricePerUnit * productionQty;

      return {
        ingredientid: detail.indredientid,
        productionDetailqty: productionQty,
        total_quantity: detail.total_quantity,
        total_price: detail.total_price,
        price: pricePerUnit,
        totalPriceofproductioningredient: totalPriceForProduction.toFixed(2),
        ingredient_name: ingredientNameValue,
      };
    });

    const totalPriceSum = itemDetails.reduce((sum, item) => {
      return sum + parseFloat(item.totalPriceofproductioningredient);
    }, 0);

    const response = {
      data: {
        fooddetails: [foodDetails],
        itemdetails: itemDetails,
        totalPriceSum,
      },
    };

    res.status(200).send({ data: response });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error", error });
  }
};

// const updateProductionDetail = async (req, res) => {
//   try {
//     const { foodnameid, pvarientnameid } = req.params;
//     console.log("Received foodid:", foodnameid, "pvarientid:", pvarientnameid);

//     const fooddetails = req.body.fooddetails;
//     const itemdetails = req.body.itemdetails;
//     const createdby = 178;
//     const created_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

//     if (!fooddetails || fooddetails.length === 0 || !itemdetails || itemdetails.length === 0) {
//       return res.status(400).json({ message: 'No food details or item details provided' });
//     }

//     // SQLite does not support START TRANSACTION/COMMIT/ROLLBACK directly in the same connection
//     await queryDb('BEGIN TRANSACTION');

//     for (let food of fooddetails) {
//       const { foodid, pvarientid } = food;

//       // Fetch existing records
//       const fetchCurrentDataSql = 'SELECT * FROM production_details WHERE foodid = ? AND pvarientid = ?';
//       const fetchData = await queryDb(fetchCurrentDataSql, [foodnameid, pvarientnameid]);

//       console.log("Fetched data for foodid:", foodnameid, "pvarientid:", pvarientnameid, fetchData);

//       if (fetchData.length === 0) {
//         return res.status(404).json({ success: false, message: 'Production detail record not found' });
//       }

//       // Delete existing records
//       const deleteQuery = 'DELETE FROM production_details WHERE foodid = ? AND pvarientid = ?';
//       await queryDb(deleteQuery, [foodid, pvarientid]);

//       // Insert new item details
//       for (let item of itemdetails) {
//         const { p_id, quantity } = item;

//         if (!quantity || !p_id) {
//           return res.status(400).json({ message: 'Invalid item details provided' });
//         }

//         const insertSql = `
//           INSERT INTO production_details (foodid, pvarientid, ingredientid, qty, createdby, created_date)
//           VALUES (?, ?, ?, ?, ?, ?)
//         `;

//         console.log("Inserting for p_id:", p_id, "with quantity:", quantity);

//         await queryDb(insertSql, [
//           foodid,
//           pvarientid,
//           p_id,
//           quantity,
//           createdby,
//           created_date
//         ]);
//       }
//     }

//     await queryDb('COMMIT');

//     return res.status(200).json({ success: true, message: 'Production details updated successfully' });
//   } catch (err) {
//     console.error('Error in updateProductionDetail:', err);

//     await queryDb('ROLLBACK');

//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };
const deleteProductionData = async (req, res) => {
  try {
    const { foodid, pvarientid } = req.params;
    const userId = req.id;

    if (!foodid || !pvarientid) {
      return res.status(400).json({ message: "Missing foodid or pvarientid" });
    }

    const creatorId = await resolveCreatorId(userId);
    if (!creatorId) return res.status(403).json({ message: "Unauthorized" });

    const checkQuery = `
      SELECT * FROM production_details
      WHERE foodid = ? AND pvarientid = ? AND createdby = ?
    `;
    const existingRecords = await queryDb(checkQuery, [foodid, pvarientid, creatorId]);

    if (existingRecords.length === 0) {
      return res.status(404).json({
        message: `No production records found for foodid ${foodid} and pvarientid ${pvarientid}`,
      });
    }

    const deleteQuery = `
      DELETE FROM production_details
      WHERE foodid = ? AND pvarientid = ? AND createdby = ?
    `;
    await queryDb(deleteQuery, [foodid, pvarientid, creatorId]);

    return res
      .status(200)
      .json({ message: "Production details deleted successfully" });
  } catch (err) {
    console.error("Error in deleteProductionData:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateProductionDetail = async (req, res) => {
  try {
    const { foodnameid, pvarientnameid } = req.params;

    const fooddetails = req.body.fooddetails;
    const itemdetails = req.body.itemdetails;
    const user_id = req.id;

    const created_date = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // Step 1: Check user subscription
    const [userPlan] = await queryDb(
      "SELECT * FROM superadmin_user_plans WHERE user_id = ?",
      [user_id],
    );

    let createdby = user_id;

    if (!userPlan) {
      // Step 2: Check user creator
      const [userRecord] = await queryDb(
        "SELECT created_by FROM user WHERE id = ?",
        [user_id],
      );

      if (!userRecord || !userRecord.created_by) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to update production details (no subscription).",
        });
      }

      createdby = userRecord.created_by;

      // Step 3: Check creator subscription
      const [creatorPlan] = await queryDb(
        "SELECT * FROM superadmin_user_plans WHERE user_id = ?",
        [createdby],
      );

      if (!creatorPlan) {
        return res.status(403).json({
          success: false,
          message: "Creator does not have an active subscription.",
        });
      }
    }

    // Step 4: Validate request body
    if (
      !fooddetails ||
      fooddetails.length === 0 ||
      !itemdetails ||
      itemdetails.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No food details or item details provided",
      });
    }

    // SQLite transaction
    await queryDb("BEGIN TRANSACTION");

    for (let food of fooddetails) {
      const { foodid, pvarientid } = food;

      // Step 5: Check existing production details
      const fetchCurrentDataSql = `
        SELECT * FROM production_details
        WHERE foodid = ? AND pvarientid = ?
      `;

      const fetchData = await queryDb(fetchCurrentDataSql, [
        foodnameid,
        pvarientnameid,
      ]);

      if (!fetchData || fetchData.length === 0) {
        await queryDb("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Production detail record not found",
        });
      }

      // Step 6: Delete old production details
      const deleteQuery = `
        DELETE FROM production_details
        WHERE foodid = ? AND pvarientid = ?
      `;

      await queryDb(deleteQuery, [foodnameid, pvarientnameid]);

      // Step 7: Insert new production details
      for (let item of itemdetails) {
        const { p_id, quantity } = item;

        if (!quantity || !p_id) {
          await queryDb("ROLLBACK");

          return res.status(400).json({
            success: false,
            message: "Invalid item details provided",
          });
        }

        const insertSql = `
          INSERT INTO production_details
          (foodid, pvarientid, ingredientid, qty, createdby, created_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        await queryDb(insertSql, [
          foodid,
          pvarientid,
          p_id,
          quantity,
          createdby,
          created_date,
        ]);
      }
    }

    await queryDb("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Production details updated successfully",
    });
  } catch (err) {
    console.error("Error in updateProductionDetail:", err);

    try {
      await queryDb("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getProductionDetails = async (req, res) => {
  const { searchItem } = req.query;
  const userId = req.id;

  try {
    const [userResult] = await queryDb(
      "SELECT is_admin, created_by FROM user WHERE id = ?",
      [userId],
    );

    if (!userResult) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const { is_admin, created_by } = userResult;

    let productionDetailsQuery = `
      SELECT
        f.ProductName AS food_name,
        f.ProductsID,
        p.itemquantity,
        v.variantName AS variant_name,
        p.saveddate,
        p.productionexpiredate,
        p.savedby
      FROM production p
      LEFT JOIN item_foods f ON p.itemid = f.ProductsID
      LEFT JOIN variant v ON p.itemvid = v.variantid
    `;

    const conditions = [];
    const params = [];

    if (Number(is_admin) === 1) {
      conditions.push("p.savedby = ?");
      params.push(userId);
    } else {
      if (!created_by) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to production details.",
        });
      }

      conditions.push("p.created_by = ?");
      params.push(created_by);
    }

    if (searchItem && searchItem.trim() !== "") {
      const search = `%${searchItem}%`;

      conditions.push(`
        (
          f.ProductName LIKE ?
          OR v.variantName LIKE ?
          OR p.saveddate LIKE ?
          OR p.productionexpiredate LIKE ?
        )
      `);

      params.push(search, search, search, search);
    }

    if (conditions.length > 0) {
      productionDetailsQuery += ` WHERE ${conditions.join(" AND ")}`;
    }

    productionDetailsQuery += ` ORDER BY p.productionid DESC`;

    const productionDetails = await queryDb(productionDetailsQuery, params);

    return res.status(200).json({
      success: true,
      data: productionDetails || [],
      message:
        productionDetails?.length > 0
          ? "Production details fetched successfully"
          : "No production details found",
    });
  } catch (err) {
    console.error("Error fetching production details:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching production details",
    });
  }
};

const importProductionSets = (req, res) => {
  const user_id = req.id;
  const rows = req.body.rows;

  if (!rows || !Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ success: false, message: "No data provided" });

  db.get("SELECT * FROM superadmin_user_plans WHERE user_id = ?", [user_id], (err, subscription) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (subscription) { processImport(user_id); }
    else {
      db.get("SELECT created_by FROM user WHERE id = ?", [user_id], (err, userData) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!userData || !userData.created_by)
          return res.status(403).json({ success: false, message: "Not authorized." });
        db.get("SELECT * FROM superadmin_user_plans WHERE user_id = ?", [userData.created_by], (err, creatorSub) => {
          if (err) return res.status(500).json({ success: false, message: err.message });
          if (!creatorSub) return res.status(403).json({ success: false, message: "Creator does not have an active subscription." });
          processImport(userData.created_by);
        });
      });
    }
  });

  function processImport(creator_id) {
    // Group rows by Food_Name + Variant_Name
    const groups = {};
    for (const row of rows) {
      const key = `${(row.Food_Name || "").trim()}|||${(row.Variant_Name || "").trim()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    const groupKeys = Object.keys(groups);
    let imported = 0, skipped = 0, gIndex = 0;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    function processNextGroup() {
      if (gIndex >= groupKeys.length) return res.json({ success: true, imported, skipped });
      const key = groupKeys[gIndex++];
      const groupRows = groups[key];
      const food_name = (groupRows[0].Food_Name || "").trim();
      const variant_name = (groupRows[0].Variant_Name || "").trim();

      if (!food_name || !variant_name) { skipped += groupRows.length; return processNextGroup(); }

      db.get("SELECT ProductsID FROM item_foods WHERE ProductName = ? AND UserIDInserted = ?", [food_name, creator_id], (err, food) => {
        if (err || !food) { skipped += groupRows.length; return processNextGroup(); }
        const foodid = food.ProductsID;

        db.get("SELECT variantid FROM variant WHERE variantName = ? AND menuid = ?", [variant_name, foodid], (err, variant) => {
          if (err || !variant) { skipped += groupRows.length; return processNextGroup(); }
          const pvarientid = variant.variantid;

          db.get("SELECT foodid FROM production_details WHERE foodid = ? AND pvarientid = ?", [foodid, pvarientid], (err, existing) => {
            if (err || existing) { skipped += groupRows.length; return processNextGroup(); }

            let rIndex = 0;
            function processNextRow() {
              if (rIndex >= groupRows.length) { imported++; return processNextGroup(); }
              const row = groupRows[rIndex++];
              const ingredient_name = (row.Ingredient_Name || "").trim();
              const qty = row.Quantity;

              if (!ingredient_name || !qty) { skipped++; return processNextRow(); }

              db.get("SELECT id FROM ingredients WHERE ingredient_name = ? AND created_by = ?", [ingredient_name, creator_id], (err, ing) => {
                if (err || !ing) { skipped++; return processNextRow(); }
                db.run(
                  "INSERT INTO production_details (foodid, pvarientid, ingredientid, qty, createdby, created_date) VALUES (?, ?, ?, ?, ?, ?)",
                  [foodid, pvarientid, ing.id, parseFloat(qty), creator_id, now],
                  function(err) {
                    if (err) { skipped++; return processNextRow(); }
                    processNextRow();
                  }
                );
              });
            }
            processNextRow();
          });
        });
      });
    }
    processNextGroup();
  }
};

module.exports = {
  getalldetailsProductiondetails,
  foodWithVariant,
  foodNameFetchApi,
  createProduction,
  getPurchaseTransactions,
  getAllStockIngredients,
  getPerItemPrice,
  createproductiondata,
  findbyIdProductiondetails,
  updateProductionDetail,
  getProductionDetails,
  getAllStockIngredientswithone,
  viewProductiondetails,
  deleteProductionData,
  importProductionSets,
};
