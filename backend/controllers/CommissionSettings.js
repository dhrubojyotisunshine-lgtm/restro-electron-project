const db = require("../utils/db");

const resolveCreatorId = (userId, callback) => {
  db.get("SELECT is_admin, created_by FROM user WHERE id = ?", [userId], (err, row) => {
    if (err) return callback(err, null);
    if (!row) return callback(null, null);
    const creatorId = Number(row.is_admin) === 1 ? userId : row.created_by;
    callback(null, creatorId);
  });
};

const createCommissionSetting = (req, res) => {
  const { pos_id, rate } = req.body;
  const user_id = req.id;

  if (!pos_id || rate === undefined || rate === null || rate === "") {
    return res.status(400).json({ success: false, message: "Required fields missing" });
  }

  resolveCreatorId(user_id, (err, creatorId) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });

    db.run(
      "INSERT INTO payroll_commission_setting (pos_id, rate, created_by) VALUES (?, ?, ?)",
      [pos_id, rate, creatorId],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        return res.status(201).json({
          success: true,
          message: "Commission created successfully",
          data: { id: this.lastID },
        });
      }
    );
  });
};

const getAllCommissionSettings = (req, res) => {
  const user_id = req.id;

  resolveCreatorId(user_id, (err, creatorId) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!creatorId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const query = `
      SELECT pcs.*, p.position_name
      FROM payroll_commission_setting pcs
      LEFT JOIN position p ON pcs.pos_id = p.pos_id
      WHERE pcs.created_by = ?
      ORDER BY pcs.id DESC
    `;

    db.all(query, [creatorId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      return res.json({ success: true, data: rows });
    });
  });
};

const getCommissionSettingById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT pcs.*, p.position_name
    FROM payroll_commission_setting pcs
    LEFT JOIN position p ON pcs.pos_id = p.pos_id
    WHERE pcs.id = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: "Commission setting not found" });
    }
    return res.status(200).json({ success: true, data: row });
  });
};

const updateCommissionSetting = (req, res) => {
  const { id } = req.params;
  const { rate } = req.body;

  if (!id) return res.status(400).json({ success: false, message: "ID is required" });
  if (rate === undefined || rate === null || rate === "") {
    return res.status(400).json({ success: false, message: "Rate is required" });
  }

  db.run(
    "UPDATE payroll_commission_setting SET rate = ? WHERE id = ?",
    [rate, id],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (this.changes === 0) return res.status(404).json({ success: false, message: "No record found to update" });
      return res.json({ success: true, message: "Commission updated successfully" });
    }
  );
};

const deleteCommissionSetting = (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM payroll_commission_setting WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, message: "Record not found" });
    return res.json({ success: true, message: "Commission deleted successfully" });
  });
};

module.exports = {
  deleteCommissionSetting,
  updateCommissionSetting,
  getAllCommissionSettings,
  createCommissionSetting,
  getCommissionSettingById,
};
