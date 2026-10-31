const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { fork, exec } = require("child_process");
const fs = require("fs");

function killPortProcess(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
      if (!stdout) return resolve();
      const pids = new Set();
      stdout.trim().split("\n").forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      });
      if (pids.size === 0) return resolve();
      let remaining = pids.size;
      pids.forEach((pid) => {
        exec(`taskkill /F /PID ${pid}`, () => {
          remaining--;
          if (remaining === 0) resolve();
        });
      });
    });
  });
}

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "../public/icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  // Load app
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function startBackend() {
  return new Promise(async (resolve, reject) => {
    try {
      const isPackaged = app.isPackaged;
      const userDataPath = app.getPath("userData");

      // ---------------- DB ----------------
      const targetDbPath = path.join(userDataPath, "database.sqlite");

      if (!fs.existsSync(targetDbPath)) {
        const sourceDbPath = isPackaged
          ? path.join(process.resourcesPath, "database.sqlite")
          : path.join(__dirname, "../database.sqlite");

        console.log("DB source:", sourceDbPath);
        console.log("DB target:", targetDbPath);

        if (fs.existsSync(sourceDbPath)) {
          fs.copyFileSync(sourceDbPath, targetDbPath);
          console.log("✅ Database copied successfully");
        } else {
          console.error("❌ Source DB not found:", sourceDbPath);
        }
      }

      // ---------------- SQL ----------------
      const targetSqlPath = path.join(userDataPath, "data.sql");

      if (!fs.existsSync(targetSqlPath)) {
        const sourceSqlPath = isPackaged
          ? path.join(process.resourcesPath, "data.sql")
          : path.join(__dirname, "../data.sql");

        console.log("SQL source:", sourceSqlPath);

        if (fs.existsSync(sourceSqlPath)) {
          fs.copyFileSync(sourceSqlPath, targetSqlPath);
          console.log("✅ SQL copied successfully");
        } else {
          console.error("❌ Source SQL not found:", sourceSqlPath);
        }
      }

      // ---------------- Backend ----------------
      const backendDir = isPackaged
        ? path.join(process.resourcesPath, "backend")
        : path.join(__dirname, "../backend");

      const backendPath = path.join(backendDir, "index.js");

      console.log("Starting backend from:", backendPath);

      if (!fs.existsSync(backendPath)) {
        throw new Error("Backend file missing: " + backendPath);
      }

      await killPortProcess(5001);

      const bundledDbPath = isPackaged
        ? path.join(process.resourcesPath, "database.sqlite")
        : path.join(__dirname, "../database.sqlite");

      backendProcess = fork(backendPath, [], {
        cwd: backendDir,
        env: {
          ...process.env,
          NODE_ENV: isPackaged ? "production" : "development",
          DB_PATH: targetDbPath,
          SQL_PATH: targetSqlPath,
          USER_DATA_PATH: userDataPath,
          BUNDLED_DB_PATH: bundledDbPath,
          PORT: 5001,
        },
        stdio: ["pipe", "pipe", "pipe", "ipc"],
      });

      backendProcess.stderr.pipe(process.stderr);

      backendProcess.stdout.on("data", (data) => {
        console.log(`[Backend] ${data}`);
      });

      backendProcess.stderr.on("data", (data) => {
        console.error(`[Backend Error] ${data}`);
      });

      backendProcess.on("error", (err) => {
        console.error("Backend process error:", err);
        reject(err);
      });

      backendProcess.on("exit", (code) => {
        if (code !== 0) {
          console.error("Backend exited with code:", code);
        }
      });

      // fallback resolve after 10 sec
      const timeout = setTimeout(() => {
        console.log("Backend startup timeout reached");
        resolve();
      }, 10000);

      backendProcess.on("message", (message) => {
        if (message === "backend-ready") {
          clearTimeout(timeout);
          console.log("Backend is ready");
          resolve();
        } else if (message === "backend-error") {
          clearTimeout(timeout);
          console.error("Backend failed to start");
          reject(new Error("Backend failed to start. Port 5001 may already be in use."));
        }
      });
    } catch (err) {
      console.error("Failed to start backend:", err);
      reject(err);
    }
  });
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();

    // macOS-specific behavior
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (err) {
    console.error("App initialization failed:", err);
    showErrorDialog("Application failed to start", err.message);
    app.quit();
  }
});

// Windows/Linux quit behavior
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    shutdownBackend();
    app.quit();
  }
});

// Ensure backend is killed when app quits
app.on("will-quit", () => {
  shutdownBackend();
});

function shutdownBackend() {
  if (backendProcess) {
    console.log("Shutting down backend process...");
    backendProcess.kill();
    backendProcess = null;
  }
}

function showErrorDialog(title, message) {
  const dialog = require("electron").dialog;
  dialog.showErrorBox(title, message);
}

// IPC communication example
ipcMain.on("frontend-message", (event, arg) => {
  console.log("Message from frontend:", arg);
  if (backendProcess) {
    backendProcess.send("message-from-main", arg);
  }
});
