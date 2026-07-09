const db = require("../utils/db");

const queryDb = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

const getDb = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );

const runDb = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    })
  );

const resolveOwnerId = async (userId) => {
  const user = await getDb("SELECT is_admin, created_by FROM user WHERE id = ?", [userId]);
  if (!user) return null;
  return Number(user.is_admin) === 1 ? Number(userId) : Number(user.created_by);
};

// GET /websetting — used by Nav and Common Setting page
const getAllSettings = async (req, res) => {
  try {
    const userId = req.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const ownerId = await resolveOwnerId(userId);
    if (!ownerId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const rows = await queryDb(
      `SELECT id, restro_name, address, email, phone, phone_optional,
              logo, logo_footer, fevicon, powerbytxt, user_id
       FROM common_setting WHERE user_id = ? LIMIT 1`,
      [ownerId]
    );
    res.status(200).json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error("getAllSettings error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /csetting — create
const createSetting = async (req, res) => {
  try {
    const userId = req.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const ownerId = await resolveOwnerId(userId);
    if (!ownerId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const { restro_name, email, phone, phone_optional, address, powerbytxt } = req.body;
    const logo = req.files?.logo?.[0]?.filename || null;
    const logo_footer = req.files?.logo_footer?.[0]?.filename || null;
    const fevicon = req.files?.fevicon?.[0]?.filename || null;

    // Only one record per user — upsert
    const existing = await getDb("SELECT id FROM common_setting WHERE user_id = ?", [ownerId]);
    if (existing) {
      // Update existing
      const sets = ["restro_name=?","email=?","phone=?","phone_optional=?","address=?","powerbytxt=?"];
      const params = [restro_name, email, phone, phone_optional, address, powerbytxt];
      if (logo) { sets.push("logo=?"); params.push(logo); }
      if (logo_footer) { sets.push("logo_footer=?"); params.push(logo_footer); }
      if (fevicon) { sets.push("fevicon=?"); params.push(fevicon); }
      params.push(existing.id);
      await runDb(`UPDATE common_setting SET ${sets.join(",")} WHERE id=?`, params);
      return res.status(200).json({ success: true, message: "Setting updated successfully" });
    }

    await runDb(
      `INSERT INTO common_setting (restro_name, email, phone, phone_optional, address, powerbytxt, logo, logo_footer, fevicon, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restro_name, email, phone, phone_optional, address, powerbytxt, logo, logo_footer, fevicon, ownerId]
    );
    res.status(200).json({ success: true, message: "Setting saved successfully" });
  } catch (err) {
    console.error("createSetting error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /csetting/:id — update
const updateSetting = async (req, res) => {
  try {
    const userId = req.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const ownerId = await resolveOwnerId(userId);
    if (!ownerId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const { restro_name, email, phone, phone_optional, address, powerbytxt } = req.body;

    const sets = ["restro_name=?","email=?","phone=?","phone_optional=?","address=?","powerbytxt=?"];
    const params = [restro_name, email, phone, phone_optional, address, powerbytxt];

    if (req.files?.logo?.[0]) { sets.push("logo=?"); params.push(req.files.logo[0].filename); }
    if (req.files?.logo_footer?.[0]) { sets.push("logo_footer=?"); params.push(req.files.logo_footer[0].filename); }
    if (req.files?.fevicon?.[0]) { sets.push("fevicon=?"); params.push(req.files.fevicon[0].filename); }

    params.push(id, ownerId);
    const result = await runDb(
      `UPDATE common_setting SET ${sets.join(",")} WHERE id=? AND user_id=?`,
      params
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Setting not found" });
    }
    res.status(200).json({ success: true, message: "Setting updated successfully" });
  } catch (err) {
    console.error("updateSetting error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /csetting/:id
const getSettingById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await getDb(
      `SELECT id, restro_name, address, email, phone, phone_optional,
              logo, logo_footer, fevicon, powerbytxt FROM common_setting WHERE id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ success: false, message: "Setting not found" });
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    console.error("getSettingById error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Sound setting
const createOrUpdateSoundSetting = (req, res) => {
  const nofitysound = req.file ? req.file.path : null;
  if (!nofitysound) return res.status(400).json({ success: false, message: "Missing sound file" });

  db.get("SELECT soundid FROM tbl_soundsetting LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    if (row) {
      db.run("UPDATE tbl_soundsetting SET nofitysound = ? WHERE soundid = ?", [nofitysound, row.soundid], (e) => {
        if (e) return res.status(500).json({ success: false, message: "Error updating" });
        res.status(200).json({ success: true, message: "Sound setting updated" });
      });
    } else {
      db.run("INSERT INTO tbl_soundsetting (nofitysound) VALUES (?)", [nofitysound], (e) => {
        if (e) return res.status(500).json({ success: false, message: "Error creating" });
        res.status(201).json({ success: true, message: "Sound setting created" });
      });
    }
  });
};

const getAllSoundSettings = (req, res) => {
  db.all("SELECT * FROM tbl_soundsetting", (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "Error fetching" });
    res.status(200).json({ success: true, data: rows });
  });
};

// GET /public/setting — no auth, returns first available logo (used on login page)
const getPublicSetting = async (req, res) => {
  try {
    const row = await getDb(
      "SELECT logo, logo_footer, fevicon, restro_name FROM common_setting LIMIT 1"
    );
    res.status(200).json({ success: true, data: row || null });
  } catch (err) {
    console.error("getPublicSetting error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getAllSettings,
  createSetting,
  updateSetting,
  getSettingById,
  getPublicSetting,
  createOrUpdateSoundSetting,
  getAllSoundSettings,
};
