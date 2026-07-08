// const sqlite3 = require("sqlite3").verbose();
// const path = require("path");
// const fs = require("fs");

// const userDataPath = process.env.USER_DATA_PATH || __dirname;

// function getDatabasePath() {
//   if (process.env.DB_PATH) return process.env.DB_PATH;

//   const devPaths = [
//     path.join(__dirname, "../backend/database.sqlite"),
//     path.join(__dirname, "../database.sqlite"),
//   ];

//   for (const devPath of devPaths) {
//     if (fs.existsSync(devPath)) return devPath;
//   }

//   // Fallback: create inside userData path
//   return path.join(userDataPath, "database.sqlite");
// }

// function getSqlPath() {
//   if (process.env.SQL_PATH) return process.env.SQL_PATH;

//   const devPaths = [
//     path.join(__dirname, "../backend/data.sql"),
//     path.join(__dirname, "../data.sql"),
//   ];

//   for (const devPath of devPaths) {
//     if (fs.existsSync(devPath)) return devPath;
//   }

//   return null;
// }

// const dbPath = getDatabasePath();
// console.log("✅ Using SQLite database from:", dbPath);
// const sqlFilePath = getSqlPath();

// const db = new sqlite3.Database(
//   dbPath,
//   sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
//   (err) => {
//     if (err) {
//       console.error("❌ Database connection error:", err);
//       process.exit(1);
//     }

//     console.log(`Connected to database at: ${dbPath}`);
//     initializeDatabase();
//   },
// );

// async function initializeDatabase() {
//   if (!sqlFilePath) {
//     console.log("⚠️ No SQL initialization file found");
//     return;
//   }

//   try {
//     let sql = await fs.promises.readFile(sqlFilePath, "utf8");

//     sql = sql
//       .replace(/SET .*?;/g, "")
//       .replace(/START TRANSACTION;/g, "")
//       .replace(/COMMIT;/g, "")
//       .replace(/ENGINE=.*?;/g, ";")
//       .replace(/CHARSET=.*?;/g, ";")
//       .replace(/COLLATE=.*?;/g, ";")
//       .replace(/AUTO_INCREMENT=\d+/g, "")
//       .replace(/`/g, '"')
//       .replace(/UNSIGNED/g, "")
//       .replace(/int\(\d+\)/g, "INTEGER")
//       .replace(/tinyint\(\d+\)/g, "INTEGER");

//     await new Promise((resolve, reject) => {
//       db.exec(sql, (err) => {
//         if (err) reject(err);
//         else resolve();
//       });
//     });

//     console.log("✅ Database initialized successfully");
//     if (process.send) {
//       process.send("backend-ready");
//     }
//   } catch (err) {
//     console.error("❌ Database initialization failed:", err.message);
//   }
// }

// module.exports = db;

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const userDataPath = process.env.USER_DATA_PATH || __dirname;

// ---------------- DATABASE PATH ----------------
function getDatabasePath() {
  // Production path from Electron main process
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }

  // Development fallback paths
  const devPaths = [
    path.join(__dirname, "../backend/database.sqlite"),
    path.join(__dirname, "../database.sqlite"),
    path.join(__dirname, "./database.sqlite"),
  ];

  for (const devPath of devPaths) {
    if (fs.existsSync(devPath)) {
      return devPath;
    }
  }

  // Final fallback
  return path.join(userDataPath, "database.sqlite");
}

// ---------------- SQL PATH ----------------
function getSqlPath() {
  // Production path from Electron main process
  if (process.env.SQL_PATH) {
    return process.env.SQL_PATH;
  }

  // Development fallback paths
  const devPaths = [
    path.join(__dirname, "../backend/data.sql"),
    path.join(__dirname, "../data.sql"),
    path.join(__dirname, "./data.sql"),
  ];

  for (const devPath of devPaths) {
    if (fs.existsSync(devPath)) {
      return devPath;
    }
  }

  return null;
}

const dbPath = getDatabasePath();
const sqlFilePath = getSqlPath();

console.log("📂 SQLite DB Path:", dbPath);

const isNewDatabase = !fs.existsSync(dbPath);

// ---------------- CREATE DATABASE CONNECTION ----------------
const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  async (err) => {
    if (err) {
      console.error("❌ Database connection error:", err);
      process.exit(1);
    }

    console.log(`✅ Connected to database: ${dbPath}`);

    if (isNewDatabase && sqlFilePath) {
      try {
        await initializeDatabase();
      } catch (error) {
        console.error("❌ Database initialization error (non-fatal):", error.message);
      }
    } else {
      console.log("✅ Existing database found, skipping SQL initialization");
    }

    // Always runs — even if initializeDatabase() failed above
    seedMenuItems();
    migrateSubOrderSourceType();
    migrateCommissionSettings();
    migrateSubscriptionIndexes();

    if (process.send) {
      process.send("backend-ready");
    }
  },
);

// ---------------- MIGRATE SUBSCRIPTION UNIQUE INDEXES ----------------
// SQLite ignores MySQL PRIMARY KEY on ALTER TABLE, so plan_id and user_plan_id
// end up with no UNIQUE constraint — INSERT OR IGNORE silently inserts duplicates.
// These indexes make INSERT OR IGNORE behave correctly and prevent JOIN multiplication.
function migrateSubscriptionIndexes() {
  db.serialize(() => {
    // Deduplicate before creating indexes — SQLite ignores MySQL's PRIMARY KEY,
    // so these tables accumulate duplicate rows on repeated syncs.
    db.run(
      `DELETE FROM subscription_plans WHERE rowid NOT IN (SELECT MIN(rowid) FROM subscription_plans GROUP BY plan_id)`,
      function (err) {
        if (err) console.error("⚠️ subscription_plans dedup:", err.message);
        else if (this.changes > 0) console.log(`✅ Removed ${this.changes} duplicate subscription_plans rows`);
      }
    );
    db.run(
      `DELETE FROM superadmin_user_plans WHERE rowid NOT IN (SELECT MIN(rowid) FROM superadmin_user_plans GROUP BY user_plan_id)`,
      function (err) {
        if (err) console.error("⚠️ superadmin_user_plans dedup:", err.message);
        else if (this.changes > 0) console.log(`✅ Removed ${this.changes} duplicate superadmin_user_plans rows`);
      }
    );
    db.run(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_plan_id ON subscription_plans(plan_id)`,
      (err) => {
        if (err) console.error("⚠️ subscription_plans unique index:", err.message);
        else console.log("✅ subscription_plans(plan_id) unique index ready");
      }
    );
    db.run(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_sup_user_plan_id ON superadmin_user_plans(user_plan_id)`,
      (err) => {
        if (err) console.error("⚠️ superadmin_user_plans unique index:", err.message);
        else console.log("✅ superadmin_user_plans(user_plan_id) unique index ready");
      }
    );
  });
}

// ---------------- MIGRATE commission_settings TABLE ----------------
// CommissionSettings.js (Common Setting page) needs its own table with
// user_id, restro_name, email, phone etc. — the MySQL-dump `settings` table
// has completely different columns, so we create a separate one here.
function migrateCommissionSettings() {
  db.run(
    `CREATE TABLE IF NOT EXISTS commission_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      restro_name TEXT,
      email TEXT,
      phone TEXT,
      phone_optional TEXT,
      address TEXT,
      powerbytxt TEXT,
      logo TEXT,
      logo_footer TEXT,
      fevicon TEXT
    )`,
    (err) => {
      if (err) console.error("⚠️ Could not create commission_settings table:", err.message);
      else console.log("✅ commission_settings table ready");
    }
  );
}

// ---------------- MIGRATE sub_order FOR SPLIT PAY ORIGIN TRACKING ----------------
// sub_order rows are now created by both Hold Orders and normal POS orders.
// source_type records which flow created the row ('other' = hold/draft/legacy,
// 'normal' = orderPlace()). ADD COLUMN is safe/idempotent in SQLite — check
// first, since SQLite has no "ADD COLUMN IF NOT EXISTS".
function migrateSubOrderSourceType() {
  db.all("PRAGMA table_info(sub_order)", (err, columns) => {
    if (err) {
      console.error("⚠️ Could not read sub_order schema:", err.message);
      return;
    }

    const existing = new Set((columns || []).map((c) => c.name));

    if (!existing.has("source_type")) {
      db.run("ALTER TABLE sub_order ADD COLUMN source_type TEXT DEFAULT 'other'", (e) => {
        if (e) console.error("⚠️ Could not add source_type column:", e.message);
        else console.log("✅ sub_order.source_type column added");
      });
    }
  });
}

// ---------------- SEED MENU ITEMS ----------------
function seedMenuItems() {
  db.run(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_sec_menu_item_title ON sec_menu_item(menu_title)`,
    (err) => {
      if (err) console.error("⚠️ Could not create menu_item index:", err.message);
    }
  );

  const items = [
    [1,  'POS Invoice'],            [2,  'Order List'],
    [3,  'Pending Order'],          [4,  'Complete Order'],
    [5,  'Cancel Order'],           [6,  'All Reservations'],
    [7,  'Add Booking'],            [8,  'Unavailable today'],
    [9,  'Purchase Item'],          [10, 'Add Purchase'],
    [11, 'Purchase Return'],        [12, 'Return Invoice'],
    [13, 'Supplier Manage'],        [14, 'Supplier Ledger'],
    [15, 'Stock out ingredients'],  [16, 'Add Category'],
    [17, 'Category List'],          [18, 'Add Food'],
    [19, 'Food List'],              [20, 'Menu Type'],
    [21, 'Add Ons'],                [22, 'Ingredient Stock List'],
    [23, 'Stock Out Ingredient'],   [24, 'Set Production Unit'],
    [25, 'Point Setting'],          [26, 'Customer Point List'],
    [27, 'Production Set List'],    [28, 'Add Production'],
    [29, 'Permission Setup'],       [30, 'Add Role'],
    [31, 'Role List'],              [32, 'User Access Role'],
    [33, 'Add User'],               [34, 'User List'],
    [35, 'Purchase Report'],        [36, 'Stock Report (Food Item)'],
    [37, 'Stock Report (Kitchen)'], [38, 'Delevery Type Sale Report'],
    [39, 'Sale Report'],            [40, 'Waiter Sale Report'],
    [41, 'Service Charge Report'],  [42, 'Sale Report Cashie'],
    [43, 'Item Sales Report'],      [44, 'Cash Register Report'],
    [45, 'Sale Report Filtering'],  [46, 'Sale By Date'],
    [47, 'Sale By Table'],          [48, 'Commission Report'],
    [49, 'Unit Measurement'],       [50, 'Ingredients'],
    [51, 'Kitchen List'],           [52, 'Printers'],
    [53, 'Table & Floor Manage'],   [54, 'All Table-QR'],
    [55, 'Add Customers'],          [56, 'Customer Type'],
    [57, 'Commission Setup'],       [58, 'Designation'],
    [59, 'Addexpense Item'],        [60, 'Add Expense'],
    [61, 'Add Employee'],           [62, 'Manage Employee'],
    [63, 'Department'],             [64, 'Division'],
    [65, 'Holiday'],                [66, 'Leave Type'],
    [67, 'Leave Application'],      [68, 'Packaging Food'],
    [69, 'Purchase Food Waste'],    [70, 'Making Food Waste'],
    [71, 'Common Setting'],         [72, 'Sound Setting'],
    [73, 'Shipping Type'],
  ];

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO sec_menu_item
     (menu_id, menu_title, page_url, module, parent_menu, is_report, createby, createdate)
     VALUES (?, ?, NULL, NULL, NULL, 0, 1, '2024-01-01 00:00:00')`
  );

  items.forEach(([id, title]) => stmt.run([id, title]));

  stmt.finalize((err) => {
    if (err) {
      console.error("❌ sec_menu_item seed failed:", err.message);
    } else {
      console.log("✅ sec_menu_item seeded (73 items, duplicates skipped)");
    }
  });
}

// ---------------- INITIALIZE DATABASE ----------------
async function initializeDatabase() {
  try {
    if (!sqlFilePath || !fs.existsSync(sqlFilePath)) {
      console.log("⚠️ No SQL file found for initialization");
      return;
    }

    console.log("📄 Initializing database using:", sqlFilePath);

    let sql = await fs.promises.readFile(sqlFilePath, "utf8");

    // Cleanup MySQL syntax for SQLite compatibility
    sql = sql
      .replace(/SET .*?;/g, "")
      .replace(/START TRANSACTION;/g, "")
      .replace(/COMMIT;/g, "")
      .replace(/ENGINE=.*?;/g, ";")
      .replace(/DEFAULT CHARSET=.*?;/g, ";")
      .replace(/CHARSET=.*?;/g, ";")
      .replace(/COLLATE=.*?;/g, ";")
      .replace(/AUTO_INCREMENT=\d+/g, "")
      .replace(/UNSIGNED/g, "")
      .replace(/`/g, '"')
      .replace(/int\(\d+\)/gi, "INTEGER")
      .replace(/tinyint\(\d+\)/gi, "INTEGER")
      .replace(/bigint\(\d+\)/gi, "INTEGER");

    await new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log("✅ Database initialized successfully");
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    throw err;
  }
}

// ---------------- CLOSE DATABASE SAFELY ----------------
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("❌ Error closing database:", err);
    } else {
      console.log("✅ Database connection closed");
    }
    process.exit(0);
  });
});

module.exports = db;
