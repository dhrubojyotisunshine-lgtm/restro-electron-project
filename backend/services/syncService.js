const axios = require("axios");
const db = require("../utils/db");

const SYNC_URL = "https://krayon.softwarestesting.co.in/api";
const SYNC_KEY = "my-secret-key";

const syncCategories = async () => {
  try {
    const unsynced = await new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM item_category WHERE is_synced = 0",
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });

    if (!unsynced.length) {
      console.log("⚡ No data to sync");
      return;
    }

    // console.log(`🔄 Syncing ${unsynced.length} categories...`);

    for (let cat of unsynced) {
      try {
        console.log("➡ Sending:", cat.Name);

        const response = await axios.post(`${SYNC_URL}/categories/sync`, cat, {
          headers: {
            "x-sync-key": SYNC_KEY, // 🔥 auth bypass
            "Content-Type": "application/json",
          },
          timeout: 5000, // optional safety
        });

        if (response.data.success) {
          await new Promise((resolve, reject) => {
            db.run(
              "UPDATE item_category SET is_synced = 1 WHERE uuid = ?",
              [cat.uuid],
              (err) => {
                if (err) reject(err);
                else resolve();
              },
            );
          });

          // console.log("✅ Synced:", cat.Name);
        } else {
          // console.log("⚠ API rejected:", response.data.message);
        }
      } catch (err) {
        // 🔥 detailed error handling
        if (err.code === "ENOTFOUND") {
          console.log("🌐 Network issue: Domain not found");
        } else if (err.response) {
          console.log(
            "❌ Server error:",
            err.response.status,
            err.response.data,
          );
        } else {
          console.log("❌ Sync failed:", err.message);
        }
      }
    }
  } catch (err) {
    console.log("🔥 Sync error:", err.message);
  }
};

const getUnsyncedFloors = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM tbl_tablefloor WHERE synced = 0", [], (err, rows) => {
      if (err) {
        console.log("DB ERROR:", err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const syncFloors = async () => {
  try {
    const floors = await getUnsyncedFloors();

    if (!Array.isArray(floors) || floors.length === 0) {
      console.log("⚠️ No valid data to sync");
      return;
    }

    const response = await axios.post(`${SYNC_URL}/sync/floors`, floors);

    console.log("✅ Server response:", response.data);

    for (let floor of floors) {
      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE tbl_tablefloor SET synced = 1 WHERE uuid = ?",
          [floor.uuid],
          (err) => {
            if (err) reject(err);
            else resolve();
          },
        );
      });
    }

    console.log("🎉 Floors synced successfully");
  } catch (err) {
    console.log("❌ Sync failed FULL ERROR:");
    console.log("Message:", err.message);
    console.log("Status:", err.response?.status);
    console.log("Data:", err.response?.data);
  }
};

const getUnsyncedTables = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM rest_table WHERE synced = 0", [], (err, rows) => {
      if (err) {
        console.log("DB ERROR:", err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const syncTables = async () => {
  try {
    console.log("🚀 Starting table sync...");

    const tables = await getUnsyncedTables();

    console.log("📦 Unsynced tables:", tables);

    if (!Array.isArray(tables) || tables.length === 0) {
      console.log("⚠️ No tables to sync");
      return;
    }

    console.log("🌐 API URL:", `${SYNC_URL}/sync/tables`);

    const response = await axios.post(`${SYNC_URL}/sync/tables`, tables, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Server response:", response.data);

    // ✅ Mark synced

    for (let table of tables) {
      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE rest_table SET synced = 1 WHERE uuid = ?",
          [table.uuid],
          (err) => {
            if (err) reject(err);
            else resolve();
          },
        );
      });
    }

    console.log("🎉 Tables synced successfully");
  } catch (err) {
    console.log("❌ Table sync failed");

    console.log("Message:", err.message);
    console.log("Status:", err.response?.status);
    console.log("Data:", err.response?.data);
  }
};

const getUnsyncedPurchaseItems = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM purchaseitem WHERE synced = 0", [], (err, rows) => {
      if (err) {
        console.log("DB ERROR:", err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const syncPurchaseItems = async () => {
  try {
    const purchases = await getUnsyncedPurchaseItems();

    if (!Array.isArray(purchases) || purchases.length === 0) {
      console.log("⚠️ No purchases to sync");
      return;
    }

    const response = await axios.post(
      `${SYNC_URL}/sync/purchaseitem`,
      purchases,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    for (let item of purchases) {
      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE purchaseitem SET synced = 1 WHERE uuid = ?",
          [item.uuid],
          (err) => {
            if (err) reject(err);
            else resolve();
          },
        );
      });
    }

    console.log("🎉 Purchase items synced successfully");
  } catch (err) {
    console.log("❌ Purchase sync failed");

    console.log("Message:", err.message);
    console.log("Status:", err.response?.status);
    console.log("Data:", err.response?.data);
  }
};

const getUnsyncedProduction = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM production WHERE synced = 0", [], (err, rows) => {
      if (err) {
        console.log("DB ERROR:", err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const syncProduction = async () => {
  try {

    const productions = await getUnsyncedProduction();

    if (!Array.isArray(productions) || productions.length === 0) {
      console.log("⚠️ No production data to sync");
      return;
    }

    const response = await axios.post(
      `${SYNC_URL}/sync/production`,
      productions,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    for (let item of productions) {
      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE production SET synced = 1 WHERE uuid = ?",
          [item.uuid],
          (err) => {
            if (err) reject(err);
            else resolve();
          },
        );
      });
    }

    console.log("🎉 Production synced successfully");
  } catch (err) {
    console.log("❌ Production sync failed");

    console.log("Message:", err.message);
    console.log("Status:", err.response?.status);
    console.log("Data:", err.response?.data);
  }
};
module.exports = {
  syncCategories,
  syncFloors,
  syncTables,
  syncPurchaseItems,
  syncProduction,
};
