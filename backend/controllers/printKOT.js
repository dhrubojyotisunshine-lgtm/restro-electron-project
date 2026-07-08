// const db = require("../utils/db");
// const { log } = require("../utils/logger");
// const { print } = require("pdf-to-printer");
// const fs = require("fs");
// const path = require("path");
// const net = require("net");

// async function printToPrinter(printer, text) {
//   console.log(printer.printer_name);
//   if (printer.printer_type === "windows") {
//     return printWindows(printer.printer_name, text);
//   }

//   if (printer.printer_type === "network") {
//     if (!printer.printer_path) {
//       throw new Error("Printer IP address is required");
//     }

//     return printNetwork(printer.printer_path, printer.port, text);
//   }

//   throw new Error("Unsupported printer type: " + printer.printer_type);
// }

// async function printWindows(printerName, text) {
//   const filePath = path.join(__dirname, "kot.txt");
//   fs.writeFileSync(filePath, text, "utf8");

//   await print(filePath, { printer: printerName });
//   return true;
// }

// function printNetwork(ip, port, text) {
//   return new Promise((resolve, reject) => {
//     if (!port) {
//       return reject(
//         new Error("Printer port not configured for network printer"),
//       );
//     }

//     const client = new net.Socket();

//     client.connect(port, ip, () => {
//       client.write(Buffer.from(text + "\n\n\n", "ascii"));
//       client.end();
//       resolve(true);
//     });

//     client.on("error", (err) => {
//       reject(new Error(`Network printer error: ${err.message}`));
//     });
//   });
// }

// const printOrderToKitchens = async (req, res) => {
//   try {
//     const { kitchenId } = req.params;
//     log("📥 Print API called", { kitchenId });

//     if (!kitchenId) {
//       return res.status(400).json({ message: "Kitchen ID is required" });
//     }

//     // 1️⃣ Get pending KOT items
//     const kotItems = await new Promise((resolve, reject) => {
//       db.all(
//         `
//         SELECT
//           k.kot_id,
//           k.order_id,
//           k.item_name,
//           k.qty,
//           co.table_no,
//           co.order_time
//         FROM kot_items k
//         JOIN customer_order co ON k.order_id = co.order_id
//         WHERE k.kitchen_id = ?
//           AND k.printed = 0
//         ORDER BY k.order_id ASC
//         `,
//         [kitchenId],
//         (err, rows) => (err ? reject(err) : resolve(rows || [])),
//       );
//     });

//     if (!kotItems.length) {
//       return res.json({ success: false, message: "No pending KOT items" });
//     }

//     // 2️⃣ Get printer from unified `printers` table
//     const printer = await new Promise((resolve, reject) => {
//       db.get(
//         `
//         SELECT
//           name              AS printer_name,
//           connection_type   AS printer_type,
//           path              AS printer_path,
//           port
//         FROM printers
//         WHERE business_id = ?
//         LIMIT 1
//         `,
//         [kitchenId],
//         (err, row) => (err ? reject(err) : resolve(row || null)),
//       );
//     });

//     if (!printer) {
//       return res.status(500).json({
//         success: false,
//         message: "No printer configured for this kitchen",
//       });
//     }

//     log("🖨 Loaded printer:", printer);

//     // 3️⃣ Group orders
//     const orders = {};
//     kotItems.forEach((item) => {
//       if (!orders[item.order_id]) {
//         orders[item.order_id] = {
//           table: item.table_no || "-",
//           time: item.order_time || "-",
//           items: [],
//         };
//       }
//       orders[item.order_id].items.push(item);
//     });

//     // 4️⃣ Build KOT text
//     let text = "===== KITCHEN ORDER (KOT) =====\n\n";

//     for (const orderId in orders) {
//       text += `Order #${orderId}\n`;
//       text += `Table : ${orders[orderId].table}\n`;
//       text += `Time  : ${orders[orderId].time}\n`;
//       text += "------------------------------\n";

//       orders[orderId].items.forEach((i) => {
//         text += `${i.qty} x ${i.item_name}\n`;
//       });

//       text += "\n";
//     }

//     text += "\n\n\n";

//     // 5️⃣ Print
//     try {
//       await printToPrinter(printer, text);
//       log("✅ Print success");
//     } catch (err) {
//       log("❌ Print failed:", err.message);
//       return res.status(500).json({
//         success: false,
//         message: "Printing failed",
//         error: err.message,
//       });
//     }

//     // 6️⃣ Mark as printed
//     await new Promise((resolve, reject) => {
//       db.run(
//         `
//         UPDATE kot_items
//         SET printed = 1
//         WHERE kitchen_id = ?
//           AND printed = 0
//         `,
//         [kitchenId],
//         (err) => (err ? reject(err) : resolve()),
//       );
//     });

//     return res.json({
//       success: true,
//       message: "KOT printed successfully",
//       kitchenId,
//       printed_items: kotItems.length,
//     });
//   } catch (err) {
//     log("❌ Fatal error:", err.message);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// const testUsbPrint = async (req, res) => {
//   try {
//     const printer = createPrinterInstance({
//       printer_type: "usb",
//       printer_path: "usb://0x0471:0x8E00",
//     });

//     if (!printer) {
//       return res.status(500).json({
//         success: false,
//         message: "Printer init failed",
//       });
//     }

//     printer.alignCenter();
//     printer.println("USB TEST SUCCESS");
//     printer.drawLine();
//     printer.println("Printer is working properly");
//     printer.cut();

//     let success;

//     if (TEST_MODE) {
//       console.log("🧪 TEST MODE: Fake print success");
//       success = true;
//     } else {
//       success = await printer.execute();
//     }

//     return res.json({
//       success,
//       message: success ? "Printed successfully" : "Print failed",
//     });
//   } catch (err) {
//     console.error("TEST PRINT ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// };

// const getKitchenKotList = async (req, res) => {
//   try {
//     const query = `
//       SELECT
//         k.kot_id,
//         k.order_id,
//         k.kitchen_id,   -- ✅ this is correct for kot_items
//         k.item_name,
//         k.qty,
//         k.status AS kitchen_status,
//         k.accept_time,
//         k.ready_time,
//         co.table_no,
//         rt.tablename,
//         co.order_time,
//         co.tokenno
//       FROM kot_items k
//       JOIN customer_order co ON k.order_id = co.order_id
//       LEFT JOIN rest_table rt ON co.table_no = rt.tableid
//       WHERE
//         k.printed = 1
//         AND k.status NOT IN ('completed','rejected')
//         AND k.status <> ''
//       ORDER BY co.order_time DESC
//     `;

//     db.all(query, [], (err, result) => {
//       if (err) {
//         console.error("SQLite error:", err);
//         return res.status(500).json({ success: false });
//       }

//       const grouped = {};

//       result.forEach((row) => {
//         const key = `${row.order_id}_${row.kitchen_id}`;

//         if (!grouped[key]) {
//           grouped[key] = {
//             order_id: row.order_id,
//             kitchen_id: row.kitchen_id,
//             table_no: row.table_no,
//             table_name: row.tablename,
//             tokenno: row.tokenno,
//             items: [],
//           };
//         }

//         grouped[key].items.push({
//           id: row.kot_id,
//           name: row.item_name,
//           qty: row.qty,
//           status: row.kitchen_status,
//           accept_time: row.accept_time,
//           ready_time: row.ready_time,
//         });
//       });

//       res.json({
//         success: true,
//         data: Object.values(grouped),
//       });
//     });
//   } catch (e) {
//     console.error("getKitchenKotList error:", e);
//     res.status(500).json({ success: false });
//   }
// };

// const getKitchenKotHistory = async (req, res) => {
//   try {
//     const query = `
//       SELECT
//         k.kot_id,
//         k.order_id,
//         k.kitchen_id,
//         k.item_name,
//         k.qty,
//         k.status AS item_status,
//         k.accept_time,
//         k.ready_time,
//         k.reject_reason,
//         co.table_no,
//         rt.tablename,
//         co.order_time,
//         co.tokenno
//       FROM kot_items k
//       JOIN customer_order co ON k.order_id = co.order_id
//       LEFT JOIN rest_table rt ON co.table_no = rt.tableid
//       WHERE k.printed = 1
//       ORDER BY co.order_time DESC
//     `;

//     db.all(query, [], (err, result) => {
//       if (err) {
//         console.error("SQLite error:", err);
//         return res.status(500).json({ success: false });
//       }

//       const grouped = {};

//       result.forEach((row) => {
//         const key = `${row.order_id}_${row.kitchen_id}`;

//         if (!grouped[key]) {
//           grouped[key] = {
//             order_id: row.order_id,
//             kitchen_id: row.kitchen_id,
//             table_no: row.table_no,
//             table_name: row.tablename,
//             tokenno: row.tokenno,
//             order_time: row.order_time,
//             items: [],
//           };
//         }

//         grouped[key].items.push({
//           id: row.kot_id,
//           name: row.item_name,
//           qty: row.qty,
//           status: row.item_status,
//           accept_time: row.accept_time,
//           ready_time: row.ready_time,
//           reject_reason: row.reject_reason,
//         });
//       });

//       res.json({
//         success: true,
//         data: Object.values(grouped),
//       });
//     });
//   } catch (e) {
//     console.error("getKitchenKotHistory error:", e);
//     res.status(500).json({ success: false });
//   }
// };

// const acceptKitchenOrder = async (req, res) => {
//   try {
//     const { order_id, kitchen_id, item_ids } = req.body;

//     if (
//       !order_id ||
//       !kitchen_id ||
//       !Array.isArray(item_ids) ||
//       !item_ids.length
//     ) {
//       return res.status(400).json({ message: "Missing data" });
//     }

//     const placeholders = item_ids.map(() => "?").join(",");

//     await new Promise((resolve, reject) => {
//       db.run(
//         `
//         UPDATE kot_items
//         SET status = 'accepted',
//             accept_time = DATETIME('now')
//         WHERE order_id = ?
//           AND kitchen_id = ?
//           AND kot_id IN (${placeholders})
//         `,
//         [order_id, kitchen_id, ...item_ids],
//         (err) => (err ? reject(err) : resolve()),
//       );
//     });

//     res.json({ success: true, message: "Selected items accepted" });
//   } catch (err) {
//     console.error("❌ ACCEPT ERROR:", err);
//     res.status(500).json({ message: "Internal error" });
//   }
// };

// const completeKitchenOrder = async (req, res) => {
//   try {
//     const { order_id, kitchen_id, item_ids } = req.body;

//     if (
//       !order_id ||
//       !kitchen_id ||
//       !Array.isArray(item_ids) ||
//       !item_ids.length
//     ) {
//       return res.status(400).json({ message: "Missing data" });
//     }

//     const placeholders = item_ids.map(() => "?").join(",");

//     // 1. Mark selected items completed
//     await new Promise((resolve, reject) => {
//       db.run(
//         `
//         UPDATE kot_items
//         SET status = 'completed',
//             ready_time = DATETIME('now')
//         WHERE order_id = ?
//           AND kitchen_id = ?
//           AND kot_id IN (${placeholders})
//         `,
//         [order_id, kitchen_id, ...item_ids],
//         (err) => (err ? reject(err) : resolve()),
//       );
//     });

//     // 2. Check if any pending items remain
//     const pending = await new Promise((resolve, reject) => {
//       db.get(
//         `
//         SELECT COUNT(*) AS pending
//         FROM kot_items
//         WHERE order_id = ?
//           AND status != 'completed'
//         `,
//         [order_id],
//         (err, row) => (err ? reject(err) : resolve(row.pending)),
//       );
//     });

//     // 3. If all completed → update order
//     if (pending === 0) {
//       await new Promise((resolve, reject) => {
//         db.run(
//           `UPDATE customer_order SET status = 'completed' WHERE order_id = ?`,
//           [order_id],
//           (err) => (err ? reject(err) : resolve()),
//         );
//       });
//     }

//     res.json({
//       success: true,
//       message: pending === 0 ? "Order fully completed" : "Partial completed",
//     });
//   } catch (err) {
//     console.error("❌ COMPLETE ERROR:", err);
//     res.status(500).json({ message: "Internal error" });
//   }
// };

// const rejectKitchenOrder = async (req, res) => {
//   try {
//     const { order_id, kitchen_id, reason } = req.body;

//     if (!order_id || !kitchen_id || !reason) {
//       return res.status(400).json({ message: "Missing required data" });
//     }

//     // 1. Update kot_items
//     await new Promise((resolve, reject) => {
//       db.run(
//         `
//         UPDATE kot_items
//         SET status = 'rejected',
//             reject_reason = ?
//         WHERE order_id = ? AND kitchen_id = ?
//         `,
//         [reason, order_id, kitchen_id],
//         (err) => (err ? reject(err) : resolve()),
//       );
//     });

//     // 2. Update customer_order
//     await new Promise((resolve, reject) => {
//       db.run(
//         `
//         UPDATE customer_order
//         SET status = 'rejected'
//         WHERE order_id = ?
//         `,
//         [order_id],
//         (err) => (err ? reject(err) : resolve()),
//       );
//     });

//     return res.json({
//       success: true,
//       message: "Order rejected by kitchen",
//     });
//   } catch (err) {
//     console.error("❌ REJECT ERROR:", err);
//     res.status(500).json({ message: "Internal error" });
//   }
// };

//function printWindows(printerName, html) {
//   return new Promise((resolve, reject) => {
//     try {
//       const tempDir = path.join(process.cwd(), "temp");

//       // Create temp folder
//       if (!fs.existsSync(tempDir)) {
//         fs.mkdirSync(tempDir, {
//           recursive: true,
//         });
//       }

//       // HTML file path
//       const htmlPath = path.join(tempDir, `kot_${Date.now()}.html`);

//       fs.writeFileSync(htmlPath, html);

//       console.log("🖨 HTML file created:", htmlPath);

//       /* =====================================
//          PRINT COMMAND
//       ===================================== */

//       const command = `
//       powershell -Command "
//       Start-Process msedge.exe -ArgumentList '--headless','--disable-gpu','--kiosk-printing','file:///${htmlPath.replace(
//         /\\/g,
//         "/",
//       )}'"
//       `;

//       console.log("🖨 Running print command...");

//       exec(command, (error, stdout, stderr) => {
//         if (error) {
//           console.log("❌ Print command error:", error);

//           return reject(error);
//         }

//         if (stderr) {
//           console.log("⚠ Print stderr:", stderr);
//         }

//         console.log("✅ Windows print completed");

//         resolve(true);
//       });
//     } catch (err) {
//       console.log("❌ Windows print failed:", err);

//       reject(err);
//     }
//   });
// }

// module.exports = {
//   testUsbPrint,
//   printOrderToKitchens,
//   getKitchenKotList,
//   acceptKitchenOrder,
//   rejectKitchenOrder,
//   completeKitchenOrder,
//   getKitchenKotHistory,
// };
// const db = require("../utils/db");
// const { log } = require("../utils/logger");
// const { print } = require("pdf-to-printer");
// const net = require("net");
// const fs = require("fs");
// const path = require("path");

// const { exec } = require("child_process");

// async function printToPrinter(printer, html, rawText) {
//   log("🖨 Printing to:", printer);

//   // WINDOWS / USB / SHARED
//   if (printer.printer_type === "windows" || printer.printer_type === "usb") {
//     return printWindows(printer.printer_name.trim(), rawText);
//   }

//   // NETWORK / LAN
//   if (printer.printer_type === "network") {
//     if (!printer.printer_path) {
//       throw new Error("Printer IP address missing");
//     }

//     return printNetwork(printer.printer_path, printer.port || 9100, rawText);
//   }

//   throw new Error(`Unsupported printer type: ${printer.printer_type}`);
// }

// async function printWindows(printerName, text) {
//   return new Promise((resolve, reject) => {
//     try {
//       log("====================================");
//       log("🖨 WINDOWS RAW PRINT STARTED");
//       log(`🖨 Printer Name: ${printerName}`);

//       const tempDir = path.join(process.cwd(), "temp");

//       if (!fs.existsSync(tempDir)) {
//         fs.mkdirSync(tempDir);
//       }

//       const filePath = path.join(tempDir, `kot_${Date.now()}.txt`);

//       // ESC/POS reset + normal text
//       const content =
//         "\x1B\x40" + // initialize printer
//         text +
//         "\n\n\n" +
//         "\x1D\x56\x00"; // cut paper, if supported

//       fs.writeFileSync(filePath, content, "binary");

//       log(`📄 TXT File Created: ${filePath}`);

//       const command = `print /D:"${printerName}" "${filePath}"`;

//       log(`🖨 Command: ${command}`);

//       exec(command, (error, stdout, stderr) => {
//         if (error) {
//           log(`❌ RAW PRINT ERROR: ${error.message}`);
//           return reject(error);
//         }

//         if (stderr) {
//           log(`⚠️ RAW PRINT STDERR: ${stderr}`);
//         }

//         log(`✅ RAW PRINT STDOUT: ${stdout}`);
//         log("✅ WINDOWS RAW PRINT COMPLETED");
//         log("====================================");

//         resolve(true);
//       });
//     } catch (err) {
//       reject(err);
//     }
//   });
// }

const db = require("../utils/db");
const { log } = require("../utils/logger");

const { print } = require("pdf-to-printer");
const html_to_pdf = require("html-pdf-node");

const net = require("net");
const fs = require("fs");
const path = require("path");

async function printToPrinter(printer, html, rawText) {
  log("🖨 Printing to:", printer);

  // WINDOWS / USB / SHARED
  if (printer.printer_type === "windows" || printer.printer_type === "usb") {
    return printWindows(printer.printer_name.trim(), html);
  }

  // NETWORK / LAN
  if (printer.printer_type === "network") {
    if (!printer.printer_path) {
      throw new Error("Printer IP address missing");
    }

    return printNetwork(printer.printer_path, printer.port || 9100, rawText);
  }

  throw new Error(`Unsupported printer type: ${printer.printer_type}`);
}

/* =========================================================
   WINDOWS PDF PRINT
========================================================= */

async function printWindows(printerName, html) {
  try {
    log("====================================");

    log("🖨 WINDOWS PDF PRINT STARTED");

    log(`🖨 Printer Name: ${printerName}`);

    const tempDir = path.join(process.cwd(), "temp");

    // CREATE TEMP FOLDER
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const pdfPath = path.join(tempDir, `kot_${Date.now()}.pdf`);

    log(`📄 PDF Path: ${pdfPath}`);

    /* =========================================
       GENERATE PDF
    ========================================= */

    const options = {
      width: "50mm",

      margin: {
        top: "0mm",
        bottom: "0mm",
        left: "0mm",
        right: "0mm",
      },

      printBackground: true,
    };

    const file = {
      content: html,
    };

    const pdfBuffer = await html_to_pdf.generatePdf(file, options);

    fs.writeFileSync(pdfPath, pdfBuffer);

    log("✅ PDF file created");

    /* =========================================
       CHECK FILE EXISTS
    ========================================= */

    const fileExists = fs.existsSync(pdfPath);

    log(`📄 PDF Exists: ${fileExists}`);

    /* =========================================
       PRINT PDF
    ========================================= */

    await print(pdfPath, {
      printer: printerName,
    });

    log("✅ WINDOWS PDF PRINT COMPLETED");

    log("====================================");

    return true;
  } catch (err) {
    log(`❌ WINDOWS PDF PRINT FAILED: ${err.message}`);

    throw err;
  }
}

function buildRawText(orders) {
  let text = "";

  for (const orderId in orders) {
    const order = orders[orderId];

    text += "--------------------------------\n";

    text += "           FOOD ZONE\n";

    text += "--------------------------------\n";

    text += `ROOM     : ${order.table}\n`;

    text += `ORDER #  : ${orderId}\n`;

    text += `TIME     : ${order.time}\n`;

    text += "--------------------------------\n";

    text += "ITEM                     QTY\n";

    text += "--------------------------------\n";

    order.items.forEach((i) => {
      const name = String(i.item_name || "").substring(0, 22);

      const qty = String(i.qty || "");

      text += name.padEnd(24, " ") + qty.padStart(3, " ") + "\n";
    });

    text += "--------------------------------\n";

    text += "          THANK YOU!\n";

    text += "\n\n\n";
  }

  return text;
}

function buildKotHTML(orders) {
  let ordersHTML = "";

  log("📦 FULL ORDERS DATA:");
  log(JSON.stringify(orders, null, 2));

  for (const orderId in orders) {
    const order = orders[orderId];

    const token = "KOT-" + String(orderId).padStart(4, "0");

    const dateTime = new Date().toLocaleString();

    let itemsHTML = "";

    order.items.forEach((item) => {
      log("🍽 ITEM:", item);

      itemsHTML += `
        <div class="item-row">
          <div class="item-name">
            ${item.item_name}
          </div>

          <div class="qty">
            x${item.qty}
          </div>
        </div>
      `;
    });

    ordersHTML += `
      <div class="token-box">

        <div class="shop-name">
          FOOD ZONE
        </div>

        <div class="token-number">
          ${token}
        </div>

        <div class="divider"></div>

        <div class="info">
         <div><b>ORDER ID:</b> ${orderId}</div>
          <div><b>ROOM:</b> ${order.table || "-"}</div>
          <div><b>WAITER:</b> ${order.waiter_name || "-"}</div>
          <div><b>CUSTOMER TYPE:</b> ${order.customer_type || "-"}</div>
          <div><b>TIME:</b> ${order.time || "-"}</div>
          <div><b>DATE:</b> ${dateTime}</div>
        </div>

        <div class="divider"></div>

        <div class="items-title">
          ITEMS
        </div>

        ${itemsHTML}

        <div class="divider"></div>

        <div class="footer">
          THANK YOU
        </div>

      </div>
    `;
  }

  return `
  <!DOCTYPE html>

  <html>

  <head>

    <meta charset="UTF-8" />

    <style>

      *{
        box-sizing:border-box;
      }

      body{
        font-family: Arial, sans-serif;
        width:48mm;
        max-width:48mm;
        margin:0;
        padding:2mm;
        color:#000;
      }

      .token-box{
        width:100%;
        text-align:center;
      }

      .shop-name{
        font-size:16px;
        font-weight:bold;
        margin-bottom:4px;
      }

      .token-number{
        font-size:20px;
        font-weight:bold;
        margin:6px 0;
      }

      .divider{
        border-top:1px dashed #000;
        margin:6px 0;
      }

      .info{
        text-align:left;
        font-size:10px;
        line-height:1.5;
      }

      .items-title{
        font-size:12px;
        font-weight:bold;
        margin-bottom:5px;
      }

      .item-row{
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:4px;
        font-size:10px;
        margin:4px 0;
        text-align:left;
      }

      .item-name{
        width:75%;
        word-break:break-word;
      }

      .qty{
        width:20%;
        text-align:right;
        font-weight:bold;
      }

      .footer{
        margin-top:8px;
        font-size:11px;
        font-weight:bold;
      }

      @media print {

        body{
          width:48mm;
          max-width:48mm;
        }

        .token-box{
          page-break-after:auto;
        }

      }

    </style>

  </head>

  <body>

    ${ordersHTML}

  </body>

  </html>
  `;
}

function printNetwork(ip, port, text) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();

    client.connect(port, ip, () => {
      console.log(`🖨 Connected to printer ${ip}:${port}`);

      client.write(Buffer.from(text + "\n\n\n", "ascii"));

      client.end();

      resolve(true);
    });

    client.on("error", (err) => {
      console.log("❌ Network printer error:", err);

      reject(new Error(`Network printer error: ${err.message}`));
    });

    client.on("close", () => {
      console.log("🖨 Network printer connection closed");
    });
  });
}

const printOrderToKitchens = async (req, res) => {
  try {
    const { kitchenId } = req.params;

    log("📥 Print API called", { kitchenId });

    if (!kitchenId) {
      return res.status(400).json({
        success: false,
        message: "Kitchen ID is required",
      });
    }

    const kotItems = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          k.kot_id,
          k.order_id,
          k.item_name,
          k.qty,

          co.table_no,
          co.order_time,
          co.waiter_id,
          co.cutomertype,

          TRIM(u.firstname || ' ' || IFNULL(u.lastname, '')) AS waiter_name,
          ct.customer_type AS customer_type_name

        FROM kot_items k

        JOIN customer_order co
        ON k.order_id = co.order_id

        LEFT JOIN user u
        ON co.waiter_id = u.id

        LEFT JOIN customer_type ct
        ON co.cutomertype = ct.customer_type_id

        WHERE k.kitchen_id = ?
        AND k.printed = 0

        ORDER BY k.order_id ASC
        `,
        [kitchenId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        },
      );
    });

    if (!kotItems.length) {
      return res.json({
        success: false,
        message: "No pending KOT items",
      });
    }

    const printer = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT
          name AS printer_name,
          connection_type AS printer_type,
          path AS printer_path,
          port
        FROM printers
        WHERE business_id = ?
        LIMIT 1
        `,
        [kitchenId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        },
      );
    });

    if (!printer) {
      return res.status(500).json({
        success: false,
        message: "No printer configured for this kitchen",
      });
    }

    log("🖨 Printer loaded", printer);

    const orders = {};

    kotItems.forEach((item) => {
      if (!orders[item.order_id]) {
        orders[item.order_id] = {
          table: item.table_no || "-",
          time: item.order_time || "-",
          waiter_name: item.waiter_name || "-",
          customer_type: item.customer_type_name || "-",
          items: [],
        };
      }

      orders[item.order_id].items.push(item);
    });

    const html = buildKotHTML(orders);
    const rawText = buildRawText(orders);

    try {
      await printToPrinter(printer, html, rawText);
      log("✅ Print success");
    } catch (err) {
      console.log(err);
      log("❌ Print failed", err);

      return res.status(500).json({
        success: false,
        message: "Printing failed",
        error: err.message,
      });
    }

    await new Promise((resolve, reject) => {
      db.run(
        `
        UPDATE kot_items
        SET printed = 1
        WHERE kitchen_id = ?
        AND printed = 0
        `,
        [kitchenId],
        (err) => {
          if (err) return reject(err);
          resolve();
        },
      );
    });

    return res.json({
      success: true,
      message: "KOT printed successfully",
      kitchenId,
      printed_items: kotItems.length,
    });
  } catch (err) {
    console.log(err);
    log("❌ Fatal error", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

const testUsbPrint = async (req, res) => {
  try {
    const printer = createPrinterInstance({
      printer_type: "usb",
      printer_path: "usb://0x0471:0x8E00",
    });

    if (!printer) {
      return res.status(500).json({
        success: false,
        message: "Printer init failed",
      });
    }

    printer.alignCenter();
    printer.println("USB TEST SUCCESS");
    printer.drawLine();
    printer.println("Printer is working properly");
    printer.cut();

    let success;

    if (TEST_MODE) {
      console.log("🧪 TEST MODE: Fake print success");
      success = true;
    } else {
      success = await printer.execute();
    }

    return res.json({
      success,
      message: success ? "Printed successfully" : "Print failed",
    });
  } catch (err) {
    console.error("TEST PRINT ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const getKitchenKotList = async (req, res) => {
  try {
    const query = `
      SELECT 
        k.kot_id, 
        k.order_id,
        k.kitchen_id, 
        k.item_name,
        k.qty,
        k.status AS kitchen_status,
        k.accept_time,
        k.ready_time,
        co.table_no,
        rt.tablename,
        co.order_time,
        co.tokenno
      FROM kot_items k
      JOIN customer_order co ON k.order_id = co.order_id
      LEFT JOIN rest_table rt ON co.table_no = rt.tableid
      WHERE
        k.printed = 1
        AND COALESCE(k.status, '') NOT IN ('completed','rejected')
      ORDER BY k.order_id DESC
    `;

    db.all(query, [], (err, result) => {
      if (err) {
        console.error("SQLite error:", err);
        return res.status(500).json({ success: false });
      }

      const grouped = {};

      result.forEach((row) => {
        const key = `${row.order_id}_${row.kitchen_id}`;

        if (!grouped[key]) {
          grouped[key] = {
            order_id: row.order_id,
            kitchen_id: row.kitchen_id,
            table_no: row.table_no,
            table_name: row.tablename,
            tokenno: row.tokenno,
            items: [],
          };
        }

        grouped[key].items.push({
          id: row.kot_id,
          name: row.item_name,
          qty: row.qty,
          status: row.kitchen_status,
          accept_time: row.accept_time,
          ready_time: row.ready_time,
        });
      });

      const sortedData = Object.values(grouped).sort(
        (a, b) => b.order_id - a.order_id,
      );

      res.json({
        success: true,
        data: sortedData,
      });
    });
  } catch (e) {
    console.error("getKitchenKotList error:", e);
    res.status(500).json({ success: false });
  }
};

const getKitchenKotHistory = async (req, res) => {
  try {
    const query = `
      SELECT 
        k.kot_id,
        k.order_id,
        k.kitchen_id,
        k.item_name,
        k.qty,
        k.status AS item_status,
        k.accept_time,
        k.ready_time,
        k.reject_reason,
        co.table_no,
        rt.tablename,
        co.order_time,
        co.tokenno
      FROM kot_items k
      JOIN customer_order co ON k.order_id = co.order_id
      LEFT JOIN rest_table rt ON co.table_no = rt.tableid
      WHERE CAST(k.printed AS INTEGER) = 1
      ORDER BY k.order_id DESC
    `;

    db.all(query, [], (err, result) => {
      if (err) {
        console.error("SQLite error:", err);
        return res.status(500).json({ success: false });
      }

      const grouped = {};

      result.forEach((row) => {
        const key = `${row.order_id}_${row.kitchen_id}`;

        if (!grouped[key]) {
          grouped[key] = {
            order_id: row.order_id,
            kitchen_id: row.kitchen_id,
            table_no: row.table_no,
            table_name: row.tablename,
            tokenno: row.tokenno,
            order_time: row.order_time,
            items: [],
          };
        }

        grouped[key].items.push({
          id: row.kot_id,
          name: row.item_name,
          qty: row.qty,
          status: row.item_status || "pending",
          accept_time: row.accept_time,
          ready_time: row.ready_time,
          reject_reason: row.reject_reason,
        });
      });

      const sortedData = Object.values(grouped).sort(
        (a, b) => b.order_id - a.order_id,
      );

      res.json({
        success: true,
        data: sortedData,
      });
    });
  } catch (e) {
    console.error("getKitchenKotHistory error:", e);
    res.status(500).json({ success: false });
  }
};
const acceptKitchenOrder = async (req, res) => {
  try {
    const { order_id, kitchen_id, item_ids } = req.body;

    if (
      !order_id ||
      !kitchen_id ||
      !Array.isArray(item_ids) ||
      !item_ids.length
    ) {
      return res.status(400).json({ message: "Missing data" });
    }

    const placeholders = item_ids.map(() => "?").join(",");

    await new Promise((resolve, reject) => {
      db.run(
        `
        UPDATE kot_items
        SET status = 'accepted',
            accept_time = DATETIME('now')
        WHERE order_id = ?
          AND kitchen_id = ?
          AND kot_id IN (${placeholders})
        `,
        [order_id, kitchen_id, ...item_ids],
        (err) => (err ? reject(err) : resolve()),
      );
    });

    res.json({ success: true, message: "Selected items accepted" });
  } catch (err) {
    console.error("❌ ACCEPT ERROR:", err);
    res.status(500).json({ message: "Internal error" });
  }
};

const completeKitchenOrder = async (req, res) => {
  try {
    const { order_id, kitchen_id, item_ids } = req.body;

    if (
      !order_id ||
      !kitchen_id ||
      !Array.isArray(item_ids) ||
      !item_ids.length
    ) {
      return res.status(400).json({ message: "Missing data" });
    }

    const placeholders = item_ids.map(() => "?").join(",");

    // 1. Mark selected items completed
    await new Promise((resolve, reject) => {
      db.run(
        `
        UPDATE kot_items
        SET status = 'completed',
            ready_time = DATETIME('now')
        WHERE order_id = ?
          AND kitchen_id = ?
          AND kot_id IN (${placeholders})
        `,
        [order_id, kitchen_id, ...item_ids],
        (err) => (err ? reject(err) : resolve()),
      );
    });

    // 2. Check if any pending items remain
    const pending = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT COUNT(*) AS pending 
        FROM kot_items 
        WHERE order_id = ?
          AND status != 'completed'
        `,
        [order_id],
        (err, row) => (err ? reject(err) : resolve(row.pending)),
      );
    });

    // 3. If all completed → update order
    if (pending === 0) {
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE customer_order SET status = 'completed' WHERE order_id = ?`,
          [order_id],
          (err) => (err ? reject(err) : resolve()),
        );
      });
    }

    res.json({
      success: true,
      message: pending === 0 ? "Order fully completed" : "Partial completed",
    });
  } catch (err) {
    console.error("❌ COMPLETE ERROR:", err);
    res.status(500).json({ message: "Internal error" });
  }
};

const rejectKitchenOrder = async (req, res) => {
  try {
    const { order_id, kitchen_id, reason } = req.body;

    if (!order_id || !kitchen_id || !reason) {
      return res.status(400).json({ message: "Missing required data" });
    }

    // 1. Update kot_items
    await new Promise((resolve, reject) => {
      db.run(
        `
        UPDATE kot_items
        SET status = 'rejected',
            reject_reason = ?
        WHERE order_id = ? AND kitchen_id = ?
        `,
        [reason, order_id, kitchen_id],
        (err) => (err ? reject(err) : resolve()),
      );
    });

    // 2. Update customer_order
    await new Promise((resolve, reject) => {
      db.run(
        `
        UPDATE customer_order
        SET status = 'rejected'
        WHERE order_id = ?
        `,
        [order_id],
        (err) => (err ? reject(err) : resolve()),
      );
    });

    return res.json({
      success: true,
      message: "Order rejected by kitchen",
    });
  } catch (err) {
    console.error("❌ REJECT ERROR:", err);
    res.status(500).json({ message: "Internal error" });
  }
};

module.exports = {
  testUsbPrint,
  printOrderToKitchens,
  getKitchenKotList,
  acceptKitchenOrder,
  rejectKitchenOrder,
  completeKitchenOrder,
  getKitchenKotHistory,
};
