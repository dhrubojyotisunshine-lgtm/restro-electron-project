const db = require("../utils/db");

// GET request to fetch all add-ons
const getAddOns = (req, res) => {
  const id = req.id;
  const { searchItem } = req.query;

  const checkUserQuery = `SELECT created_by, is_admin FROM user WHERE id = ?`;

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

    let getAddonQuery = "";
    let queryParams = [];

    if (isAdmin === 1) {
      if (!searchItem || searchItem.trim() === "") {
        getAddonQuery = `
          SELECT * FROM add_ons
          WHERE created_by = ?
        `;
        queryParams = [id];
      } else {
        const searchQuery = `%${searchItem}%`;
        getAddonQuery = `
          SELECT * FROM add_ons
          WHERE created_by = ?
          AND (add_on_name LIKE ? OR price = ?)
        `;
        queryParams = [id, searchQuery, searchItem];
      }
    } else {
      if (!created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view add-ons.",
        });
      }

      if (!searchItem || searchItem.trim() === "") {
        getAddonQuery = `
          SELECT * FROM add_ons
          WHERE created_by = ?
        `;
        queryParams = [created_by];
      } else {
        const searchQuery = `%${searchItem}%`;
        getAddonQuery = `
          SELECT * FROM add_ons
          WHERE created_by = ?
          AND (add_on_name LIKE ? OR price = ?)
        `;
        queryParams = [created_by, searchQuery, searchItem];
      }
    }

    getAddonQuery += ` ORDER BY add_on_id DESC`;

    db.all(getAddonQuery, queryParams, (err, result) => {
      if (err) {
        console.error("Error fetching add-ons:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching add-ons",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
        message: "Add-ons fetched successfully",
      });
    });
  });
};

// get active addons
const getActiveAddOns = (req, res) => {
  const id = req.id;

  const checkUserQuery = `SELECT created_by, is_admin FROM user WHERE id = ?`;

  db.get(checkUserQuery, [id], (err, userData) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching user info",
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

    let addonQuery = "";
    let queryParams = [];

    if (isAdmin === 1) {
      addonQuery = `
        SELECT * FROM add_ons
        WHERE is_active = 1 AND created_by = ?
        ORDER BY add_on_id DESC
      `;
      queryParams = [id];
    } else {
      if (!created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view add-ons",
        });
      }

      addonQuery = `
        SELECT * FROM add_ons
        WHERE is_active = 1 AND created_by = ?
        ORDER BY add_on_id DESC
      `;
      queryParams = [created_by];
    }

    db.all(addonQuery, queryParams, (err, data) => {
      if (err) {
        console.error("Error fetching add-ons:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred",
          error: err.message,
        });
      }

      return res.status(200).json(data);
    });
  });
};

// POST request to create a new add-on
const createAddOn = (req, res) => {
  const { add_on_name, price, is_active = 1 } = req.body;
  const user_id = req.id;

  if (!add_on_name || price === undefined || price === null || price === "") {
    return res.status(400).json({
      success: false,
      message: "add_on_name and price are required.",
    });
  }

  const priceNum = parseFloat(price);
  const isActiveNum = parseInt(is_active);

  if (isNaN(priceNum) || isNaN(isActiveNum)) {
    return res.status(400).json({
      success: false,
      message: "Invalid numeric values.",
    });
  }

  const checkSubscriptionQuery = `
    SELECT * FROM superadmin_user_plans
    WHERE user_id = ?
  `;

  db.all(checkSubscriptionQuery, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length > 0) {
      const created_by = user_id;

      const insertQuery = `
        INSERT INTO add_ons 
        (add_on_name, price, is_active, created_by)
        VALUES (?, ?, ?, ?)
      `;

      const values = [add_on_name, priceNum, isActiveNum, created_by];

      db.run(insertQuery, values, function (err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to create add-on",
            error: err.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Add-on successfully created (via subscription).",
          add_on_id: this.lastID,
        });
      });
    } else {
      const checkUserCreatedByQuery = `
        SELECT created_by FROM user
        WHERE id = ?
      `;

      db.get(checkUserCreatedByQuery, [user_id], (err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
          });
        }

        if (!data || !data.created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to create add-ons.",
          });
        }

        const created_by = data.created_by;

        const checkCreatorSubscriptionQuery = `
          SELECT * FROM superadmin_user_plans
          WHERE user_id = ?
        `;

        db.all(
          checkCreatorSubscriptionQuery,
          [created_by],
          (err, creatorResults) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "Database error",
                error: err.message,
              });
            }

            if (creatorResults.length > 0) {
              const insertQuery = `
              INSERT INTO add_ons 
              (add_on_name, price, is_active, created_by)
              VALUES (?, ?, ?, ?)
            `;

              const values = [add_on_name, priceNum, isActiveNum, created_by];

              db.run(insertQuery, values, function (err) {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: "Failed to create add-on",
                    error: err.message,
                  });
                }

                return res.status(201).json({
                  success: true,
                  message: "Add-on successfully created (via creator).",
                  add_on_id: this.lastID,
                });
              });
            } else {
              return res.status(403).json({
                success: false,
                message: "Creator does not have an active subscription.",
              });
            }
          },
        );
      });
    }
  });
};

const createAddOnWithAssign = async (req, res) => {
  try {
    const { addonName, price } = req.body;

    const createaddon = `INSERT INTO add_ons (add_on_name, price, is_active) VALUES ('${addonName}', '${price}', '1')`;

    db.run(createaddon, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "An error occurred" });
      } else {
        res
          .status(200)
          .json({ success: true, message: "Add-on created successfully" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

// PUT request to update an add-on by ID
const updateAddOn = async (req, res) => {
  try {
    console.log(req);
    const { add_on_Id } = req.params;
    console.log(req.params.add_on_Id, "id");

    const { add_on_name, price, is_active } = req.body;

    const updateaddon = `UPDATE add_ons SET add_on_name='${add_on_name}', price='${price}', is_active='${is_active}' WHERE add_on_id=${add_on_Id}`;

    db.run(updateaddon, (err, result) => {
      if (err) {
        console.log(err);
        res
          .status(500)
          .json({ success: false, message: "An error occurredgfdggt" });
      } else {
        res
          .status(200)
          .json({ success: true, message: "Add-on updated successfully" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

const getAddOnsById = async (req, res) => {
  const { id } = req.params;
  try {
    const getaddon = `SELECT * FROM add_ons WHERE add_on_id=?`;
    db.all(getaddon, [id], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "An error occurred" });
      } else {
        res
          .status(200)
          .json({
            success: true,
            data: result,
            message: "Add-ons fetched successfully",
          });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

// DELETE request to delete an add-on by ID
const deleteAddOn = async (req, res) => {
  //   try {
  const { id } = req.params;

  const deleteaddon = `DELETE FROM add_ons WHERE add_on_id=${id}`;

  db.run(deleteaddon, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "An error occurred" });
    } else {
      res
        .status(200)
        .json({ success: true, message: "Add-on deleted successfully" });
    }
  });
  //   } catch (error) {
  //     res.status(500).json({ error: "An error occurred" });
  //   }
};

const importAddOns = (req, res) => {
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
    let imported = 0, skipped = 0, index = 0;

    function processNext() {
      if (index >= rows.length) return res.json({ success: true, imported, skipped });
      const row = rows[index++];
      const add_on_name = (row.Add_On_Name || "").trim();
      const price = row.Price;
      const is_active = row.Status !== undefined ? parseInt(row.Status) : 1;

      if (!add_on_name || !price) { skipped++; return processNext(); }

      db.get("SELECT add_on_id FROM add_ons WHERE add_on_name = ? AND created_by = ?", [add_on_name, creator_id], (err, existing) => {
        if (err || existing) { skipped++; return processNext(); }
        db.run(
          "INSERT INTO add_ons (add_on_name, price, is_active, created_by) VALUES (?, ?, ?, ?)",
          [add_on_name, parseFloat(price), is_active, creator_id],
          function(err) {
            if (err) { skipped++; return processNext(); }
            imported++;
            processNext();
          }
        );
      });
    }
    processNext();
  }
};

module.exports = {
  deleteAddOn,
  updateAddOn,
  getActiveAddOns,
  createAddOn,
  createAddOnWithAssign,
  getAddOns,
  getAddOnsById,
  importAddOns,
};
