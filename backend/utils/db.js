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

    try {
      // Initialize only if DB is new
      if (isNewDatabase && sqlFilePath) {
        await initializeDatabase();
      } else {
        console.log("✅ Existing database found, skipping SQL initialization");
      }

      // Notify Electron main process
      if (process.send) {
        process.send("backend-ready");
      }
    } catch (error) {
      console.error("❌ Database startup failed:", error);
    }
  },
);

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
