const db = require("../utils/db");
const { v4: uuidv4 } = require("uuid");

const resolveCreatorId = (userId) =>
  new Promise((resolve, reject) => {
    db.get("SELECT is_admin, created_by FROM user WHERE id = ?", [userId], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      resolve(Number(row.is_admin) === 1 ? userId : row.created_by);
    });
  });

// const createTable = async (req, res) => {
//   try {
//     const userId = req.id;

//     const { tablename, person_capicity, floorName } = req.body;

//     const uuid = uuidv4();

//     const query = `
//       INSERT INTO rest_table 
//       (
//         uuid,
//         tablename,
//         person_capicity,
//         floor,
//         status,
//         table_icon,
//         created_by,
//         occupied_seats,
//         synced,
//         updated_at
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
//     `;

//     const values = [
//       uuid,
//       tablename,
//       person_capicity,
//       floorName,
//       "free",
//       "default.png",
//       userId,
//       0,
//       0,
//     ];

//     db.run(query, values, function (err) {
//       if (err) {
//         console.error(err);

//         return res.status(500).json({
//           success: false,
//           message: err.message,
//         });
//       }

//       res.json({
//         success: true,
//         message: "Table created",
//         tableId: this.lastID,
//         uuid,
//       });
//     });
//   } catch (err) {
//     console.log(err);

//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

const createTable = async (req, res) => {
  try {
    const user_id = req.id;
    const { tablename, person_capicity, floorName } = req.body;

    const uuid = uuidv4();

    // Step 1: Check subscription
    db.get(
      "SELECT * FROM superadmin_user_plans WHERE user_id = ?",
      [user_id],
      (err, subscription) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
          });
        }

        if (subscription) {
          return insertTable(
            uuid,
            tablename,
            person_capicity,
            floorName,
            subscription.user_id,
            res
          );
        }

        // Step 2: Check creator
        db.get(
          "SELECT created_by FROM user WHERE id = ?",
          [user_id],
          (err, user) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "Database error",
                error: err.message,
              });
            }

            if (!user || !user.created_by) {
              return res.status(403).json({
                success: false,
                message: "You are not authorized to create a table.",
              });
            }

            const created_by = user.created_by;

            // Step 3: Check creator subscription
            db.get(
              "SELECT * FROM superadmin_user_plans WHERE user_id = ?",
              [created_by],
              (err, creatorSubscription) => {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: "Database error",
                    error: err.message,
                  });
                }

                if (!creatorSubscription) {
                  return res.status(403).json({
                    success: false,
                    message:
                      "Creator does not have an active subscription.",
                  });
                }

                return insertTable(
                  uuid,
                  tablename,
                  person_capicity,
                  floorName,
                  created_by,
                  res
                );
              }
            );
          }
        );
      }
    );
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

function insertTable(
  uuid,
  tablename,
  person_capicity,
  floorName,
  created_by,
  res
) {
  const query = `
    INSERT INTO rest_table
    (
      uuid,
      tablename,
      person_capicity,
      floor,
      status,
      table_icon,
      created_by,
      occupied_seats,
      synced,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;

  const values = [
    uuid,
    tablename,
    person_capicity,
    floorName,
    "free",
    "default.png",
    created_by,
    0,
    0,
  ];

  db.run(query, values, function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    return res.json({
      success: true,
      message: "Table created",
      tableId: this.lastID,
      uuid,
    });
  });
}

const getStatus = (occupied, capacity) => {
  if (occupied >= capacity) return "booked";
  if (occupied > 0) return "partial";
  return "free";
};

const getTables = async (req, res) => {
  try {
    const id = req.id;
    const { searchItem } = req.query;

    const checkUserQuery = `
      SELECT created_by, is_admin 
      FROM user 
      WHERE id = ?
    `;

    db.get(checkUserQuery, [id], (err, userData) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isAdmin = userData.is_admin;
      const created_by = userData.created_by;

      let ownerId;

      if (isAdmin === 1) {
        ownerId = id;
      } else {
        if (!created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to view tables",
          });
        }

        ownerId = created_by;
      }

      let query = `
        SELECT * FROM rest_table
        WHERE created_by = ?
      `;

      let params = [ownerId];

      if (searchItem && searchItem.trim() !== "") {
        query += `
          AND (tablename LIKE ? OR person_capicity LIKE ?)
        `;
        const s = `%${searchItem}%`;
        params.push(s, s);
      }

      query += ` ORDER BY tableid DESC`;

      db.all(query, params, (err, results) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error fetching tables",
            error: err.message,
          });
        }

        const updated = results.map((t) => {
          const status = getStatus(t.occupied_seats, t.person_capicity);

          return {
            ...t,
            status,
            remaining:
              Number(t.person_capicity || 0) - Number(t.occupied_seats || 0),
          };
        });

        return res.json({
          success: true,
          data: updated,
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred",
    });
  }
};

const getBookedTable = async (req, res) => {
  try {
    const creatorId = await resolveCreatorId(req.id);
    if (!creatorId) return res.status(403).json({ success: false, message: "You are not authorized" });

    const query = `
      SELECT
        tableid,
        tablename,
        person_capicity,
        occupied_seats,
        floor,
        (person_capicity - occupied_seats) AS remaining
      FROM rest_table
      WHERE occupied_seats >= person_capicity AND created_by = ?
    `;

    db.all(query, [creatorId], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "An error occurred while retrieving booked tables" });
      }
      res.status(200).json({ success: true, data: results.map((t) => ({ ...t, status: "booked" })) });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getunBookedTable = async (req, res) => {
  try {
    const creatorId = await resolveCreatorId(req.id);
    if (!creatorId) return res.status(403).json({ success: false, message: "You are not authorized" });

    const query = `
      SELECT
        tableid,
        tablename,
        person_capicity,
        occupied_seats,
        floor,
        (person_capicity - occupied_seats) AS remaining
      FROM rest_table
      WHERE occupied_seats = 0 AND created_by = ?
    `;

    db.all(query, [creatorId], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "An error occurred while retrieving free tables" });
      }
      res.status(200).json({ success: true, data: results.map((t) => ({ ...t, status: "free" })) });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getPartialTables = async (req, res) => {
  try {
    const query = `
      SELECT 
        tableid,
        tablename,
        person_capicity,
        occupied_seats,
        floor,
        (person_capicity - occupied_seats) AS remaining
      FROM rest_table
      WHERE occupied_seats > 0
        AND occupied_seats < person_capicity
    `;

    db.all(query, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: "Error retrieving partial tables",
        });
      }

      res.status(200).json({
        success: true,
        data: results.map((t) => ({
          ...t,
          status: "partial",
        })),
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const cleartable = async (req, res) => {
  try {
    const tableId = req.params.tableId;
    const creatorId = await resolveCreatorId(req.id);
    if (!creatorId) return res.status(403).json({ success: false, message: "You are not authorized" });

    db.run(
      "UPDATE rest_table SET occupied_seats = 0, status = 'free' WHERE tableid = ? AND created_by = ?",
      [tableId, creatorId],
      (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, message: "Table cleared" });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteTable = async (req, res) => {
  try {
    const tableId = req.params.id;
    const creatorId = await resolveCreatorId(req.id);
    if (!creatorId) return res.status(403).json({ success: false, message: "You are not authorized" });

    db.run("DELETE FROM rest_table WHERE tableid = ? AND created_by = ?", [tableId, creatorId], function (err) {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "An error occurred" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: "Table not found" });
      }
      res.status(200).json({ success: true, message: "Table deleted successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

const getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Table ID is required" });

    const creatorId = await resolveCreatorId(req.id);
    if (!creatorId) return res.status(403).json({ success: false, message: "You are not authorized" });

    db.get(
      "SELECT tableid, tablename, person_capicity, status, floor FROM rest_table WHERE tableid = ? AND created_by = ?",
      [id, creatorId],
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ success: false, message: "An error occurred while retrieving the table" });
        }
        if (!result) {
          return res.status(404).json({ success: false, message: "Table not found" });
        }
        res.status(200).json({
          success: true,
          data: { ...result, status: result.status === 1 ? "booked" : "free" },
          message: "Table fetched successfully",
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

//update table
const updateTable = async (req, res) => {
  try {
    const { tableid } = req.params;
    const { tablename, person_capicity, floorName } = req.body;

    const creatorId = await resolveCreatorId(req.id);
    if (!creatorId) return res.status(403).json({ success: false, message: "You are not authorized" });

    db.get("SELECT * FROM rest_table WHERE tableid = ? AND created_by = ?", [tableid, creatorId], (err, current) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false });
      }
      if (!current) {
        return res.status(404).json({ success: false, message: "Table not found" });
      }

      const newCapacity = person_capicity !== undefined ? person_capicity : current.person_capicity;
      const newOccupied = current.occupied_seats || 0;

      let newStatus = "free";
      if (newOccupied >= newCapacity) newStatus = "booked";
      else if (newOccupied > 0) newStatus = "partial";

      db.run(
        "UPDATE rest_table SET tablename = ?, person_capicity = ?, floor = ?, status = ? WHERE tableid = ? AND created_by = ?",
        [tablename ?? current.tablename, newCapacity, floorName ?? current.floor, newStatus, tableid, creatorId],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ success: false });
          }
          return res.json({ success: true, message: "Table updated successfully" });
        },
      );
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
};

module.exports = {
  createTable,
  getTables,
  cleartable,
  getBookedTable,
  getunBookedTable,
  deleteTable,
  getTableById,
  updateTable,
  getPartialTables,
};
