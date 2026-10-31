const db = require("../utils/db");
const fs = require("fs");
const path = require("path");

// const createItemFood = (req, res) => {
//   const {
//     CategoryID,
//     ProductName,
//     descrp,
//     productvat,
//     special,
//     isoffer,
//     offerstartdate,
//     offerenddate,
//     is_custom_quantity,
//     status,
//     menuid,
//     variant,
//     addons,
//   } = req.body;

//   const UserIDInserted = req.id || 1;
//   const ProductImage = req.file ? req.file.filename : null;

//   const BigThumb = ProductImage || "";
//   const MediumThumb = ProductImage || "";
//   const SmallThumb = ProductImage || "";

//   const isofferint = isoffer === "true" ? 1 : 0;
//   const is_custom_quantityint = is_custom_quantity === "true" ? 1 : 0;
//   const specialint = special === "true" ? 1 : 0;

//   const parsedVariant = JSON.parse(variant || "[]");
//   const parsedAddons = JSON.parse(addons || "[]");

//   // ✅ STEP 1: Fetch kitchen from category (LIKE LIVE SERVER)
//   db.get(
//     `SELECT kitchen_id FROM item_category WHERE CategoryID = ?`,
//     [CategoryID],
//     (err, row) => {
//       if (err) {
//         console.error("❌ Category fetch error:", err);
//         return res
//           .status(500)
//           .json({ error: "Failed to fetch category kitchen" });
//       }

//       const finalKitchenId = row?.kitchen_id;

//       console.log("🏠 Kitchen resolved from category:", finalKitchenId);

//       if (!finalKitchenId) {
//         return res.status(400).json({
//           message: "Kitchen not mapped to this category. Fix category first.",
//         });
//       }

//       // ✅ STEP 2: Insert item_foods with correct kitchenid
//       db.run(
//         `INSERT INTO item_foods
//         (CategoryID, UserIDInserted, kitchenid, ProductName, descrip, ProductImage,
//          bigthumb, medium_thumb, small_thumb, productvat, special, offerIsavailable,
//          offerstartdate, offerendate, is_customqty, ProductsIsActive, menutype)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           CategoryID,
//           UserIDInserted,
//           finalKitchenId, // ✅ auto assigned
//           ProductName,
//           descrp,
//           ProductImage,
//           BigThumb,
//           MediumThumb,
//           SmallThumb,
//           productvat,
//           specialint,
//           isofferint,
//           offerstartdate || "",
//           offerenddate || "",
//           is_custom_quantityint,
//           status,
//           menuid,
//         ],
//         function (err) {
//           if (err) {
//             console.error("❌ Insert error:", err);
//             return res
//               .status(500)
//               .json({ error: "Insert failed", details: err });
//           }

//           const insertedItemId = this.lastID;
//           console.log("✅ Product inserted:", insertedItemId);

//           // ---- Insert variants ----
//           const variantStmt = db.prepare(
//             `INSERT INTO variant (menuid, price, variantName) VALUES (?, ?, ?)`,
//           );

//           parsedVariant.forEach(({ price, variantName }) => {
//             variantStmt.run(insertedItemId, price, variantName);
//           });

//           variantStmt.finalize();

//           // ---- Insert addons ----
//           const addonStmt = db.prepare(
//             `INSERT INTO menu_add_on (menu_id, add_on_id, is_active) VALUES (?, ?, 1)`,
//           );

//           parsedAddons.forEach((addon_id) => {
//             addonStmt.run(insertedItemId, addon_id);
//           });

//           addonStmt.finalize();

//           res.status(201).json({
//             success: true,
//             message: "Product created with auto kitchen mapping (like live)",
//           });
//         },
//       );
//     },
//   );
// };

// const getAllItemFoodDetails = async (req, res) => {
//   const { searchItem } = req.query;

//   try {
//     let sql = `
//       SELECT
//         item_foods.*,
//         item_category.*,
//         tbl_kitchen.*,
//         tbl_menutype.*
//       FROM item_foods
//       LEFT JOIN item_category
//         ON item_foods.CategoryID = item_category.CategoryID
//       LEFT JOIN tbl_kitchen
//         ON CAST(item_foods.kitchenid AS INTEGER) = CAST(tbl_kitchen.kitchenid AS INTEGER)
//       LEFT JOIN tbl_menutype
//         ON item_foods.menutype = tbl_menutype.menutypeid
//       WHERE item_foods.ProductsIsActive = 1
//     `;

//     let params = [];

//     if (searchItem && searchItem.trim() !== "") {
//       sql += `
//         AND (
//           item_foods.ProductName LIKE ?
//           OR item_category.Name LIKE ?
//         )
//       `;
//       params.push(`%${searchItem}%`, `%${searchItem}%`);
//     }

//     sql += ` ORDER BY item_foods.ProductsID DESC`;

//     const products = await new Promise((resolve, reject) => {
//       db.all(sql, params, (err, rows) => {
//         if (err) {
//           console.error("Fetch error:", err);
//           reject(err);
//         } else {
//           resolve(rows || []);
//         }
//       });
//     });

//     if (!products.length) {
//       return res.status(200).json([]);
//     }

//     const productsWithDetails = await Promise.all(
//       products.map(async (product) => {
//         const variants = await new Promise((resolve, reject) => {
//           db.all(
//             "SELECT * FROM variant WHERE menuid = ?",
//             [product.ProductsID],
//             (err, rows) => {
//               if (err) reject(err);
//               else resolve(rows || []);
//             },
//           );
//         });

//         return {
//           ...product,
//           variants,
//         };
//       }),
//     );

//     res.status(200).json(productsWithDetails);
//   } catch (err) {
//     console.error("Error:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const createItemFood = (req, res) => {
  const {
    CategoryID,
    ProductName,
    descrp,
    productvat,
    special,
    isoffer,
    offerstartdate,
    offerenddate,
    is_custom_quantity,
    status,
    menuid,
    variant,
    addons,
  } = req.body;

  const UserIDInserted = req.id || 1;
  const ProductImage = req.file ? req.file.filename : null;

  const BigThumb = ProductImage || "";
  const MediumThumb = ProductImage || "";
  const SmallThumb = ProductImage || "";

  const isofferint = isoffer === "true" ? 1 : 0;
  const is_custom_quantityint = is_custom_quantity === "true" ? 1 : 0;
  const specialint = special === "true" ? 1 : 0;

  let parsedVariant = [];
  let parsedAddons = [];

  try {
    parsedVariant = JSON.parse(variant || "[]");
    parsedAddons = JSON.parse(addons || "[]");
  } catch (parseErr) {
    return res.status(400).json({
      success: false,
      message: "Invalid variant or addons JSON",
    });
  }

  // STEP 1: Fetch kitchen from category
  db.get(
    `SELECT kitchen_id FROM item_category WHERE CategoryID = ?`,
    [CategoryID],
    (err, row) => {
      if (err) {
        console.error("❌ Category fetch error:", err);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch category kitchen",
        });
      }

      const finalKitchenId = row?.kitchen_id;

      console.log("🏠 Kitchen resolved from category:", finalKitchenId);

      if (
        finalKitchenId === undefined ||
        finalKitchenId === null ||
        finalKitchenId === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Kitchen not mapped to this category. Fix category first.",
        });
      }

      // STEP 2: Insert item_foods with correct kitchenid
      db.run(
        `INSERT INTO item_foods 
        (CategoryID, UserIDInserted, kitchenid, ProductName, descrip, ProductImage,
         bigthumb, medium_thumb, small_thumb, productvat, special, offerIsavailable,
         offerstartdate, offerendate, is_customqty, ProductsIsActive, menutype)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          CategoryID,
          UserIDInserted,
          finalKitchenId,
          ProductName,
          descrp,
          ProductImage,
          BigThumb,
          MediumThumb,
          SmallThumb,
          productvat,
          specialint,
          isofferint,
          offerstartdate || "",
          offerenddate || "",
          is_custom_quantityint,
          status,
          menuid,
        ],
        function (err) {
          if (err) {
            console.error("❌ Insert error:", err);
            return res.status(500).json({
              success: false,
              error: "Insert failed",
              details: err,
            });
          }

          const insertedItemId = this.lastID;
          console.log("✅ Product inserted:", insertedItemId);

          // Insert variants
          const variantStmt = db.prepare(
            `INSERT INTO variant (menuid, price, variantName) VALUES (?, ?, ?)`,
          );

          parsedVariant.forEach(({ price, variantName }) => {
            variantStmt.run(insertedItemId, price, variantName);
          });

          variantStmt.finalize((variantErr) => {
            if (variantErr) {
              console.error("❌ Variant insert error:", variantErr);
            }

            // Insert addons
            const addonStmt = db.prepare(
              `INSERT INTO menu_add_on (menu_id, add_on_id, is_active) VALUES (?, ?, 1)`,
            );

            parsedAddons.forEach((addon_id) => {
              addonStmt.run(insertedItemId, addon_id);
            });

            addonStmt.finalize((addonErr) => {
              if (addonErr) {
                console.error("❌ Addon insert error:", addonErr);
              }

              return res.status(201).json({
                success: true,
                message: "Product created with auto kitchen mapping",
                product_id: insertedItemId,
              });
            });
          });
        },
      );
    },
  );
};

const getAllItemFoodDetails = async (req, res) => {
  const id = req.id;
  const { searchItem } = req.query;

  try {
    // User Validation
    const userData = await new Promise((resolve, reject) => {
      db.get(
        "SELECT created_by, is_admin FROM user WHERE id = ?",
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        },
      );
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const createdBy =
      Number(userData.is_admin) === 1 ? id : userData.created_by;

    if (!createdBy) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view food details.",
      });
    }

    let sql = `
      SELECT
        item_foods.*,

        item_category.Name,
        item_category.CategoryImage,
        item_category.CategoryIsActive,
        item_category.isoffer,
        item_category.parentid,

        kitchens.kitchen_name,
        kitchens.created_by,

        tbl_menutype.menutypeid,
        tbl_menutype.menu_icon
      FROM item_foods
      LEFT JOIN item_category
        ON item_foods.CategoryID = item_category.CategoryID
      LEFT JOIN kitchens
        ON CAST(item_foods.kitchenid AS INTEGER) = CAST(kitchens.id AS INTEGER)
      LEFT JOIN tbl_menutype
        ON CAST(item_foods.menutype AS INTEGER) = CAST(tbl_menutype.menutypeid AS INTEGER)
      WHERE item_foods.ProductsIsActive = 1
      AND item_foods.UserIDInserted = ?
    `;

    let params = [createdBy];

    if (searchItem && searchItem.trim() !== "") {
      sql += `
        AND (
          item_foods.ProductName LIKE ?
          OR item_category.Name LIKE ?
        )
      `;

      params.push(`%${searchItem}%`, `%${searchItem}%`);
    }

    sql += ` ORDER BY item_foods.ProductsID DESC`;

    const products = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error("Fetch error:", err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });

    if (!products.length) {
      return res.status(200).json([]);
    }

    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const variants = await new Promise((resolve, reject) => {
          db.all(
            "SELECT * FROM variant WHERE menuid = ?",
            [product.ProductsID],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            },
          );
        });

        return {
          ...product,
          variants,
        };
      }),
    );

    return res.status(200).json(productsWithDetails);
  } catch (err) {
    console.error("Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

const deleteItemFood = (req, res) => {
  const ProductsID = req.params.ProductsID;
  const userId = req.id;

  db.get("SELECT is_admin, created_by FROM user WHERE id = ?", [userId], (userErr, userData) => {
    if (userErr) return res.status(500).json({ error: "Internal Server Error" });
    if (!userData) return res.status(404).json({ error: "User not found" });
    const creatorId = Number(userData.is_admin) === 1 ? userId : userData.created_by;
    if (!creatorId) return res.status(403).json({ error: "You are not authorized" });

    doDeleteItemFood(ProductsID, creatorId, res);
  });
};

const doDeleteItemFood = (ProductsID, creatorId, res) => {
  // First fetch the ProductImage filename from item_foods (scoped to owner)
  const sqlFetchImage = `SELECT ProductImage FROM item_foods WHERE ProductsID = ? AND UserIDInserted = ?`;

  db.get(sqlFetchImage, [ProductsID, creatorId], (err, row) => {
    if (err) {
      console.error("Error fetching ProductImage:", err);
      return res
        .status(500)
        .json({ error: "Internal Server Error", details: err });
    }

    // Check if the product exists
    if (!row) {
      return res.status(404).json({ error: "Product not found" });
    }

    const imageFilename = row.ProductImage;

    // Delete the product from the database
    const sqlDeleteItemFood = `DELETE FROM item_foods WHERE ProductsID = ? AND UserIDInserted = ?`;

    db.run(sqlDeleteItemFood, [ProductsID, creatorId], function (err) {
      if (err) {
        console.error("Error deleting item_food:", err);
        return res
          .status(500)
          .json({ error: "Internal Server Error", details: err });
      }

      // If there was a ProductImage associated, delete the image file
      if (imageFilename) {
        const imagePath = path.join(
          __dirname,
          "../asset/category",
          imageFilename,
        );
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Error deleting image file:", unlinkErr);
              return res
                .status(500)
                .json({ error: "Internal Server Error", details: unlinkErr });
            }
            return res.json({
              message: "Product and image file deleted successfully",
            });
          });
        } else {
          return res.json({
            message: "Product deleted successfully, image file not found",
          });
        }
      } else {
        return res.json({
          message: "Product deleted successfully, no associated image",
        });
      }
    });
  });
};

// const getItemFoodDetails = (req, res) => {
//   const ProductsID = req.params.ProductID;

//   // Query to fetch product details
//   const productDetailsQuery = `
//     SELECT
//       item_foods.*,
//       item_category.*,
//       tbl_kitchen.*,
//       tbl_menutype.*
//     FROM
//       item_foods
//     LEFT JOIN item_category ON item_foods.CategoryID = item_category.CategoryID
//     LEFT JOIN tbl_kitchen ON item_foods.kitchenid = tbl_kitchen.kitchenid
//     LEFT JOIN tbl_menutype ON item_foods.menutype = tbl_menutype.menutypeid
//     WHERE
//       item_foods.ProductsIsActive = 1 AND item_foods.ProductsID = ?;
//   `;

//   // Query to fetch add-ons data
//   const addonsQuery = `
//     SELECT
//       menu_add_on.add_on_id,
//       add_ons.price AS addOn_price,
//       add_ons.add_on_name
//     FROM
//       menu_add_on
//     LEFT JOIN add_ons ON menu_add_on.add_on_id = add_ons.add_on_id
//     WHERE
//       menu_add_on.is_active = 1 AND menu_add_on.menu_id = ?;
//   `;

//   // Query to fetch variants data
//   const variantsQuery = `
//     SELECT
//       variant.*
//     FROM
//       variant
//     WHERE
//       variant.menuid = ?;
//   `;

//   // Execute all queries concurrently
//   Promise.all([
//     new Promise((resolve, reject) => {
//       db.get(productDetailsQuery, [ProductsID], (err, results) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(results);
//       });
//     }),
//     new Promise((resolve, reject) => {
//       db.all(addonsQuery, [ProductsID], (err, results) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(results);
//       });
//     }),
//     new Promise((resolve, reject) => {
//       db.all(variantsQuery, [ProductsID], (err, results) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(results);
//       });
//     }),
//   ])
//     .then(([productDetails, addons, variants]) => {
//       if (productDetails.length === 0) {
//         return res.status(404).json({ error: "No product details found" });
//       }

//       res.status(200).json({
//         productDetails: productDetails[0], // Assuming you want to return the first product detail
//         addons: addons.length > 0 ? addons : [], // If no addons, return an empty array
//         variants: variants.length > 0 ? variants : [], // If no variants, return an empty array
//       });
//     })
//     .catch((error) => {
//       console.error("Error fetching details:", error);
//       res.status(500).json({ error: "Internal Server Error", details: error });
//     });
// };

// update Food
const getItemFoodDetails = (req, res) => {
  const ProductsID = req.params.id;
  const userId = req.id;

  db.get("SELECT is_admin, created_by FROM user WHERE id = ?", [userId], (userErr, userData) => {
    if (userErr) return res.status(500).json({ error: "Internal Server Error" });
    if (!userData) return res.status(404).json({ error: "User not found" });
    const creatorId = Number(userData.is_admin) === 1 ? userId : userData.created_by;
    if (!creatorId) return res.status(403).json({ error: "You are not authorized" });

    doGetItemFoodDetails(ProductsID, creatorId, res);
  });
};

const doGetItemFoodDetails = (ProductsID, creatorId, res) => {
  // Query to fetch product details (scoped to owner)
  const productDetailsQuery = `
    SELECT
      item_foods.*,
      item_category.*,
      tbl_kitchen.*,
      tbl_menutype.*
    FROM
      item_foods
    LEFT JOIN item_category ON item_foods.CategoryID = item_category.CategoryID
    LEFT JOIN tbl_kitchen ON item_foods.kitchenid = tbl_kitchen.kitchenid
    LEFT JOIN tbl_menutype ON item_foods.menutype = tbl_menutype.menutypeid
    WHERE
      item_foods.ProductsIsActive = 1 AND item_foods.ProductsID = ? AND item_foods.UserIDInserted = ?;
  `;

  // Query to fetch add-ons data
  const addonsQuery = `
    SELECT
      menu_add_on.add_on_id,
      add_ons.price AS addOn_price,
      add_ons.add_on_name
    FROM
      menu_add_on
    LEFT JOIN add_ons ON menu_add_on.add_on_id = add_ons.add_on_id
    WHERE
      menu_add_on.is_active = 1 AND menu_add_on.menu_id = ?;
  `;

  // Query to fetch variants data
  const variantsQuery = `
    SELECT
      variant.*
    FROM
      variant
    WHERE
      variant.menuid = ?;
  `;

  // Execute all queries concurrently
  Promise.all([
    new Promise((resolve, reject) => {
      db.get(productDetailsQuery, [ProductsID, creatorId], (err, result) => {
        if (err) return reject(err);
        resolve(result || null); // Ensure null if no data is found
      });
    }),
    new Promise((resolve, reject) => {
      db.all(addonsQuery, [ProductsID], (err, results) => {
        if (err) return reject(err);
        resolve(results || []); // Ensure empty array if no data is found
      });
    }),
    new Promise((resolve, reject) => {
      db.all(variantsQuery, [ProductsID], (err, results) => {
        if (err) return reject(err);
        resolve(results || []); // Ensure empty array if no data is found
      });
    }),
  ])
    .then(([productDetails, addons, variants]) => {
      if (!productDetails) {
        // Fix: Check for null instead of length
        return res.status(404).json({ error: "No product details found" });
      }

      res.status(200).json({
        productDetails, // Directly return the object (not an array)
        addons,
        variants,
      });
    })
    .catch((error) => {
      console.error("Error fetching details:", error);
      res.status(500).json({ error: "Internal Server Error", details: error });
    });
};

// const updateItemFood = (req, res) => {
//   const {
//     CategoryID,
//     kitchenid,
//     ProductName,
//     descrp,
//     productvat,
//     special,
//     isoffer,
//     offerstartdate,
//     offerenddate,
//     is_custom_quantity,
//     status,
//     menuid,
//     variant, // This should be a JSON string of an array of objects
//     addons, // This should be a comma-separated string of addon IDs
//   } = req.body;
// const UserIDUpdated=req.id
//   const ProductsID = req.params.ProductID;
//   console.log(ProductsID,"sds")

//   const ProductImage = req.file ? req.file.filename : null;

//   const isofferint = isoffer === "true" ? 1 : 0;
//   const is_custom_quantityint = is_custom_quantity === "true" ? 1 : 0;
//   const specialint = special === "true" ? 1 : 0;

//   console.log("Received fields:", req.body);
//   console.log("Received file:", req.file);

//   // Convert variant JSON string to an array of objects
//   let parsedVariants = [];
//   try {
//     parsedVariants = JSON.parse(variant);
//   } catch (error) {
//     console.error("Error parsing variants:", error);
//     return res.status(400).json({ error: "Invalid variant data" });
//   }

//   // Convert comma-separated addons string to an array
//   const parsedAddons = addons ? addons.split(',') : [];

//   // Fetch existing item_food data
//   const sqlFetch = `SELECT * FROM item_foods WHERE ProductsID = ?`;
//   db.all(sqlFetch, [ProductsID], (err, existingData) => {
//     if (err) {
//       console.error("Error fetching existing item_food data:", err);
//       return res
//         .status(500)
//         .json({ error: "Internal Server Error", details: err });
//     }

//     if (existingData.length === 0) {
//       return res.status(404).json({ error: "Product not found" });
//     }

//     const existingItem = existingData[0];

//     // Use existing data as default for missing fields
//     const updatedCategoryID =
//       CategoryID !== undefined ? CategoryID : existingItem.CategoryID;
//     const updatedKitchenid =
//       kitchenid !== undefined ? kitchenid : existingItem.kitchenid;
//     const updatedProductName =
//       ProductName !== undefined ? ProductName : existingItem.ProductName;
//     const updatedDescrp = descrp !== undefined ? descrp : existingItem.descrip;
//     const updatedProductImage =
//       ProductImage !== null ? ProductImage : existingItem.ProductImage;
//     const updatedProductvat =
//       productvat !== undefined ? productvat : existingItem.productvat;
//     const updatedSpecial =
//       special !== undefined ? specialint : existingItem.special;
//     const updatedIsOffer =
//       isoffer !== undefined ? isofferint : existingItem.offerIsavailable;
//     const updatedOfferStartDate =
//       offerstartdate !== undefined
//         ? offerstartdate
//         : existingItem.offerstartdate;
//     const updatedOfferEndDate =
//       offerenddate !== undefined ? offerenddate : existingItem.offerendate;
//     const updatedIsCustomQuantity =
//       is_custom_quantity !== undefined
//         ? is_custom_quantityint
//         : existingItem.is_customqty;
//     const updatedStatus =
//       status !== undefined ? status : existingItem.ProductsIsActive;
//     const updatedMenuid = menuid !== undefined ? menuid : existingItem.menutype;

//     // Update item_foods
//     const sql1 = `UPDATE item_foods
//                     SET CategoryID = ?,UserIDUpdated = ?, kitchenid = ?, ProductName = ?, descrip = ?, ProductImage = ?, productvat = ?, special = ?, offerIsavailable = ?, offerstartdate = ?, offerendate = ?, is_customqty = ?, ProductsIsActive = ?, menutype = ?
//                     WHERE ProductsID = ?`;
//     const values1 = [
//       updatedCategoryID,
//       UserIDUpdated,
//       updatedKitchenid,
//       updatedProductName,
//       updatedDescrp,
//       updatedProductImage,
//       updatedProductvat,
//       updatedSpecial,
//       updatedIsOffer,
//       updatedOfferStartDate,
//       updatedOfferEndDate,
//       updatedIsCustomQuantity,
//       updatedStatus,
//       updatedMenuid,
//       ProductsID,
//     ];

//     db.run(sql1, values1, (err, result1) => {
//       if (err) {
//         console.error("Error updating item_foods:", err);
//         return res
//           .status(500)
//           .json({ error: "Internal Server Error", details: err });
//       }

//       // Remove existing variants
//       const sqlDeleteVariants = `DELETE FROM variant WHERE menuid = ?`;
//       db.run(sqlDeleteVariants, [ProductsID], (err) => {
//         if (err) {
//           console.error("Error deleting existing variants:", err);
//           return res
//             .status(500)
//             .json({ error: "Internal Server Error", details: err });
//         }

//         // Insert new variants
//         if (parsedVariants.length > 0) {
//           const sql2 = `INSERT INTO variant (menuid, price, variantName) VALUES (?, ?, ?)`;
//           const variantPromises = parsedVariants.map(({ price, variantName }) => {
//             const values2 = [ProductsID, price, variantName];
//             return new Promise((resolve, reject) => {
//               db.pool.query(sql2, values2, (err, result2) => {
//                 if (err) {
//                   console.error("Error inserting into variant:", err);
//                   reject(err);
//                 } else {
//                   resolve(result2);
//                 }
//               });
//             });
//           });

//           Promise.all(variantPromises)
//             .then(() => {
//               console.log("New variants added successfully");
//             })
//             .catch((err) => {
//               console.error("Error inserting variants:", err);
//               return res
//                 .status(500)
//                 .json({ error: "Internal Server Error", details: err });
//             });
//         }

//         // Remove existing add-ons
//         const sqlDeleteAddons = `DELETE FROM menu_add_on WHERE menu_id = ?`;
//         db.run(sqlDeleteAddons, [ProductsID], (err) => {
//           if (err) {
//             console.error("Error deleting existing add-ons:", err);
//             return res
//               .status(500)
//               .json({ error: "Internal Server Error", details: err });
//           }

//           // Insert new add-ons
//           if (parsedAddons.length > 0) {
//             const sql3 = `INSERT INTO menu_add_on (menu_id, add_on_id, is_active) VALUES (?, ?, 1)`;
//             const addonPromises = parsedAddons.map((addon_id) => {
//               const values3 = [ProductsID, addon_id];
//               return new Promise((resolve, reject) => {
//                 db.pool.query(sql3, values3, (err, result3) => {
//                   if (err) {
//                     console.error("Error inserting into menu_add_on:", err);
//                     reject(err);
//                   } else {
//                     resolve(result3);
//                   }
//                 });
//               });
//             });

//             Promise.all(addonPromises)
//               .then(() => {
//                 console.log("New add-ons added successfully");
//                 res.status(200).json({
//                   message:
//                     "Product updated successfully with any new variants and add-ons",
//                 });
//               })
//               .catch((err) => {
//                 console.error("Error inserting add-ons:", err);
//                 return res
//                   .status(500)
//                   .json({ error: "Internal Server Error", details: err });
//               });
//           } else {
//             // If no new add-ons, complete the response
//             res.status(200).json({
//               message:
//                 "Product updated successfully with any new variants",
//             });
//           }
//         });
//       });
//     });
//   });
// };
// const updateItemFood = (req, res) => {
//   const {
//     CategoryID,
//     kitchenid,
//     ProductName,
//     descrp,
//     productvat,
//     special,
//     isoffer,
//     offerstartdate,
//     offerenddate,
//     is_custom_quantity,
//     status,
//     menuid,
//     variant, // JSON string of an array of objects
//     addons, // Comma-separated string of addon IDs
//   } = req.body;

//   const UserIDUpdated = req.id;
//   const ProductsID = req.params.ProductID;
//   const ProductImage = req.file ? req.file.filename : null;

//   const isofferint = isoffer === "true" ? 1 : 0;
//   const is_custom_quantityint = is_custom_quantity === "true" ? 1 : 0;
//   const specialint = special === "true" ? 1 : 0;

//   console.log("Received fields:", req.body);
//   console.log("Received file:", req.file);

//   // Convert variant JSON string to an array of objects
//   let parsedVariants = [];
//   try {
//     parsedVariants = JSON.parse(variant);
//   } catch (error) {
//     console.error("Error parsing variants:", error);
//     return res.status(400).json({ error: "Invalid variant data" });
//   }

//   // Convert comma-separated addons string to an array
//   const parsedAddons = addons ? addons.split(",") : [];

//   // Fetch existing item_food data
//   const sqlFetch = `SELECT * FROM item_foods WHERE ProductsID = ?`;
//   db.all(sqlFetch, [ProductsID], (err, existingData) => {
//     if (err) {
//       console.error("Error fetching item_food:", err);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }

//     if (existingData.length === 0) {
//       return res.status(404).json({ error: "Product not found" });
//     }

//     const existingItem = existingData[0];

//     // Use existing data as default for missing fields
//     const updatedCategoryID = CategoryID ?? existingItem.CategoryID;
//     const updatedKitchenid = kitchenid ?? existingItem.kitchenid;
//     const updatedProductName = ProductName ?? existingItem.ProductName;
//     const updatedDescrp = descrp ?? existingItem.descrip;
//     const updatedProductImage = ProductImage ?? existingItem.ProductImage;
//     const updatedProductvat = productvat ?? existingItem.productvat;
//     const updatedSpecial =
//       special !== undefined ? specialint : existingItem.special;
//     const updatedIsOffer =
//       isoffer !== undefined ? isofferint : existingItem.offerIsavailable;
//     const updatedOfferStartDate = offerstartdate ?? existingItem.offerstartdate;
//     const updatedOfferEndDate = offerenddate ?? existingItem.offerendate;
//     const updatedIsCustomQuantity =
//       is_custom_quantity !== undefined
//         ? is_custom_quantityint
//         : existingItem.is_customqty;
//     const updatedStatus = status ?? existingItem.ProductsIsActive;
//     const updatedMenuid = menuid ?? existingItem.menutype;

//     // Update item_foods
//     const sqlUpdate = `
//       UPDATE item_foods
//       SET CategoryID = ?, UserIDUpdated = ?, kitchenid = ?, ProductName = ?, descrip = ?,
//           ProductImage = ?, productvat = ?, special = ?, offerIsavailable = ?,
//           offerstartdate = ?, offerendate = ?, is_customqty = ?,
//           ProductsIsActive = ?, menutype = ?
//       WHERE ProductsID = ?`;

//     const valuesUpdate = [
//       updatedCategoryID,
//       UserIDUpdated,
//       updatedKitchenid,
//       updatedProductName,
//       updatedDescrp,
//       updatedProductImage,
//       updatedProductvat,
//       updatedSpecial,
//       updatedIsOffer,
//       updatedOfferStartDate,
//       updatedOfferEndDate,
//       updatedIsCustomQuantity,
//       updatedStatus,
//       updatedMenuid,
//       ProductsID,
//     ];

//     db.run(sqlUpdate, valuesUpdate, function (err) {
//       if (err) {
//         console.error("Error updating item_foods:", err);
//         return res.status(500).json({ error: "Internal Server Error" });
//       }

//       // Delete existing variants
//       const sqlDeleteVariants = `DELETE FROM variant WHERE menuid = ?`;
//       db.run(sqlDeleteVariants, [ProductsID], (err) => {
//         if (err) {
//           console.error("Error deleting variants:", err);
//           return res.status(500).json({ error: "Internal Server Error" });
//         }

//         // Insert new variants
//         const variantPromises = parsedVariants.map(({ price, variantName }) => {
//           return new Promise((resolve, reject) => {
//             const sqlInsertVariant = `INSERT INTO variant (menuid, price, variantName) VALUES (?, ?, ?)`;
//             db.run(
//               sqlInsertVariant,
//               [ProductsID, price, variantName],
//               function (err) {
//                 if (err) {
//                   console.error("Error inserting variant:", err);
//                   reject(err);
//                 } else {
//                   resolve();
//                 }
//               }
//             );
//           });
//         });

//         // Delete existing add-ons
//         const sqlDeleteAddons = `DELETE FROM menu_add_on WHERE menu_id = ?`;
//         db.run(sqlDeleteAddons, [ProductsID], (err) => {
//           if (err) {
//             console.error("Error deleting add-ons:", err);
//             return res.status(500).json({ error: "Internal Server Error" });
//           }

//           // Insert new add-ons
//           const addonPromises = parsedAddons.map((addon_id) => {
//             return new Promise((resolve, reject) => {
//               const sqlInsertAddon = `INSERT INTO menu_add_on (menu_id, add_on_id, is_active) VALUES (?, ?, 1)`;
//               db.run(sqlInsertAddon, [ProductsID, addon_id], function (err) {
//                 if (err) {
//                   console.error("Error inserting add-on:", err);
//                   reject(err);
//                 } else {
//                   resolve();
//                 }
//               });
//             });
//           });

//           // Execute all promises and send response once all operations are done
//           Promise.all([...variantPromises, ...addonPromises])
//             .then(() => {
//               res.status(200).json({
//                 message:
//                   "Product updated successfully with new variants and add-ons",
//               });
//             })
//             .catch((err) => {
//               console.error("Error inserting data:", err);
//               res.status(500).json({ error: "Internal Server Error" });
//             });
//         });
//       });
//     });
//   });
// };

const updateItemFood = (req, res) => {
  const {
    CategoryID,
    kitchenid,
    ProductName,
    descrp,
    productvat,
    special,
    isoffer,
    offerstartdate,
    offerenddate,
    is_custom_quantity,
    status,
    menuid,
    variants, // Array of objects with price and variantName
    addons, // Array of addon IDs
  } = req.body;

  const UserIDUpdated = req.id;
  const ProductsID = req.params.ProductID;
  const ProductImage = req.file ? req.file.filename : null;

  const isofferint = isoffer === "true" ? 1 : 0;
  const is_custom_quantityint = is_custom_quantity === "true" ? 1 : 0;
  const specialint = special === "true" ? 1 : 0;

  // Parse variants and addons safely
  let parsedVariants = [];
  let parsedAddons = [];

  try {
    parsedVariants = JSON.parse(variants || "[]");
  } catch (err) {
    console.error("Error parsing variants:", err);
    return res.status(400).json({ error: "Invalid variants data" });
  }

  try {
    parsedAddons = JSON.parse(addons || "[]");
  } catch (err) {
    console.error("Error parsing addons:", err);
    return res.status(400).json({ error: "Invalid addons data" });
  }

  // Convert kitchenid to number if needed
  const kitchenIdNum = parseInt(kitchenid) || 0;

  // Resolve owner for scoping
  db.get("SELECT is_admin, created_by FROM user WHERE id = ?", [UserIDUpdated], (userErr, userData) => {
    if (userErr) return res.status(500).json({ error: "Internal Server Error" });
    if (!userData) return res.status(404).json({ error: "User not found" });
    const creatorId = Number(userData.is_admin) === 1 ? UserIDUpdated : userData.created_by;
    if (!creatorId) return res.status(403).json({ error: "You are not authorized" });

    // Fetch existing product to use default values if any field is missing
    db.get(
      `SELECT * FROM item_foods WHERE ProductsID = ? AND UserIDInserted = ?`,
      [ProductsID, creatorId],
      (err, existingItem) => {
        if (err) {
          console.error("Error fetching product:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        if (!existingItem) {
          return res.status(404).json({ error: "Product not found" });
        }

        const updatedCategoryID = CategoryID ?? existingItem.CategoryID;
        const updatedKitchenid = kitchenIdNum || existingItem.kitchenid;
        const updatedProductName = ProductName ?? existingItem.ProductName;
        const updatedDescrp = descrp ?? existingItem.descrip;
        const updatedProductImage = ProductImage ?? existingItem.ProductImage;
        const updatedProductvat = productvat ?? existingItem.productvat;
        const updatedSpecial =
          special !== undefined ? specialint : existingItem.special;
        const updatedIsOffer =
          isoffer !== undefined ? isofferint : existingItem.offerIsavailable;
        const updatedOfferStartDate =
          offerstartdate !== undefined
            ? (offerstartdate || null)
            : (existingItem.offerstartdate || null);

        const updatedOfferEndDate = offerenddate ?? existingItem.offerendate;
        const updatedIsCustomQuantity =
          is_custom_quantity !== undefined
            ? is_custom_quantityint
            : existingItem.is_customqty;
        const updatedStatus = status ?? existingItem.ProductsIsActive;
        const updatedMenuid = menuid ?? existingItem.menutype;

        // Update item_foods
        db.run(
          `UPDATE item_foods SET
            CategoryID = ?,
            UserIDUpdated = ?,
            kitchenid = ?,
            ProductName = ?,
            descrip = ?,
            ProductImage = ?,
            productvat = ?,
            special = ?,
            offerIsavailable = ?,
            offerstartdate = ?,
            offerendate = ?,
            is_customqty = ?,
            ProductsIsActive = ?,
            menutype = ?
          WHERE ProductsID = ? AND UserIDInserted = ?`,
          [
            updatedCategoryID,
            UserIDUpdated,
            updatedKitchenid,
            updatedProductName,
            updatedDescrp,
            updatedProductImage,
            updatedProductvat,
            updatedSpecial,
            updatedIsOffer,
            updatedOfferStartDate,
            updatedOfferEndDate,
            updatedIsCustomQuantity,
            updatedStatus,
            updatedMenuid,
            ProductsID,
            creatorId,
          ],
        function (err) {
          if (err) {
            console.error("Error updating product:", err);
            return res.status(500).json({ error: "Internal Server Error" });
          }

          // Delete existing variants
          db.run(
            `DELETE FROM variant WHERE menuid = ?`,
            [ProductsID],
            (err) => {
              if (err) {
                console.error("Error deleting variants:", err);
                return res.status(500).json({ error: "Internal Server Error" });
              }

              // Insert updated variants
              const variantInsert = db.prepare(
                `INSERT INTO variant (menuid, price, variantName) VALUES (?, ?, ?)`,
              );
              // parsedVariants.forEach(({ price, variantName }) => {
              //   variantInsert.run(ProductsID, price, variantName, (err) => {
              //     if (err) console.error("Error inserting variant:", err);
              //   });
              // });
              parsedVariants.forEach((v) => {
                const price = v.price || v.variant_price || 0;
                const variantName = v.variantName || v.name || "";
                console.log("Inserting Variant:", { price, variantName }); // check console
                variantInsert.run(ProductsID, price, variantName, (err) => {
                  if (err) console.error("Error inserting variant:", err);
                });
              });

              variantInsert.finalize();

              // Delete existing add-ons
              db.run(
                `DELETE FROM menu_add_on WHERE menu_id = ?`,
                [ProductsID],
                (err) => {
                  if (err) {
                    console.error("Error deleting add-ons:", err);
                    return res
                      .status(500)
                      .json({ error: "Internal Server Error" });
                  }

                  // Insert updated add-ons
                  const addonInsert = db.prepare(
                    `INSERT INTO menu_add_on (menu_id, add_on_id, is_active) VALUES (?, ?, 1)`,
                  );
                  // parsedAddons.forEach((addon_id) => {
                  //   addonInsert.run(ProductsID, addon_id, (err) => {
                  //     if (err) console.error("Error inserting add-on:", err);
                  //   });
                  // });
                  parsedAddons.forEach((addon_id) => {
                    const id = parseInt(addon_id) || 0;
                    console.log("Inserting Addon ID:", id);
                    addonInsert.run(ProductsID, id, (err) => {
                      if (err) console.error("Error inserting add-on:", err);
                    });
                  });

                  addonInsert.finalize();

                  res.status(200).json({
                    message:
                      "Product, variants, and add-ons updated successfully",
                  });
                },
              );
            },
          );
        },
      );
    },
  );
  });
};

const bulkUploadFood = (req, res) => {
  const { foods } = req.body;

  if (!Array.isArray(foods) || foods.length === 0) {
    return res.status(400).json({ error: "Invalid food data" });
  }

  const UserIDInserted = req.id || 1;

  const sql = `
    INSERT INTO item_food
    (
      CategoryID,
      ProductName,
      productvat,
      ProductImage,
      isoffer,
      offerstartdate,
      offerenddate,
      special,
      is_custom_quantity,
      menuid,
      status,
      descrp,
      variant,
      addons,
      UserIDInserted
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  let successCount = 0;
  let failedRows = [];

  db.serialize(() => {
    const stmt = db.prepare(sql);

    foods.forEach((food, index) => {
      const values = [
        food.CategoryID,
        food.ProductName,
        food.productvat || 0,
        food.ProductImage || null,
        food.isoffer || 0,
        food.offerstartdate || null,
        food.offerenddate || null,
        food.special || 0,
        food.is_custom_quantity || 0,
        food.menuid,
        food.status ?? 1,
        food.descrp || "",
        food.variant || "[]",
        food.addons || "[]",
        UserIDInserted,
      ];

      stmt.run(values, function (err) {
        if (err) {
          console.error("Row failed:", err.message);
          failedRows.push({ row: index + 1, error: err.message });
        } else {
          successCount++;
        }
      });
    });

    stmt.finalize(() => {
      res.json({
        message: `${successCount} foods uploaded successfully`,
        failed: failedRows.length,
        failedRows,
      });
    });
  });
};

const importFoodItems = (req, res) => {
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
    // Group rows by Product_Name
    const groups = {};
    for (const row of rows) {
      const key = (row.Product_Name || "").trim();
      if (!key) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    const groupKeys = Object.keys(groups);
    let imported = 0, skipped = 0, index = 0;

    function processNext() {
      if (index >= groupKeys.length) return res.json({ success: true, imported, skipped });
      const key = groupKeys[index++];
      const groupRows = groups[key];
      const firstRow = groupRows[0];

      const productName = key;
      const categoryName = (firstRow.Category_Name || "").trim();
      const menuTypeName = (firstRow.Menu_Type || "").trim();
      const description = (firstRow.Description || "").trim() || "";
      const vat = parseFloat(firstRow.VAT) || 0;
      const status = firstRow.Status !== undefined ? parseInt(firstRow.Status) : 1;

      // Category, Menu_Type, and at least one Variant are required (matching add form)
      const hasVariant = groupRows.some(r => (r.Variant_Name || "").trim());
      if (!categoryName || !menuTypeName || !hasVariant) { skipped++; return processNext(); }

      db.get("SELECT ProductsID FROM item_foods WHERE ProductName = ? AND UserIDInserted = ?", [productName, creator_id], (err, existing) => {
        if (err || existing) { skipped++; return processNext(); }

        db.get("SELECT CategoryID, kitchen_id FROM item_category WHERE Name = ? AND UserIDInserted = ?", [categoryName, creator_id], (err, category) => {
          if (err || !category) { skipped++; return processNext(); }

          const categoryId = category.CategoryID;
          const kitchenId = category.kitchen_id || null;

          db.get("SELECT menutypeid FROM tbl_menutype WHERE menutype = ? AND created_by = ?", [menuTypeName, creator_id], (err, mt) => {
            if (err || !mt) { skipped++; return processNext(); }
            const menuTypeId = mt.menutypeid;

            db.run(
              `INSERT INTO item_foods (CategoryID, UserIDInserted, kitchenid, ProductName, descrip, ProductImage,
               bigthumb, medium_thumb, small_thumb, productvat, special, offerIsavailable,
               offerstartdate, offerendate, is_customqty, ProductsIsActive, menutype)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [categoryId, creator_id, kitchenId, productName, description, "", "", "", "", vat, 0, 0, "", "", 0, status, menuTypeId],
              function(err) {
                if (err) { skipped++; return processNext(); }
                const foodId = this.lastID;
                const stmt = db.prepare("INSERT INTO variant (menuid, price, variantName) VALUES (?, ?, ?)");
                groupRows.forEach(r => {
                  const variantName = (r.Variant_Name || "").trim();
                  const price = parseFloat(r.Price) || 0;
                  if (variantName) stmt.run(foodId, price, variantName);
                });
                stmt.finalize(() => {
                  imported++;
                  processNext();
                });
              }
            );
          });
        });
      });
    }

    processNext();
  }
};

module.exports = {
  createItemFood,
  getAllItemFoodDetails,
  deleteItemFood,
  getItemFoodDetails,
  updateItemFood,
  bulkUploadFood,
  importFoodItems,
};
