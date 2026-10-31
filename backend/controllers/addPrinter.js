const db = require("../utils/db");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

// Label describing how Windows reaches the printer, shown next to each detected
// printer. Informational only — printing still routes on connection_type
// ("network" = direct socket to the IP, "windows" = Windows spooler).
const describeConnection = (portName, hostAddress) => {
  const port = String(portName || "").toUpperCase();

  if (hostAddress) return "Network";
  if (port.startsWith("USB")) return "USB";
  if (port.startsWith("BTH") || port.includes("BLUETOOTH")) return "Bluetooth";
  if (port.startsWith("WSD")) return "Network";
  if (port.startsWith("LPT") || port.startsWith("COM")) return "Local Port";
  if (["NUL:", "PORTPROMPT:", "SHRFAX:", "FILE:"].includes(port)) return "Virtual";
  if (port.startsWith("\\\\")) return "Shared";

  return "Other";
};

// Reads each installed Windows printer's actual port (Get-Printer + Get-PrinterPort)
// instead of just its name, so a Standard TCP/IP port's real host/IP can be
// surfaced as a Network printer — everything else (USB, Bluetooth, virtual
// drivers) is still spooler-routed in Windows, so it stays type "windows".
const detectSystemPrinters = (req, res) => {
  try {
    const tempDir = path.join(process.cwd(), "temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const scriptPath = path.join(tempDir, "detect_printers.ps1");

    const script = `
$printers = @()
Get-Printer | ForEach-Object {
    $p = $_
    $portInfo = Get-PrinterPort -Name $p.PortName -ErrorAction SilentlyContinue
    $printers += [PSCustomObject]@{
        Name        = $p.Name
        PortName    = $p.PortName
        HostAddress = $portInfo.PrinterHostAddress
    }
}
$printers | ConvertTo-Json -Compress
`;

    fs.writeFileSync(scriptPath, script, "utf8");

    execFile(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
      (error, stdout) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: "Failed to detect system printers",
            error: error.message,
          });
        }

        let parsed;
        try {
          parsed = JSON.parse(stdout.trim() || "[]");
        } catch (parseErr) {
          return res.status(500).json({
            success: false,
            message: "Failed to parse detected printer data",
            error: parseErr.message,
          });
        }

        if (!Array.isArray(parsed)) parsed = [parsed];

        const data = parsed
          .filter((p) => p && p.Name)
          .map((p) => {
            const host = (p.HostAddress || "").toString().trim();
            const isNetwork = host.length > 0;
            const type = isNetwork ? "network" : "windows";
            const printerPath = isNetwork ? host : p.Name;

            return {
              name: p.Name,
              connection_type: type,
              detected_connection: describeConnection(p.PortName, host),
              path: printerPath,
              port: p.PortName || null,

              printer_name: p.Name,
              printer_type: type,
              printer_path: printerPath,
              printer_port: p.PortName || null,
            };
          });

        return res.status(200).json({
          success: true,
          data,
          message: "Printers detected successfully",
        });
      },
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to detect system printers",
      error: error.message,
    });
  }
};

// const addPrinter = (req, res) => {
//   try {
//     const { printer_name, printer_type, printer_path, kitchen_id } = req.body;
//     const user_id = req.id;

//     // 1. Auth validation
//     if (!user_id) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized user",
//       });
//     }

//     // 2. Basic validation
//     if (!printer_name || !printer_type || !printer_path || !kitchen_id) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     // 3. Allow only valid types
//     const allowedTypes = ["windows", "network"];

//     if (!allowedTypes.includes(printer_type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid printer type. Use windows or network only",
//       });
//     }

//     // 4. Type-specific validation
//     if (printer_type === "network") {
//       const ipRegex =
//         /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

//       if (!ipRegex.test(printer_path)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid IP address format",
//         });
//       }
//     }

//     if (printer_type === "windows") {
//       if (printer_path.length < 3) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid printer name",
//         });
//       }
//     }

//     // Step 1: Check if current user has subscription
//     const checkSubscriptionQuery = `
//       SELECT * FROM superadmin_user_plans
//       WHERE user_id = ?
//     `;

//     db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
//       if (err) {
//         console.error("Subscription check error:", err);
//         return res.status(500).json({
//           success: false,
//           message: "Database error",
//           error: err.message,
//         });
//       }

//       if (subscription) {
//         return insertPrinter(user_id);
//       }

//       // Step 2: Check created_by
//       const checkCreatedByQuery = `
//         SELECT created_by FROM user
//         WHERE id = ?
//       `;

//       db.get(checkCreatedByQuery, [user_id], (err, userData) => {
//         if (err) {
//           console.error("Created by check error:", err);
//           return res.status(500).json({
//             success: false,
//             message: "Database error",
//             error: err.message,
//           });
//         }

//         if (!userData || !userData.created_by) {
//           return res.status(403).json({
//             success: false,
//             message: "You are not authorized to add printer",
//           });
//         }

//         const created_by = userData.created_by;

//         // Step 3: Check creator subscription
//         db.get(
//           checkSubscriptionQuery,
//           [created_by],
//           (err, creatorSubscription) => {
//             if (err) {
//               console.error("Creator subscription check error:", err);
//               return res.status(500).json({
//                 success: false,
//                 message: "Database error",
//                 error: err.message,
//               });
//             }

//             if (creatorSubscription) {
//               return insertPrinter(created_by);
//             }

//             return res.status(403).json({
//               success: false,
//               message: "Creator does not have an active subscription",
//             });
//           },
//         );
//       });
//     });

//     // Insert Printer
//     function insertPrinter(createdBy) {
//       // Check if kitchen already has printer under same created_by
//       db.get(
//         `
//           SELECT id FROM printers
//           WHERE business_id = ? AND created_by = ?
//         `,
//         [kitchen_id, createdBy],
//         (err, existing) => {
//           if (err) {
//             console.error("DB error:", err);
//             return res.status(500).json({
//               success: false,
//               message: "Database error",
//               error: err.message,
//             });
//           }

//           if (existing) {
//             return res.status(400).json({
//               success: false,
//               message: "This kitchen already has a printer assigned",
//             });
//           }

//           const sql = `
//             INSERT INTO printers
//             (name, connection_type, path, business_id, created_by)
//             VALUES (?, ?, ?, ?, ?)
//           `;

//           db.run(
//             sql,
//             [printer_name, printer_type, printer_path, kitchen_id, createdBy],
//             function (err) {
//               if (err) {
//                 console.error("Insert error:", err);
//                 return res.status(500).json({
//                   success: false,
//                   message: "Failed to add printer",
//                   error: err.message,
//                 });
//               }

//               return res.status(201).json({
//                 success: true,
//                 message: "Printer added successfully",
//                 id: this.lastID,
//               });
//             },
//           );
//         },
//       );
//     }
//   } catch (error) {
//     console.error("Backend Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "An error occurred on the server",
//       error: error.message,
//     });
//   }
// };

const addPrinter = (req, res) => {
  try {
    const {
      printer_name,
      printer_type,
      printer_path,
      kitchen_id,
      port = 9100,
    } = req.body;

    const user_id = req.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!printer_name || !printer_type || !printer_path || !kitchen_id) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const allowedTypes = ["windows", "network", "usb"];

    if (!allowedTypes.includes(printer_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid printer type. Use windows, usb or network only",
      });
    }

    if (printer_type === "network") {
      const ipRegex =
        /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

      if (!ipRegex.test(printer_path)) {
        return res.status(400).json({
          success: false,
          message: "Invalid IP address format",
        });
      }
    }

    if (printer_type === "windows" || printer_type === "usb") {
      if (printer_name.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Invalid printer name",
        });
      }
    }

    const checkSubscriptionQuery = `
      SELECT * FROM superadmin_user_plans 
      WHERE user_id = ?
    `;

    db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      if (subscription) {
        return insertPrinter(user_id);
      }

      const checkCreatedByQuery = `
        SELECT created_by FROM user 
        WHERE id = ?
      `;

      db.get(checkCreatedByQuery, [user_id], (err, userData) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
          });
        }

        if (!userData || !userData.created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to add printer",
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
                message: "Database error",
                error: err.message,
              });
            }

            if (creatorSubscription) {
              return insertPrinter(created_by);
            }

            return res.status(403).json({
              success: false,
              message: "Creator does not have an active subscription",
            });
          },
        );
      });
    });

    function insertPrinter(createdBy) {
      db.get(
        `
          SELECT id FROM printers 
          WHERE business_id = ? AND created_by = ?
        `,
        [kitchen_id, createdBy],
        (err, existing) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Database error",
              error: err.message,
            });
          }

          if (existing) {
            return res.status(400).json({
              success: false,
              message: "This kitchen already has a printer assigned",
            });
          }

          const sql = `
            INSERT INTO printers 
            (name, connection_type, path, business_id, created_by, port)
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          db.run(
            sql,
            [
              printer_name.trim(),
              printer_type,
              printer_path.trim(),
              kitchen_id,
              createdBy,
              printer_type === "network" ? port : null,
            ],
            function (err) {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: "Failed to add printer",
                  error: err.message,
                });
              }

              return res.status(201).json({
                success: true,
                message: "Printer added successfully",
                id: this.lastID,
              });
            },
          );
        },
      );
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred on the server",
      error: error.message,
    });
  }
};

const getPrinter = (req, res) => {
  try {
    const { searchItem } = req.query;
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // Step 1: Get user role and creator
    const userQuery = `
      SELECT is_admin, created_by 
      FROM user 
      WHERE id = ?
    `;

    db.get(userQuery, [userId], (err, userData) => {
      if (err) {
        console.error("User fetch error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error while fetching user info",
          error: err.message,
        });
      }

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const { is_admin, created_by } = userData;
      const creatorId = is_admin === 1 ? userId : created_by;

      if (!creatorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to view printers",
        });
      }

      let sql = `
        SELECT 
          p.id,
          p.name AS printer_name,
          p.connection_type AS printer_type,
          p.path AS printer_path,
          p.business_id AS kitchen_id,
          p.created_by,
          p.created_at,
          k.kitchen_name
        FROM printers p
        LEFT JOIN kitchens k ON p.business_id = k.id
        WHERE p.created_by = ?
      `;

      let params = [creatorId];

      if (searchItem && searchItem.trim() !== "") {
        const search = `%${searchItem.trim()}%`;

        sql += `
          AND (
            p.name LIKE ? OR
            p.connection_type LIKE ? OR
            p.path LIKE ? OR
            k.kitchen_name LIKE ?
          )
        `;

        params.push(search, search, search, search);
      }

      sql += ` ORDER BY p.id DESC`;

      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error("SQLite error:", err);
          return res.status(500).json({
            success: false,
            message: "DB error",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          data: rows || [],
          message: "Printers fetched successfully",
        });
      });
    });
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred on the server",
      error: error.message,
    });
  }
};

const getPrinterById = (req, res) => {
  const printerId = Number(req.params.id);

  if (!printerId || isNaN(printerId)) {
    return res.status(400).json({ message: "Invalid printer ID" });
  }

  const sql = `
    SELECT
      p.id,
      p.name AS printer_name,
      p.connection_type AS printer_type,
      p.path AS printer_path,
      p.business_id AS kitchen_id,
      p.created_by,
      p.created_at,
      k.kitchen_name
    FROM printers p
    LEFT JOIN kitchens k ON p.business_id = k.id
    WHERE p.id = ?
  `;

  db.get(sql, [printerId], (err, result) => {
    if (err) {
      console.error("❌ DB Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!result) {
      return res.status(404).json({ message: "Printer not found" });
    }

    return res.status(200).json({
      success: true,
      printer: result,
    });
  });
};
const updatePrinter = (req, res) => {
  const printerId = Number(req.params.id);
  const { printer_name, printer_type, printer_path, kitchen_id } = req.body;

  if (!printerId || isNaN(printerId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid printer ID",
    });
  }

  // 1️⃣ Basic validation
  if (!printer_name || !printer_type || !printer_path || !kitchen_id) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  // 2️⃣ Allowed printer types
  const allowedTypes = ["windows", "network"];
  if (!allowedTypes.includes(printer_type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid printer type. Use windows or network only",
    });
  }

  // 3️⃣ Type-specific validation
  if (printer_type === "network") {
    const ipRegex =
      /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

    if (!ipRegex.test(printer_path)) {
      return res.status(400).json({
        success: false,
        message: "Invalid IP address format",
      });
    }
  }

  if (printer_type === "windows" && printer_path.length < 3) {
    return res.status(400).json({
      success: false,
      message: "Invalid printer name",
    });
  }

  // 4️⃣ Prevent same kitchen being reused
  db.all(
    `SELECT id FROM printers WHERE business_id = ? AND id != ?`,
    [kitchen_id, printerId],
    (err, existing) => {
      if (err) {
        console.error("❌ DB Error:", err);
        return res.status(500).json({ success: false });
      }

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "This kitchen already has another printer assigned",
        });
      }

      // 5️⃣ Safe update
      const updateQuery = `
        UPDATE printers
        SET name = ?, connection_type = ?, path = ?, business_id = ?
        WHERE id = ?
      `;

      db.run(
        updateQuery,
        [printer_name, printer_type, printer_path, kitchen_id, printerId],
        function (err) {
          if (err) {
            console.error("❌ Update error:", err);
            return res.status(500).json({
              success: false,
              message: "Database error",
            });
          }

          if (this.changes === 0) {
            return res.status(404).json({
              success: false,
              message: "Printer not found",
            });
          }

          res.status(200).json({
            success: true,
            message: "Printer updated successfully",
          });
        },
      );
    },
  );
};

const deletePrinter = async (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM printers WHERE id = ?`;
  db.run(sql, [id], (err, data) => {
    if (err) {
      return res
        .status(500)
        .send({ error: "Unable to delete data", details: err });
    }
    return res.status(200).send("Printer deleted successfully");
  });
};

module.exports = {
  addPrinter,
  getPrinter,
  detectSystemPrinters,
  deletePrinter,
  getPrinterById,
  updatePrinter,
};
