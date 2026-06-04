const fs = require("fs");
const path = require("path");
const os = require("os");

// Always works in EXE
const appName = "electron-pos"; 
const basePath = path.join(os.homedir(), "AppData", "Roaming", appName);

const logDir = path.join(basePath, "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, "app.log");

function log(message, data = "") {
  const time = new Date().toISOString();
  const text =
    `[${time}] ${message} ` +
    (typeof data === "string" ? data : JSON.stringify(data)) +
    "\n";

  fs.appendFileSync(logFile, text, "utf8");
}

module.exports = { log };
