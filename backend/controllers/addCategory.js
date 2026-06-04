const db = require("../utils/db");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const addCategory = (req, res) => {
  const {
    name,
    parentid,
    offerstartdate,
    offerendate,
    status,
    isoffer,
    kitchen_id,
  } = req.body;

  // ==============================
  // BASIC VALIDATION
  // ==============================
  if (!name || !kitchen_id) {
    return res.status(400).json({
      success: false,
      message: "Name and kitchen_id are required",
    });
  }

  const user_id = req.id;
  const filename = req.file ? req.file.filename : null;
  const uuid = uuidv4();

  // SQLite/MySQL compatible datetime
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  // ==============================
  // SAFE CONVERSIONS
  // ==============================
  const safeParentId = parentid ? Number(parentid) : 0;
  const safeOfferStart = offerstartdate || null;
  const safeOfferEnd = offerendate || null;
  const safeStatus = status == 1 ? 1 : 0;
  const safeIsOffer = isoffer === true || isoffer == 1 ? 1 : 0;
  const safeKitchenId = Number(kitchen_id);

  // ==============================
  // SUBSCRIPTION CHECK
  // ==============================
  const checkSubscriptionQuery =
    "SELECT * FROM superadmin_user_plans WHERE user_id = ?";

  db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
    if (err) {
      console.error("Subscription Check Error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }

    if (subscription) {
      return insertCategory(user_id);
    }

    const checkUserCreatedByQuery = "SELECT created_by FROM user WHERE id = ?";

    db.get(checkUserCreatedByQuery, [user_id], (err, userData) => {
      if (err) {
        console.error("User Check Error:", err);
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }

      if (!userData || !userData.created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to add a category.",
        });
      }

      const created_by = userData.created_by;

      db.get(
        checkSubscriptionQuery,
        [created_by],
        (err, creatorSubscription) => {
          if (err) {
            console.error("Creator Subscription Error:", err);
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }

          if (!creatorSubscription) {
            return res.status(403).json({
              success: false,
              message: "Creator does not have an active subscription.",
            });
          }

          return insertCategory(created_by);
        },
      );
    });
  });

  // ==============================
  // INSERT CATEGORY - SQLITE LOGIC
  // ==============================
  function insertCategory(UserIDInserted) {
    const sql = `
      INSERT INTO item_category 
      (
        uuid,
        Name,
        parentid,
        offerstartdate,
        offerendate,
        CategoryIsActive,
        CategoryImage,
        isoffer,
        UserIDInserted,
        kitchen_id,
        DateInserted,
        DateUpdated,
        is_synced
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    const values = [
      uuid,
      name,
      safeParentId,
      safeOfferStart,
      safeOfferEnd,
      safeStatus,
      filename,
      safeIsOffer,
      UserIDInserted,
      safeKitchenId,
      now,
      now,
    ];

    db.run(sql, values, function (err) {
      if (err) {
        console.error("Insert error:", err);

        return res.status(500).json({
          success: false,
          error: "Internal Server Error",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Category saved offline",
        uuid,
        category_id: this.lastID,
      });
    });
  }
};

const getCategory = (req, res) => {
  const id = req.id;
  const { searchName, kitchen_id } = req.query;

  const checkUserQuery = "SELECT created_by, is_admin FROM user WHERE id = ?";

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
        message: "User not found.",
      });
    }

    const isAdmin = userData.is_admin;
    const created_by = userData.created_by;

    let userIdToFilter;

    if (isAdmin === 1) {
      userIdToFilter = id;
    } else {
      if (!created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view categories.",
        });
      }

      userIdToFilter = created_by;
    }

    let sql = `
      SELECT 
          i.CategoryID,
          i.uuid,
          i.Name,
          i.parentid,
          i.CategoryImage,
          i.CategoryIsActive,
          i.kitchen_id, 
          i.is_synced,
          p.Name AS parent_name
      FROM item_category i
      LEFT JOIN item_category p ON i.parentid = p.CategoryID
    `;

    const params = [];
    let where = [];

    // validation filter
    where.push("i.UserIDInserted = ?");
    params.push(userIdToFilter);

    if (kitchen_id) {
      where.push("i.kitchen_id = ?");
      params.push(kitchen_id);
    }

    if (searchName && searchName.trim() !== "") {
      where.push("i.Name LIKE ?");
      params.push(`%${searchName}%`);
    }

    if (where.length > 0) {
      sql += " WHERE " + where.join(" AND ");
    }

    sql += " ORDER BY i.CategoryID DESC";

    db.all(sql, params, (err, data) => {
      if (err) {
        console.error(err);
        return res.json([]);
      }

      const result = data.map((item) => ({
        ...item,
        parent_name: !item.parentid ? "No Parent" : item.parent_name,
        parentid: item.parentid || "",
      }));

      return res.json(result);
    });
  });
};

const deletCategory = (req, res) => {
  const id = req.params.id;

  const fetchImageSql =
    "SELECT CategoryImage FROM item_category WHERE CategoryID = ?";
  const deleteItemRelatedCategory =
    "DELETE FROM item_foods WHERE CategoryID = ?";
  const deleteRelatedItemVariant =
    "DELETE FROM variant WHERE menuID IN (SELECT ProductsID FROM item_foods WHERE CategoryID = ?)";
  const deleteRelatedAddon =
    "DELETE FROM menu_add_on WHERE menu_id IN (SELECT ProductsID FROM item_foods WHERE CategoryID = ?)";
  const deleteCategorySql = "DELETE FROM item_category WHERE CategoryID = ?";

  // Fetch image associated with category
  db.get(fetchImageSql, [id], (fetchErr, fetchData) => {
    if (fetchErr) {
      console.error("Database fetch error:", fetchErr);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (!fetchData) {
      return res.status(404).json({ error: "Category not found" });
    }

    const imageFilename = fetchData.CategoryImage;

    // Delete related add-ons
    db.run(deleteRelatedAddon, [id], (addonDeleteErr) => {
      if (addonDeleteErr) {
        console.error("Error deleting related add-ons:", addonDeleteErr);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Delete related variants
      db.run(deleteRelatedItemVariant, [id], (variantDeleteErr) => {
        if (variantDeleteErr) {
          console.error("Error deleting related variants:", variantDeleteErr);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        // Delete related items in item_foods table
        db.run(deleteItemRelatedCategory, [id], (itemDeleteErr) => {
          if (itemDeleteErr) {
            console.error("Error deleting related items:", itemDeleteErr);
            return res.status(500).json({ error: "Internal Server Error" });
          }

          // Delete the category itself
          db.run(deleteCategorySql, [id], function (deleteErr) {
            if (deleteErr) {
              console.error("Error deleting category:", deleteErr);
              return res.status(500).json({ error: "Internal Server Error" });
            }

            // If category has an image, delete it
            if (imageFilename) {
              const filePath = path.join(
                __dirname,
                "../asset/category",
                imageFilename,
              );
              if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error("Error deleting file:", unlinkErr);
                    return res
                      .status(500)
                      .json({ error: "File deletion error" });
                  }
                  return res.json({
                    message:
                      "Category, related items, add-ons, and file deleted successfully",
                  });
                });
              } else {
                return res.json({
                  message:
                    "Category, related items, and add-ons deleted successfully, image file not found",
                });
              }
            } else {
              return res.json({
                message:
                  "Category, related items, and add-ons deleted successfully, no associated image",
              });
            }
          });
        });
      });
    });
  });
};

// const updateCategory = (req, res) => {
//   const { id } = req.params;
//   const {
//     name,
//     parentid,
//     offerstartdate,
//     offerendate,
//     status,
//     isoffer,
//     kitchen_id,
//   } = req.body;

//   const filename = req.file ? req.file.filename : null;
//   const UserIDUpdated = req.id;

//   // Fetch the current image filename if no new image is provided
//   const fetchImageSql =
//     "SELECT CategoryImage FROM item_category WHERE CategoryID = ?";

//   db.get(fetchImageSql, [id], (fetchErr, fetchData) => {
//     if (fetchErr) {
//       console.error("Database fetch error:", fetchErr);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }

//     if (!fetchData) {
//       return res.status(404).json({ error: "Category not found" });
//     }

//     const currentImageFilename = fetchData.CategoryImage;

//     // Update the category
//     const updateSql = `
//       UPDATE item_category
//       SET Name = ?, parentid = ?, offerstartdate = ?, offerendate = ?, CategoryIsActive = ?,
//           CategoryImage = ?, isoffer = ?, UserIDUpdated = ?,  kitchen_id = ?
//       WHERE CategoryID = ?`;

//     const values = [
//       name,
//       parentid,
//       offerstartdate,
//       offerendate,
//       status,
//       filename || currentImageFilename, // Keep current image if no new image is uploaded
//       isoffer,
//       UserIDUpdated,
//       kitchen_id,
//       id,
//     ];

//     db.run(updateSql, values, function (updateErr) {
//       if (updateErr) {
//         console.error("Database update error:", updateErr);
//         return res.status(500).json({ error: "Internal Server Error" });
//       }

//       // Delete the old image file if a new one was uploaded
//       if (filename && currentImageFilename) {
//         const oldFilePath = path.join(
//           __dirname,
//           "../asset/category",
//           currentImageFilename,
//         );
//         if (fs.existsSync(oldFilePath)) {
//           fs.unlink(oldFilePath, (unlinkErr) => {
//             if (unlinkErr) {
//               console.error("Error deleting old file:", unlinkErr);
//             }
//           });
//         }
//       }

//       return res.json({ message: "Data updated successfully" });
//     });
//   });
// };

const updateCategory = (req, res) => {
  const { id } = req.params;
  const {
    name,
    parentid,
    offerstartdate,
    offerendate,
    status,
    isoffer,
    kitchen_id,
  } = req.body;

  const filename = req.file ? req.file.filename : null;
  const loggedInUserId = req.id;

  const checkUserQuery = "SELECT created_by, is_admin FROM user WHERE id = ?";

  db.get(checkUserQuery, [loggedInUserId], (userErr, userData) => {
    if (userErr) {
      console.error("User check error:", userErr);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    const creatorId = userData.is_admin === 1 ? loggedInUserId : userData.created_by;

    if (!creatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update category.",
      });
    }

    const fetchImageSql = `
      SELECT CategoryImage 
      FROM item_category 
      WHERE CategoryID = ? AND UserIDInserted = ?
    `;

    db.get(fetchImageSql, [id, creatorId], (fetchErr, fetchData) => {
      if (fetchErr) {
        console.error("Database fetch error:", fetchErr);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (!fetchData) {
        return res.status(404).json({
          success: false,
          message: "Category not found or unauthorized",
        });
      }

      const currentImageFilename = fetchData.CategoryImage;

      const updateSql = `
        UPDATE item_category
        SET Name = ?, 
            parentid = ?, 
            offerstartdate = ?, 
            offerendate = ?, 
            CategoryIsActive = ?, 
            CategoryImage = ?, 
            isoffer = ?, 
            UserIDUpdated = ?,  
            kitchen_id = ?
        WHERE CategoryID = ? AND UserIDInserted = ?
      `;

      const values = [
        name,
        parentid,
        offerstartdate,
        offerendate,
        status,
        filename || currentImageFilename,
        isoffer,
        loggedInUserId,
        kitchen_id,
        id,
        creatorId,
      ];

      db.run(updateSql, values, function (updateErr) {
        if (updateErr) {
          console.error("Database update error:", updateErr);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        db.run(
          `UPDATE item_foods 
           SET kitchenid = ?
           WHERE CategoryID = ?`,
          [kitchen_id, id],
          function (itemUpdateErr) {
            if (itemUpdateErr) {
              console.error("Item foods kitchen update error:", itemUpdateErr);
              return res.status(500).json({
                error: "Category updated but item foods kitchen update failed",
              });
            }

            if (filename && currentImageFilename) {
              const oldFilePath = path.join(
                __dirname,
                "../asset/category",
                currentImageFilename
              );

              if (fs.existsSync(oldFilePath)) {
                fs.unlink(oldFilePath, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error("Error deleting old file:", unlinkErr);
                  }
                });
              }
            }

            return res.json({
              success: true,
              message: "Category updated successfully",
              updated_items: this.changes,
            });
          }
        );
      });
    });
  });
};

const getCategoryById = (req, res) => {
  const categoryId = req.params.id;

  const sql = `
    SELECT
      i.*,
      p.Name AS parent_name,
      p.CategoryID AS parent_id
    FROM item_category i
    LEFT JOIN item_category p ON i.parentid = p.CategoryID
    WHERE i.CategoryID = ?
  `;

  // SQLite uses db.get for single row
  db.get(sql, [categoryId], (err, data) => {
    if (err) {
      console.error("Database query error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Category not found or not accessible.",
      });
    }

    // parent_name set karna agar parentid 0 hai
    data.parent_name = data.parentid === 0 ? "No Parent" : data.parent_name;

    return res.status(200).json({ success: true, data });
  });
};

const bulkUploadCategory = (req, res) => {
  const { categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: "Invalid category data" });
  }

  const UserIDInserted = req.id || 1;

  const sql = `
    INSERT INTO item_category 
    (Name, parentid, offerstartdate, offerendate, CategoryIsActive, CategoryImage, isoffer, UserIDInserted, kitchen_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  let successCount = 0;
  let failedRows = [];

  db.serialize(() => {
    const stmt = db.prepare(sql);

    categories.forEach((cat, index) => {
      const values = [
        cat.name,
        cat.parentid || null,
        cat.offerstartdate || null,
        cat.offerendate || null,
        cat.status,
        cat.image || null, // filename only
        cat.isoffer || 0,
        UserIDInserted,
        cat.kitchen_id,
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
        message: `${successCount} categories uploaded successfully`,
        failed: failedRows.length,
        failedRows,
      });
    });
  });
};

module.exports = {
  getCategory,
  addCategory,
  deletCategory,
  updateCategory,
  getCategoryById,
  bulkUploadCategory,
};
