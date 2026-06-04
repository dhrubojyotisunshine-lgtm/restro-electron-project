const axios = require("axios");
const db = require("../utils/db");

const SYNC_URL = "https://krayon.softwarestesting.co.in/api";

const getUnsyncedAddons = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM add_ons WHERE synced = 0", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const syncAddons = async () => {
  try {
    console.log("🚀 Starting add_ons sync...");

    const addons = await getUnsyncedAddons();

    if (!addons.length) {
      console.log("⚠️ No add_ons to sync");
      return;
    }

    const response = await axios.post(`${SYNC_URL}/sync/addons`, addons);

    console.log(response.data);

    for (let item of addons) {
      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE add_ons SET synced = 1 WHERE uuid = ?",
          [item.uuid],
          (err) => {
            if (err) reject(err);
            else resolve();
          },
        );
      });
    }

    console.log("✅ Addons synced");
  } catch (err) {
    console.log("❌ Sync failed");
    console.log(err.message);
  }
};

module.exports = { syncAddons };
