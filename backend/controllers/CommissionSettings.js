const db = require("../utils/db");

const createCommissionSetting = (req, res) => {
  const { restro_name, email, phone, phone_optional, address, powerbytxt } =
    req.body;

  const user_id = req.id;

  const logo = req.files?.logo?.[0]?.filename || null;
  const logo_footer = req.files?.logo_footer?.[0]?.filename || null;
  const fevicon = req.files?.fevicon?.[0]?.filename || null;

  if (!restro_name?.trim() || !email?.trim() || !phone?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Required fields missing",
    });
  }

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
      return saveSettings(user_id);
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
          message: "You are not authorized to create commission settings.",
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

          return saveSettings(created_by);
        },
      );
    });
  });

  function saveSettings(created_by) {
    const checkQuery = `SELECT * FROM commission_settings WHERE user_id = ? LIMIT 1`;

    db.get(checkQuery, [created_by], (err, existing) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (existing) {
        const updateQuery = `
          UPDATE commission_settings SET
            restro_name = ?,
            email = ?,
            phone = ?,
            phone_optional = ?,
            address = ?,
            powerbytxt = ?,
            logo = COALESCE(?, logo),
            logo_footer = COALESCE(?, logo_footer),
            fevicon = COALESCE(?, fevicon)
          WHERE id = ? AND user_id = ?
        `;

        db.run(
          updateQuery,
          [
            restro_name,
            email,
            phone,
            phone_optional,
            address,
            powerbytxt,
            logo,
            logo_footer,
            fevicon,
            existing.id,
            created_by,
          ],
          function (err) {
            if (err) {
              return res.status(500).json({
                success: false,
                message: err.message,
              });
            }

            return res.json({
              success: true,
              message: "Settings updated successfully",
            });
          },
        );
      } else {
        const insertQuery = `
          INSERT INTO commission_settings (
            user_id,
            restro_name,
            email,
            phone,
            phone_optional,
            address,
            powerbytxt,
            logo,
            logo_footer,
            fevicon
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
          insertQuery,
          [
            created_by,
            restro_name,
            email,
            phone,
            phone_optional,
            address,
            powerbytxt,
            logo,
            logo_footer,
            fevicon,
          ],
          function (err) {
            if (err) {
              return res.status(500).json({
                success: false,
                message: err.message,
              });
            }

            return res.status(201).json({
              success: true,
              message: "Settings created successfully",
              data: { id: this.lastID },
            });
          },
        );
      }
    });
  }
};

const getCommissionSettingById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT pcs.*, p.position_name
    FROM payroll_commission_setting pcs
    LEFT JOIN position p ON pcs.pos_id = p.pos_id
    WHERE pcs.id = ?
  `;

  // Use db.get if expecting a single result
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error("Database fetch error:", err);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching the commission setting",
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Commission setting not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: row,
    });
  });
};

const getAllCommissionSettings = (req, res) => {
  const id = req.id;

  const checkUserQuery = "SELECT created_by, is_admin FROM user WHERE id = ?";

  db.get(checkUserQuery, [id], (userErr, userData) => {
    if (userErr) {
      return res.status(500).json({
        success: false,
        message: userErr.message,
      });
    }

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const creatorId = userData.is_admin === 1 ? id : userData.created_by;

    if (!creatorId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to settings",
      });
    }

    const query = `
      SELECT *
      FROM commission_settings
      WHERE user_id = ?
      LIMIT 1
    `;

    db.get(query, [creatorId], (err, row) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      return res.json({
        success: true,
        data: row || {},
      });
    });
  });
};
const updateCommissionSetting = (req, res) => {
  const { id } = req.params;

  const { restro_name, email, phone, phone_optional, address, powerbytxt } =
    req.body;

  const logo = req.files?.logo?.[0]?.filename || null;
  const logo_footer = req.files?.logo_footer?.[0]?.filename || null;
  const fevicon = req.files?.fevicon?.[0]?.filename || null;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "ID is required",
    });
  }

  if (!restro_name?.trim() || !email?.trim() || !phone?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Required fields missing",
    });
  }

  const updateQuery = `
    UPDATE commission_settings SET
      restro_name = ?,
      email = ?,
      phone = ?,
      phone_optional = ?,
      address = ?,
      powerbytxt = ?,
      logo = COALESCE(?, logo),
      logo_footer = COALESCE(?, logo_footer),
      fevicon = COALESCE(?, fevicon)
    WHERE id = ?
  `;

  db.run(
    updateQuery,
    [
      restro_name,
      email,
      phone,
      phone_optional,
      address,
      powerbytxt,
      logo,
      logo_footer,
      fevicon,
      id,
    ],
    function (err) {
      if (err) {
        console.error("UPDATE ERROR:", err);
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "No record found to update",
        });
      }

      return res.json({
        success: true,
        message: "Settings updated successfully",
      });
    },
  );
};

const deleteCommissionSetting = (req, res) => {
  const query = `DELETE FROM commission_settings`;

  db.run(query, [], function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    return res.json({
      success: true,
      message: "Settings deleted",
    });
  });
};

module.exports = {
  deleteCommissionSetting,
  updateCommissionSetting,
  getAllCommissionSettings,
  createCommissionSetting,
  getCommissionSettingById,
};
