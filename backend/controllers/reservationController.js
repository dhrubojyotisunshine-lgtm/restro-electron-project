const db = require("../utils/db");

const queryDb = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const createUnavailability = async (req, res) => {
  try {
    const { offdaydate, start_time, end_time, is_active } = req.body;
    const userId = req.id;

    const availtime = `${start_time} - ${end_time}`;

    const [userResult] = await queryDb(
      "SELECT is_admin, created_by FROM user WHERE id = ?",
      [userId],
    );

    if (!userResult) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { is_admin, created_by } = userResult;
    const creatorId = Number(is_admin) === 1 ? userId : created_by;

    if (!creatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create unavailability",
      });
    }

    const sql = `
      INSERT INTO reservationofday 
      (offdaydate, availtime, is_active, created_by)
      VALUES (?, ?, ?, ?)
    `;

    await queryDb(sql, [offdaydate, availtime, String(is_active), creatorId]);

    return res.status(201).json({
      success: true,
      message: "Successfully created",
    });
  } catch (err) {
    console.error("Error in createUnavailability:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while creating unavailability",
    });
  }
};

const getUnavailability = async (req, res) => {
  try {
    const { searchItem } = req.query;
    const userId = req.id;

    const [userResult] = await queryDb(
      "SELECT is_admin, created_by FROM user WHERE id = ?",
      [userId],
    );

    if (!userResult) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { is_admin, created_by } = userResult;
    const creatorId = Number(is_admin) === 1 ? userId : created_by;

    if (!creatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view unavailability",
      });
    }

    let getReservationsQuery = `
      SELECT *
      FROM reservationofday
      WHERE created_by = ?
    `;

    const queryParams = [creatorId];

    if (searchItem && searchItem.trim() !== "") {
      const searchQuery = `%${searchItem}%`;

      getReservationsQuery += `
        AND (
          offdaydate LIKE ?
          OR availtime LIKE ?
        )
      `;

      queryParams.push(searchQuery, searchQuery);
    }

    getReservationsQuery += ` ORDER BY offdayid DESC`;

    const result = await queryDb(getReservationsQuery, queryParams);

    return res.status(200).json({
      success: true,
      data: result,
      message: "Unavailable data fetched successfully",
    });
  } catch (error) {
    console.error("Error in getUnavailability:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching reservations",
    });
  }
};

// const updateUnavailability = (req, res) => {
//   const { id } = req.params;
//   const { offdaydate, availtime, is_active, created_by } = req.body;

//   if (!id) {
//     return res.status(400).json({ success: false, message: "Missing ID parameter" });
//   }

//   const fetchCurrentDataSql = "SELECT * FROM reservationofday WHERE offdayid = ?";

//   db.get(fetchCurrentDataSql, [id], (fetchErr, currentData) => {
//     if (fetchErr) {
//       console.error("Database fetch error:", fetchErr);
//       return res.status(500).json({ success: false, message: "Internal Server Error" });
//     }

//     if (!currentData) {
//       return res.status(404).json({ success: false, message: "Reservation record not found" });
//     }

//     const finalAvailtime =
//     start_time && end_time ? `${start_time} - ${end_time}` : (availtime ?? currentData.availtime);

//     const updatedData = {
//       offdaydate: offdaydate ?? currentData.offdaydate,
//       availtime: finalAvailtime,
//       is_active: is_active ?? currentData.is_active,
//       created_by: created_by ?? currentData.created_by
//     };

//     const updateSql = `
//       UPDATE reservationofday
//       SET offdaydate = ?, availtime = ?, is_active = ?, created_by = ?
//       WHERE offdayid = ?`;

//     console.log("Final SQL Params:", [
//       updatedData.offdaydate,
//       updatedData.availtime,
//       updatedData.is_active,
//       updatedData.created_by,
//       id,
//     ]);

//     db.run(
//       updateSql,
//       [
//         updatedData.offdaydate,
//         updatedData.availtime,
//         updatedData.is_active,
//         updatedData.created_by,
//         id,
//       ],
//       function (updateErr) {
//         if (updateErr) {
//           console.error("Database update error:", updateErr);
//           return res.status(500).json({
//             success: false,
//             message: "An error occurred while updating the reservation",
//           });
//         }

//         console.log("Rows updated:", this.changes);
//         res.status(200).json({
//           success: true,
//           message: "Reservation updated successfully",
//         });
//       }
//     );
//   });
// };

const updateUnavailability = async (req, res) => {
  const { id } = req.params;
  const userId = req.id;
  const { offdaydate, start_time, end_time, availtime, is_active } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Missing ID parameter" });
  }

  try {
    const [userResult] = await queryDb("SELECT is_admin, created_by FROM user WHERE id = ?", [userId]);

    if (!userResult) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const creatorId = Number(userResult.is_admin) === 1 ? userId : userResult.created_by;

    if (!creatorId) {
      return res.status(403).json({ success: false, message: "You are not authorized" });
    }

    db.get(
      "SELECT * FROM reservationofday WHERE offdayid = ? AND created_by = ?",
      [id, creatorId],
      (fetchErr, currentData) => {
        if (fetchErr) {
          console.error("Database fetch error:", fetchErr);
          return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        if (!currentData) {
          return res.status(404).json({ success: false, message: "Reservation record not found" });
        }

        const finalAvailtime =
          start_time && end_time
            ? `${start_time} - ${end_time}`
            : availtime || currentData.availtime;

        const updateSql = `
          UPDATE reservationofday
          SET offdaydate = ?, availtime = ?, is_active = ?
          WHERE offdayid = ? AND created_by = ?`;

        db.run(
          updateSql,
          [
            offdaydate ?? currentData.offdaydate,
            finalAvailtime,
            is_active ?? currentData.is_active,
            id,
            creatorId,
          ],
          function (updateErr) {
            if (updateErr) {
              console.error("Database update error:", updateErr);
              return res.status(500).json({ success: false, message: "An error occurred while updating the reservation" });
            }

            res.status(200).json({ success: true, message: "Reservation updated successfully" });
          }
        );
      }
    );
  } catch (error) {
    console.error("Error in updateUnavailability:", error);
    return res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};

const getUnavailabilitybyid = async (req, res) => {
  const { id } = req.params;
  const userId = req.id;

  if (!id) {
    return res.status(400).json({ success: false, message: "Missing required parameter: id" });
  }

  try {
    const [userResult] = await queryDb("SELECT is_admin, created_by FROM user WHERE id = ?", [userId]);

    if (!userResult) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const creatorId = Number(userResult.is_admin) === 1 ? userId : userResult.created_by;

    if (!creatorId) {
      return res.status(403).json({ success: false, message: "You are not authorized" });
    }

    db.get(
      `SELECT * FROM reservationofday WHERE offdayid = ? AND created_by = ?`,
      [id, creatorId],
      (err, result) => {
        if (err) {
          console.error("Error fetching reservation:", err);
          return res.status(500).json({ success: false, message: "An error occurred while fetching reservations" });
        }

        if (!result) {
          return res.status(404).json({ success: false, message: `No reservation found for id ${id}` });
        }

        return res.status(200).json({ success: true, data: result, message: "Reservation fetched successfully" });
      }
    );
  } catch (error) {
    console.error("Error in getUnavailabilitybyid:", error);
    return res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};

const createReservation = (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_mobile,
    tablename,
    person_capacity,
    formtime,
    totime,
    reserveday,
  } = req.body;

  const user_id = req.id;

  if (
    !customer_name ||
    !customer_email ||
    !customer_mobile ||
    !tablename ||
    !person_capacity ||
    !formtime ||
    !totime ||
    !reserveday
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  // STEP 1: Check User Subscription
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
        proceedToCreateReservation(user_id);
      } else {
        // STEP 2: Check created_by
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
                message: "Not authorized to create reservation",
              });
            }

            const created_by = user.created_by;

            // STEP 3: Check Creator Subscription
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
                    message: "Creator has no active subscription",
                  });
                }

                proceedToCreateReservation(created_by);
              },
            );
          },
        );
      }
    },
  );

  // MAIN RESERVATION LOGIC
  function proceedToCreateReservation(created_by) {
    // STEP 4: Check Duplicate Customer
    db.get(
      `SELECT * FROM customer_info
       WHERE customer_email = ?
       OR customer_phone = ?`,
      [customer_email, customer_mobile],
      (err, existingCustomer) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
          });
        }

        if (existingCustomer) {
          return res.status(400).json({
            success: false,
            message: "Customer email or mobile already exists",
          });
        }

        // STEP 5: Insert Customer
        const customerInfoSql = `
          INSERT INTO customer_info
          (customer_name, customer_email, customer_phone)
          VALUES (?, ?, ?)
        `;

        db.run(
          customerInfoSql,
          [customer_name, customer_email, customer_mobile],
          function (err) {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "Failed to create customer",
                error: err.message,
              });
            }

            const customer_id = this.lastID;

            // STEP 6: Get Table
            db.get(
              `SELECT tableid
               FROM rest_table
               WHERE tablename = ?
               AND created_by = ?`,
              [tablename, created_by],
              (err, tableResult) => {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: "Database error",
                    error: err.message,
                  });
                }

                if (!tableResult) {
                  return res.status(404).json({
                    success: false,
                    message: "Table not found",
                  });
                }

                const tableid = tableResult.tableid;

                // STEP 7: Check Time Slot Clash
                db.all(
                  `
                  SELECT *
                  FROM tblreservation
                  WHERE tableid = ?
                  AND reserveday = ?
                  AND status = 1
                  AND NOT (
                    totime <= ?
                    OR formtime >= ?
                  )
                  `,
                  [tableid, reserveday, formtime, totime],
                  (err, clashResults) => {
                    if (err) {
                      return res.status(500).json({
                        success: false,
                        message: "Database error",
                        error: err.message,
                      });
                    }

                    if (clashResults.length > 0) {
                      return res.status(400).json({
                        success: false,
                        message: "Table already booked for selected time slot",
                      });
                    }

                    // STEP 8: Insert Reservation
                    const reservationSql = `
                      INSERT INTO tblreservation
                      (
                        cid,
                        tableid,
                        person_capicity,
                        formtime,
                        totime,
                        reserveday,
                        status,
                        created_by
                      )
                      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
                    `;

                    db.run(
                      reservationSql,
                      [
                        customer_id,
                        tableid,
                        person_capacity,
                        formtime,
                        totime,
                        reserveday,
                        created_by,
                      ],
                      function (err) {
                        if (err) {
                          return res.status(500).json({
                            success: false,
                            message: "Failed to create reservation",
                            error: err.message,
                          });
                        }

                        return res.status(201).json({
                          success: true,
                          message: "Reservation created successfully",
                          data: {
                            reserveid: this.lastID,
                            customer_id,
                            tableid,
                            tablename,
                            person_capacity,
                            formtime,
                            totime,
                            reserveday,
                            created_by,
                          },
                        });
                      },
                    );
                  },
                );
              },
            );
          },
        );
      },
    );
  }
};

const deleteUnavailability = async (req, res) => {
  const { id } = req.params;
  const userId = req.id;

  try {
    const [userResult] = await queryDb("SELECT is_admin, created_by FROM user WHERE id = ?", [userId]);

    if (!userResult) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const creatorId = Number(userResult.is_admin) === 1 ? userId : userResult.created_by;

    if (!creatorId) {
      return res.status(403).json({ success: false, message: "You are not authorized" });
    }

    db.run(
      `DELETE FROM reservationofday WHERE offdayid = ? AND created_by = ?`,
      [id, creatorId],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: "An error occurred" });

        if (this.changes === 0) {
          return res.status(404).json({ success: false, message: "Record not found" });
        }

        res.status(200).json({ success: true, message: "Successfully deleted" });
      }
    );
  } catch (error) {
    console.error("Error in deleteUnavailability:", error);
    return res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};

const getStatus = (occupied, capacity) => {
  if (occupied >= capacity) return "booked";
  if (occupied > 0) return "partial";
  return "free";
};

const getavailablereservationtables = async (req, res) => {
  try {
    const { reserveday, formtime, totime } = req.query;
    const userId = req.id;

    if (!reserveday || !formtime || !totime) {
      return res.status(400).json({
        success: false,
        error: "Missing required query parameters",
      });
    }

    const [userResult] = await queryDb(
      "SELECT is_admin, created_by FROM user WHERE id = ?",
      [userId],
    );

    if (!userResult) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { is_admin, created_by } = userResult;
    const creatorId = Number(is_admin) === 1 ? userId : created_by;

    if (!creatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view available tables",
      });
    }

    const query = `
      SELECT 
        t.tableid,
        t.tablename,
        t.person_capicity,
        t.occupied_seats,
        t.floor
      FROM rest_table t

      LEFT JOIN tblreservation r 
        ON t.tableid = r.tableid
        AND r.reserveday = ?
        AND r.status = 1
        AND r.created_by = ?
        AND NOT (r.totime <= ? OR r.formtime >= ?)

      LEFT JOIN reservationofday u
        ON u.offdaydate = ?
        AND u.is_active = 1
        AND u.created_by = ?
        AND NOT (
          substr(u.availtime, 9, 5) <= ? 
          OR substr(u.availtime, 1, 5) >= ?
        )

      WHERE 
        t.created_by = ?
        AND r.tableid IS NULL
        AND u.offdayid IS NULL
    `;

    const params = [
      reserveday,
      creatorId,
      formtime,
      totime,
      reserveday,
      creatorId,
      formtime,
      totime,
      creatorId,
    ];

    const result = await queryDb(query, params);

    const updated = result.map((t) => {
      const status = getStatus(t.occupied_seats, t.person_capicity);

      return {
        ...t,
        status,
        remaining: t.person_capicity - t.occupied_seats,
      };
    });

    return res.status(200).json({
      success: true,
      data: updated,
      message: updated.length > 0 ? "Tables available" : "No tables available",
    });
  } catch (error) {
    console.error("Error in getavailablereservationtables:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const getReservations = async (req, res) => {
  try {
    const { searchItem } = req.query;
    const userId = req.id;

    const userData = await queryDb(
      "SELECT is_admin, created_by FROM user WHERE id = ?",
      [userId],
    );

    if (!userData || userData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const { is_admin, created_by } = userData[0];

    let creatorId;

    if (Number(is_admin) === 1) {
      creatorId = userId;
    } else {
      if (!created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view reservations.",
        });
      }

      creatorId = created_by;
    }

    let query = `
      SELECT 
        ci.customer_name,
        rt.tablename,
        r.person_capicity,
        r.formtime AS start_time,
        r.totime AS end_time,
        r.reserveday AS date,
        r.reserveid,
        CASE
          WHEN r.status = 0 THEN 'free'
          WHEN r.status = 1 THEN 'Booked'
          ELSE 'unknown'
        END AS status
      FROM tblreservation r
      JOIN customer_info ci ON r.cid = ci.customer_id
      JOIN rest_table rt ON r.tableid = rt.tableid
      WHERE r.created_by = ?
    `;

    const queryParams = [creatorId];

    if (searchItem && searchItem.trim() !== "") {
      const searchQuery = `%${searchItem}%`;

      query += `
        AND (
          ci.customer_name LIKE ?
          OR rt.tablename LIKE ?
          OR r.person_capicity LIKE ?
          OR r.formtime LIKE ?
          OR r.totime LIKE ?
          OR r.reserveday LIKE ?
          OR r.reserveid LIKE ?
          OR (
            CASE
              WHEN r.status = 0 THEN 'free'
              WHEN r.status = 1 THEN 'Booked'
              ELSE 'unknown'
            END
          ) LIKE ?
        )
      `;

      queryParams.push(
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
      );
    }

    query += ` ORDER BY r.reserveid DESC`;

    const results = await queryDb(query, queryParams);

    return res.status(200).json({
      success: true,
      data: results || [],
      message:
        results.length > 0
          ? "Reservations fetched successfully"
          : "No reservations found",
    });
  } catch (error) {
    console.error("Error occurred while retrieving reservations:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

// get table byidreservation
const getTableByIdreservation = async (req, res) => {
  const { tableid } = req.params;
  const userId = req.id;

  try {
    const [userResult] = await queryDb("SELECT is_admin, created_by FROM user WHERE id = ?", [userId]);

    if (!userResult) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const creatorId = Number(userResult.is_admin) === 1 ? userId : userResult.created_by;

    if (!creatorId) {
      return res.status(403).json({ success: false, message: "You are not authorized" });
    }

    db.get(
      `SELECT tableid, tablename, person_capicity, occupied_seats, floor FROM rest_table WHERE tableid = ? AND created_by = ?`,
      [tableid, creatorId],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false });
        }

        if (!result) {
          return res.status(404).json({ success: false, message: "Table not found" });
        }

        const data = {
          ...result,
          status: getStatus(result.occupied_seats, result.person_capicity),
          remaining: result.person_capicity - result.occupied_seats,
        };

        return res.json({ success: true, data });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

// reservation setting
const dbQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};

const updatereservationsetting = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    const { reservation_open, reservation_close, maxreserveperson } = req.body;

    // Fetch the current settings by id
    const selectSql = "SELECT * FROM setting WHERE id = ?";
    const currentSetting = await dbQuery(selectSql, [id]);

    if (currentSetting.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Setting not found" });
    }

    // Update only the specified fields, while keeping the other fields unchanged
    const updateSql = `
        UPDATE setting 
        SET 
          reservation_open = ?, 
          reservation_close = ?, 
          maxreserveperson = ?
        WHERE id = ?`;

    const updateParams = [
      reservation_open || currentSetting[0].reservation_open, // Use the new value or keep the old one
      reservation_close || currentSetting[0].reservation_close,
      maxreserveperson || currentSetting[0].maxreserveperson,
      id,
    ];

    await dbQuery(updateSql, updateParams);

    res.status(200).json({
      success: true,
      message: "Reservation setting updated successfully",
    });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating reservation setting",
    });
  }
};
// delete reservation
const deleteReservation = async (req, res) => {
  const { id } = req.params;
  const userId = req.id;

  try {
    const [userResult] = await queryDb("SELECT is_admin, created_by FROM user WHERE id = ?", [userId]);

    if (!userResult) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const creatorId = Number(userResult.is_admin) === 1 ? userId : userResult.created_by;

    if (!creatorId) {
      return res.status(403).json({ success: false, message: "You are not authorized" });
    }

    db.run(
      "DELETE FROM tblreservation WHERE reserveid = ? AND created_by = ?",
      [id, creatorId],
      function (err) {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).json({ error: "Database query error" });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: "Reservation not found" });
        }

        return res.status(200).json({ message: "Reservation deleted successfully" });
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "An error occurred while deleting the reservation" });
  }
};

const getReservationById = async (req, res) => {
  const { id } = req.params;
  const userId = req.id;

  try {
    const [userResult] = await queryDb("SELECT is_admin, created_by FROM user WHERE id = ?", [userId]);

    if (!userResult) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const creatorId = Number(userResult.is_admin) === 1 ? userId : userResult.created_by;

    if (!creatorId) {
      return res.status(403).json({ success: false, message: "You are not authorized" });
    }

    const query = `
      SELECT
        ci.customer_name,
        rt.tablename,
        r.person_capicity,
        r.formtime AS start_time,
        r.totime AS end_time,
        r.reserveday AS date,
        ci.customer_email,
        ci.customer_phone,
        r.reserveid,
        CASE
          WHEN r.status = 0 THEN 'free'
          WHEN r.status = 1 THEN 'Booked'
          ELSE 'unknown'
        END AS status
      FROM tblreservation r
      JOIN customer_info ci ON r.cid = ci.customer_id
      JOIN rest_table rt ON r.tableid = rt.tableid
      WHERE r.reserveid = ? AND r.created_by = ?
    `;

    db.get(query, [id, creatorId], (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ error: "Database query error" });
      }

      if (!result) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      return res.status(200).json({ data: result });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "An error occurred while retrieving the reservation" });
  }
};

// const updateReservationAndCustomer = (req, res) => {
//   const { reserveid } = req.params;
//   const {
//     customer_name,
//     customer_email,
//     customer_mobile,
//     formtime,
//     totime,
//     reserveday,
//   } = req.body;
//   console.log(customer_email,customer_mobile,"ddddd",req.body)

//   const getReservationDataQuery = 'SELECT * FROM tblreservation WHERE reserveid = ?';
//   const getCustomerDataQuery = 'SELECT * FROM customer_info WHERE customer_id = ?';
//   const updateCustomerQuery =
//     'UPDATE customer_info SET customer_name = ?, customer_email = ?, customer_phone = ? WHERE customer_id = ?';
//   const updateReservationQuery =
//     'UPDATE tblreservation SET totime = ?, formtime = ?, reserveday = ? WHERE reserveid = ?';

//   try {
//     // Step 1: Get reservation data
//     db.get(getReservationDataQuery, [reserveid], (err, reservationData) => {
//       if (err) {
//         console.error("Error fetching reservation:", err);
//         return res.status(500).json({ success: false, message: 'Error retrieving reservation data' });
//       }

//       if (!reservationData) {
//         return res.status(404).json({ success: false, message: 'Reservation not found' });
//       }

//       const customer_id = reservationData.cid;

//       // Step 2: Get current customer data
//       db.get(getCustomerDataQuery, [customer_id], (err, customerData) => {
//         if (err) {
//           console.error("Error fetching customer:", err);
//           return res.status(500).json({ success: false, message: 'Error retrieving customer data' });
//         }

//         if (!customerData) {
//           return res.status(404).json({ success: false, message: 'Customer not found' });
//         }

//         const updatedCustomerData = {
//           customer_name: customer_name !== undefined ? customer_name : customerData.customer_name,
//           customer_email: customer_email !== undefined ? customer_email : customerData.customer_email,
//           customer_mobile: customer_mobile !== undefined ? customer_mobile : customerData.customer_phone,
//         };

//         // Step 3: Update customer_info
//         db.run(
//           updateCustomerQuery,
//           [
//             updatedCustomerData.customer_name,
//             updatedCustomerData.customer_email,
//             updatedCustomerData.customer_phone,
//             customer_id,
//           ],
//           function (err) {
//             if (err) {
//               console.error("Error updating customer:", err);
//               return res.status(500).json({ success: false, message: 'Error updating customer info' });
//             }

//             const updatedReservationData = {
//               totime: totime !== undefined ? totime : reservationData.totime,
//               formtime: formtime !== undefined ? formtime : reservationData.formtime,
//               reserveday: reserveday !== undefined ? reserveday : reservationData.reserveday,
//             };

//             // Step 4: Update reservation
//             db.run(
//               updateReservationQuery,
//               [
//                 updatedReservationData.totime,
//                 updatedReservationData.formtime,
//                 updatedReservationData.reserveday,
//                 reserveid,
//               ],
//               function (err) {
//                 if (err) {
//                   console.error("Error updating reservation:", err);
//                   return res.status(500).json({ success: false, message: 'Error updating reservation info' });
//                 }

//                 return res.status(200).json({ success: true, message: 'Reservation and customer info updated successfully' });
//               }
//             );
//           }
//         );
//       });
//     });
//   } catch (error) {
//     console.error("Unhandled error:", error);
//     res.status(500).json({ success: false, message: 'An error occurred while updating reservation and customer info' });
//   }
// };
const updateReservationAndCustomer = async (req, res) => {
  const { reserveid } = req.params;
  const userId = req.id;
  const {
    customer_name,
    customer_email,
    customer_mobile,
    formtime,
    totime,
    reserveday,
  } = req.body;

  try {
    const [userResult] = await queryDb("SELECT is_admin, created_by FROM user WHERE id = ?", [userId]);

    if (!userResult) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const creatorId = Number(userResult.is_admin) === 1 ? userId : userResult.created_by;

    if (!creatorId) {
      return res.status(403).json({ success: false, message: "You are not authorized" });
    }

    const getReservationDataQuery =
      "SELECT * FROM tblreservation WHERE reserveid = ? AND created_by = ?";
    const getCustomerDataQuery =
      "SELECT * FROM customer_info WHERE customer_id = ?";
    const updateCustomerQuery =
      "UPDATE customer_info SET customer_name = ?, customer_email = ?, customer_phone = ? WHERE customer_id = ?";
    const updateReservationQuery =
      "UPDATE tblreservation SET totime = ?, formtime = ?, reserveday = ? WHERE reserveid = ? AND created_by = ?";

    db.get(getReservationDataQuery, [reserveid, creatorId], (err, reservationData) => {
      if (err) {
        console.error("Error fetching reservation:", err);
        return res.status(500).json({
          success: false,
          message: "Error retrieving reservation data",
        });
      }

      if (!reservationData) {
        return res
          .status(404)
          .json({ success: false, message: "Reservation not found" });
      }

      const customer_id = reservationData.cid;

      db.get(getCustomerDataQuery, [customer_id], (err, customerData) => {
        if (err) {
          console.error("Error fetching customer:", err);
          return res.status(500).json({
            success: false,
            message: "Error retrieving customer data",
          });
        }

        if (!customerData) {
          return res
            .status(404)
            .json({ success: false, message: "Customer not found" });
        }

        const updatedCustomerData = {
          customer_name: customer_name ?? customerData.customer_name,
          customer_email: customer_email ?? customerData.customer_email,
          customer_phone: customer_mobile ?? customerData.customer_phone,
        };

        db.run(
          updateCustomerQuery,
          [
            updatedCustomerData.customer_name,
            updatedCustomerData.customer_email,
            updatedCustomerData.customer_phone,
            customer_id,
          ],
          function (err) {
            if (err) {
              console.error("Error updating customer:", err);
              return res.status(500).json({
                success: false,
                message: "Error updating customer info",
              });
            }

            const updatedReservationData = {
              totime: totime ?? reservationData.totime,
              formtime: formtime ?? reservationData.formtime,
              reserveday: reserveday ?? reservationData.reserveday,
            };

            db.run(
              updateReservationQuery,
              [
                updatedReservationData.totime,
                updatedReservationData.formtime,
                updatedReservationData.reserveday,
                reserveid,
                creatorId,
              ],
              function (err) {
                if (err) {
                  console.error("Error updating reservation:", err);
                  return res.status(500).json({
                    success: false,
                    message: "Error updating reservation info",
                  });
                }

                return res.status(200).json({
                  success: true,
                  message: "Reservation and customer info updated successfully",
                });
              },
            );
          },
        );
      });
    });
  } catch (error) {
    console.error("Unhandled error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating reservation and customer info",
    });
  }
};

module.exports = {
  createUnavailability,
  getUnavailability,
  deleteUnavailability,
  getUnavailabilitybyid,
  updateUnavailability,
  getReservations,
  updatereservationsetting,
  getavailablereservationtables,
  createReservation,
  getTableByIdreservation,
  deleteReservation,
  getReservationById,
  updateReservationAndCustomer,
};
