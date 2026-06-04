const db = require("../utils/db");
const { v4: uuidv4 } = require("uuid");

// const createFloor = async (req, res) => {
//   const userId = req.id;

//   try {
//     const { floorName } = req.body;
//     const uuid = uuidv4();

//     const query = `
//       INSERT INTO tbl_tablefloor
//       (uuid, floorName, created_by, synced, updated_at)
//       VALUES (?, ?, ?, 0, datetime('now'))
//     `;

//     db.run(query, [uuid, floorName, userId], (err) => {
//       // 🔥 FIX
//       if (err) {
//         console.log(err);
//         return res.status(500).json({ success: false });
//       }

//       res.status(200).json({
//         success: true,
//         message: "Floor created",
//       });
//     });
//   } catch (error) {
//     res.status(500).json({ success: false });
//   }
// };

const createFloor = (req, res) => {
  const { floorName } = req.body;
  const user_id = req.id;
  const uuid = uuidv4();

  // Step 1: Check if user has subscription
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
        // User has subscription
        const created_by = subscription.user_id;

        const createFloorQuery = `
          INSERT INTO tbl_tablefloor
          (uuid, floorName, created_by, synced, updated_at)
          VALUES (?, ?, ?, 0, datetime('now'))
        `;

        db.run(createFloorQuery, [uuid, floorName, created_by], function (err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "An error occurred",
              error: err.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: "Floor created successfully (via subscription)",
          });
        });
      } else {
        // Step 2: Check user created_by
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
                message: "You are not authorized to create a floor.",
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

                if (creatorSubscription) {
                  const createFloorQuery = `
                    INSERT INTO tbl_tablefloor
                    (uuid, floorName, created_by, synced, updated_at)
                    VALUES (?, ?, ?, 0, datetime('now'))
                  `;

                  db.run(
                    createFloorQuery,
                    [uuid, floorName, created_by],
                    function (err) {
                      if (err) {
                        return res.status(500).json({
                          success: false,
                          message: "An error occurred",
                          error: err.message,
                        });
                      }

                      return res.status(201).json({
                        success: true,
                        message: "Floor created successfully (via creator)",
                      });
                    },
                  );
                } else {
                  return res.status(403).json({
                    success: false,
                    message: "Creator does not have an active subscription.",
                  });
                }
              },
            );
          },
        );
      }
    },
  );
};
const getFloors = async (req, res) => {
  try {
    const id = req.id;
    const { searchItem } = req.query;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

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
            message: "You are not authorized to view floors",
          });
        }

        ownerId = created_by;
      }

      let getFloorsQuery = `
        SELECT * FROM tbl_tablefloor
        WHERE created_by = ?
      `;

      let queryParams = [ownerId];

      if (searchItem && searchItem.trim() !== "") {
        getFloorsQuery += `
          AND floorName LIKE ?
        `;
        const searchQuery = `%${searchItem}%`;
        queryParams.push(searchQuery);
      }

      getFloorsQuery += ` ORDER BY updated_at DESC`;

      db.all(getFloorsQuery, queryParams, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching floors",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          data: result,
          message: "Floors fetched successfully",
        });
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
    });
  }
};
//update

const updateFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const { floorName } = req.body;

    // Step 1: Fetch the current floor data
    const fetchCurrentDataSql =
      "SELECT * FROM tbl_tablefloor WHERE tbfloorid = ?";
    db.get(fetchCurrentDataSql, [id], (fetchErr, currentData) => {
      if (fetchErr) {
        console.error("Database fetch error:", fetchErr);
        return res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }

      if (!currentData) {
        return res
          .status(404)
          .json({ success: false, message: "Floor record not found" });
      }

      // Step 2: Prepare the updated data
      const updatedData = {
        floorName: floorName !== undefined ? floorName : currentData.floorName,
      };

      // Step 3: Update the floor record
      const updateFloorQuery = `
        UPDATE tbl_tablefloor 
        SET floorName = ? 
        WHERE tbfloorid = ?
      `;

      db.run(
        updateFloorQuery,
        [updatedData.floorName, id],
        function (updateErr) {
          if (updateErr) {
            console.error("Database update error:", updateErr);
            return res
              .status(500)
              .json({ success: false, message: "An error occurred" });
          }

          if (this.changes === 0) {
            return res
              .status(404)
              .json({ success: false, message: "Floor record not found" });
          }

          return res
            .status(200)
            .json({ success: true, message: "Floor updated successfully" });
        },
      );
    });
  } catch (error) {
    console.error("Update floor error:", error);
    return res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};

// get by id
const getFloorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Floor ID is required" });
    }

    const getFloorByIdQuery = `SELECT * FROM tbl_tablefloor WHERE 	tbfloorid  = ?`;

    db.all(getFloorByIdQuery, [id], (err, result) => {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .json({ success: false, message: "An error occurred" });
      }

      if (result.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Floor not found" });
      }

      res.status(200).json({
        success: true,
        data: result[0],
        message: "Floor fetched successfully",
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const deleteFloor = async (req, res) => {
  try {
    const { floorID } = req.params;

    const deleteFloorQuery = `DELETE FROM tbl_tablefloor WHERE tbfloorid = ?`;
    db.run(deleteFloorQuery, [floorID], function (err) {
      if (err) {
        console.log("Error deleting floor:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while deleting the floor",
        });
      }

      if (this.changes === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Floor not found" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Floor deleted successfully" });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};

module.exports = {
  createFloor,
  getFloors,
  deleteFloor,
  updateFloor,
  getFloorById,
};
