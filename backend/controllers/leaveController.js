const db = require("../utils/db");

// const createHoliday = (req, res) => {
//   const { holiday_name, start_date, end_date, no_of_days } = req.body;
//   const created_by = req.id;

//   const sql = 'INSERT INTO payroll_holiday (holiday_name, start_date, end_date, no_of_days, created_by) VALUES (?, ?, ?, ?, ?)';
//   const values = [holiday_name, start_date, end_date, no_of_days, created_by];

//   db.run(sql, values, function (err) {
//     if (err) {
//       console.error('Database insertion error:', err);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//     res.status(201).json({ success: true, message: 'Holiday created successfully', holidayId: this.lastID });
//   });
// };

const createHoliday = (req, res) => {
  try {
    const { holiday_name, start_date, end_date, no_of_days } = req.body;
    const user_id = req.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    if (!holiday_name || holiday_name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Holiday name is required.",
      });
    }

    db.get(
      `SELECT created_by, is_admin FROM user WHERE id = ?`,
      [user_id],
      (err, user) => {
        if (err) {
          console.error("User check error:", err);
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found.",
          });
        }

        let created_by;

        if (user.is_admin === 1) {
          created_by = user_id;
        } else {
          if (!user.created_by) {
            return res.status(403).json({
              success: false,
              message: "You are not authorized to create holiday.",
            });
          }

          created_by = user.created_by;
        }

        const updated_by = created_by;

        const sql = `
          INSERT INTO payroll_holiday 
          (holiday_name, start_date, end_date, no_of_days, created_by, updated_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        const values = [
          holiday_name,
          start_date,
          end_date,
          no_of_days,
          created_by,
          updated_by,
        ];

        db.run(sql, values, function (err) {
          if (err) {
            console.error("Database insertion error:", err);
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }

          return res.status(201).json({
            success: true,
            message: "Holiday created successfully",
            holidayId: this.lastID,
          });
        });
      }
    );
  } catch (error) {
    console.error("Error in createHoliday:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

const updateHoliday = (req, res) => {
  const { id } = req.params;
  const { holiday_name, start_date, end_date, no_of_days } = req.body;
  const updated_by = req.id;

  const fetchSql = "SELECT * FROM payroll_holiday WHERE payrl_holi_id = ?";

  db.get(fetchSql, [id], (fetchErr, currentData) => {
    if (fetchErr) {
      console.error("Database fetch error:", fetchErr);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (!currentData) {
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found" });
    }

    const updatedData = {
      holiday_name:
        holiday_name !== undefined ? holiday_name : currentData.holiday_name,
      start_date:
        start_date !== undefined ? start_date : currentData.start_date,
      end_date: end_date !== undefined ? end_date : currentData.end_date,
      no_of_days:
        no_of_days !== undefined ? no_of_days : currentData.no_of_days,
    };

    const updateSql = `
      UPDATE payroll_holiday 
      SET holiday_name = ?, start_date = ?, end_date = ?, no_of_days = ?, updated_by = ?
      WHERE payrl_holi_id = ?
    `;

    db.run(
      updateSql,
      [
        updatedData.holiday_name,
        updatedData.start_date,
        updatedData.end_date,
        updatedData.no_of_days,
        updated_by,
        id,
      ],
      function (updateErr) {
        if (updateErr) {
          console.error("Database update error:", updateErr);
          return res.status(500).json({ error: "Internal Server Error" });
        }
        if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Holiday not found" });
        }
        res
          .status(200)
          .json({ success: true, message: "Holiday updated successfully" });
      }
    );
  });
};

const deleteHoliday = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM payroll_holiday WHERE payrl_holi_id = ?";

  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Database deletion error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Holiday deleted successfully" });
  });
};

const getHolidayById = (req, res) => {
  const { id } = req.params;

  const fetchSql = "SELECT * FROM payroll_holiday WHERE payrl_holi_id = ?";

  db.get(fetchSql, [id], (fetchErr, fetchData) => {
    if (fetchErr) {
      console.error("Database fetch error:", fetchErr);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (!fetchData) {
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found" });
    }

    // Return the fetched data
    res.status(200).json({ success: true, data: fetchData });
  });
};

const getHolidays = (req, res) => {
  try {
    const id = req.id;
    const { searchItem } = req.query;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    db.get(
      `SELECT created_by, is_admin FROM user WHERE id = ?`,
      [id],
      (err, user) => {
        if (err) {
          console.error("User check error:", err);
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found.",
          });
        }

        let ownerId;

        if (user.is_admin === 1) {
          ownerId = id;
        } else {
          if (!user.created_by) {
            return res.status(403).json({
              success: false,
              message: "You are not authorized to view holidays.",
            });
          }

          ownerId = user.created_by;
        }

        let getHolidaysQuery;
        let queryParams = [];

        if (!searchItem || searchItem.trim() === "") {
          getHolidaysQuery = `
            SELECT * FROM payroll_holiday
            WHERE created_by = ?
          `;
          queryParams = [ownerId];
        } else {
          const searchQuery = `%${searchItem}%`;

          getHolidaysQuery = `
            SELECT * FROM payroll_holiday 
            WHERE created_by = ?
            AND (
              holiday_name LIKE ? 
              OR start_date LIKE ? 
              OR end_date LIKE ? 
              OR no_of_days LIKE ?
            )
          `;

          queryParams = [
            ownerId,
            searchQuery,
            searchQuery,
            searchQuery,
            searchQuery,
          ];
        }

        getHolidaysQuery += ` ORDER BY payrl_holi_id DESC`;

        db.all(getHolidaysQuery, queryParams, (err, results) => {
          if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }

          return res.status(200).json({
            success: true,
            data: results,
          });
        });
      }
    );
  } catch (error) {
    console.error("Error in getHolidays:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};
// leave type api

// const createLeaveType = (req, res) => {
//   const { leave_type, leave_days } = req.body;
//   const sql = "INSERT INTO leave_type (leave_type, leave_days) VALUES (?, ?)";

//   db.run(sql, [leave_type, leave_days], function (err) {
//     if (err) {
//       console.error("Database query error: ", err);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//     res.status(201).json({
//       message: "Leave Type created successfully",
//       leave_type_id: this.lastID, // SQLite specific
//     });
//   });
// };

const createLeaveType = (req, res) => {
  try {
    const { leave_type, leave_days } = req.body;
    const user_id = req.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    if (!leave_type || leave_type.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Leave type is required.",
      });
    }

    if (leave_days === undefined || leave_days === null || leave_days === "") {
      return res.status(400).json({
        success: false,
        message: "Leave days is required.",
      });
    }

    db.get(
      `SELECT created_by, is_admin FROM user WHERE id = ?`,
      [user_id],
      (err, user) => {
        if (err) {
          console.error("User check error:", err);
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found.",
          });
        }

        let created_by;

        if (user.is_admin === 1) {
          created_by = user_id;
        } else {
          if (!user.created_by) {
            return res.status(403).json({
              success: false,
              message: "You are not authorized to create leave type.",
            });
          }

          created_by = user.created_by;
        }

        const sql = `
          INSERT INTO leave_type (leave_type, leave_days, created_by)
          VALUES (?, ?, ?)
        `;

        db.run(sql, [leave_type, leave_days, created_by], function (err) {
          if (err) {
            console.error("Database query error: ", err);
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }

          return res.status(201).json({
            success: true,
            message: "Leave Type created successfully",
            leave_type_id: this.lastID,
          });
        });
      }
    );
  } catch (error) {
    console.error("Error in createLeaveType:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

// Get All Leave Types
const getLeaveTypes = (req, res) => {
  try {
    const id = req.id;
    const { searchItem } = req.query;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    db.get(
      `SELECT created_by, is_admin FROM user WHERE id = ?`,
      [id],
      (err, user) => {
        if (err) {
          console.error("User check error:", err);
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found.",
          });
        }

        let ownerId;

        if (user.is_admin === 1) {
          ownerId = id;
        } else {
          if (!user.created_by) {
            return res.status(403).json({
              success: false,
              message: "You are not authorized to view leave types.",
            });
          }

          ownerId = user.created_by;
        }

        let getLeaveTypesQuery;
        let queryParams = [];

        if (!searchItem || searchItem.trim() === "") {
          getLeaveTypesQuery = `
            SELECT * FROM leave_type
            WHERE created_by = ?
          `;
          queryParams = [ownerId];
        } else {
          const searchQuery = `%${searchItem}%`;

          getLeaveTypesQuery = `
            SELECT * FROM leave_type 
            WHERE created_by = ?
            AND (
              leave_type LIKE ? 
              OR leave_days LIKE ?
            )
          `;
          queryParams = [ownerId, searchQuery, searchQuery];
        }

        getLeaveTypesQuery += ` ORDER BY leave_type_id DESC`;

        db.all(getLeaveTypesQuery, queryParams, (err, data) => {
          if (err) {
            console.error("Database query error: ", err);
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }

          return res.status(200).json({
            success: true,
            data,
          });
        });
      }
    );
  } catch (error) {
    console.error("Error in getLeaveTypes:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

// Update Leave Type
const updateLeaveType = (req, res) => {
  const { id } = req.params;
  const { leave_type, leave_days } = req.body;

  const fetchCurrentDataSql =
    "SELECT * FROM leave_type WHERE leave_type_id = ?";
  db.all(fetchCurrentDataSql, [id], (fetchErr, fetchData) => {
    if (fetchErr) {
      console.error("Database fetch error:", fetchErr);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (fetchData.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Leave Type record not found" });
    }

    const currentData = fetchData[0];
    const updatedData = {
      leave_type:
        leave_type !== undefined ? leave_type : currentData.leave_type,
      leave_days:
        leave_days !== undefined ? leave_days : currentData.leave_days,
    };

    const updateSql = `
        UPDATE leave_type 
        SET leave_type = ?, leave_days = ? 
        WHERE leave_type_id = ?
      `;

    db.run(
      updateSql,
      [updatedData.leave_type, updatedData.leave_days, id],
      function (updateErr) {
        if (updateErr) {
          console.error("Database update error:", updateErr);
          return res
            .status(500)
            .json({ success: false, message: "An error occurred" });
        } else if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Leave Type record not found" });
        } else {
          return res.status(200).json({
            success: true,
            message: "Leave Type updated successfully",
          });
        }
      }
    );
  });
};

const deleteLeaveType = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM leave_type WHERE leave_type_id = ?";

  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Database query error: ", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Leave Type record not found" });
    }
    res.status(200).json({ message: "Leave Type deleted successfully" });
  });
};

// Get Leave Type by ID
const getLeaveTypeById = (req, res) => {
  const { id } = req.params; // Extracting ID from request parameters

  const getLeaveTypeSql = "SELECT * FROM leave_type WHERE leave_type_id = ?";

  // Execute the query
  db.all(getLeaveTypeSql, [id], (err, data) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (data.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Leave Type record not found" });
    }

    // Send the leave type data if found
    res.status(200).json({ success: true, data: data[0] });
  });
};

// leave application api
//   const createLeaveApply = (req, res) => {
//     const {
//       emp_his_id, apply_strt_date, apply_end_date, apply_day,
//         reason, approved_by, leave_type_id
//     } = req.body;
// console.log(emp_his_id)
//     const sql = `
//         INSERT INTO leave_apply
//         (employee_id, leave_type_id, apply_strt_date, apply_end_date, apply_day, reason, approved_by)
//         VALUES (?, ?, ?, ?, ?, ?, ?)
//     `;
//     const values = [
//       emp_his_id, leave_type_id, apply_strt_date, apply_end_date, apply_day,
//         reason, approved_by
//     ];

//     db.pool.query(sql, values, (err, data) => {
//         if (err) {
//             console.error('Error inserting leave application:', err);
//             return res.status(500).json({ error: 'Internal Server Error' });
//         }
//         res.status(201).json({ message: 'Leave application created successfully', leave_apply_id: data.insertId });
//     });
// };
const createLeaveApply = (req, res) => {
  try {
    const {
      emp_his_id,
      apply_strt_date,
      apply_end_date,
      apply_day,
      reason,
      approved_by,
      leave_type_id,
    } = req.body;

    const user_id = req.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    if (!emp_his_id) {
      return res.status(400).json({
        success: false,
        message: "Employee is required.",
      });
    }

    if (!leave_type_id) {
      return res.status(400).json({
        success: false,
        message: "Leave type is required.",
      });
    }

    db.get(
      `SELECT created_by, is_admin FROM user WHERE id = ?`,
      [user_id],
      (err, user) => {
        if (err) {
          console.error("User check error:", err);
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found.",
          });
        }

        const sql = `
          INSERT INTO leave_apply 
          (employee_id, leave_type_id, apply_strt_date, apply_end_date, apply_day, reason, approved_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          emp_his_id,
          leave_type_id,
          apply_strt_date,
          apply_end_date,
          apply_day,
          reason,
          approved_by,
        ];

        db.run(sql, values, function (err) {
          if (err) {
            console.error("Error inserting leave application:", err);
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }

          return res.status(201).json({
            success: true,
            message: "Leave application created successfully",
            leave_apply_id: this.lastID,
          });
        });
      }
    );
  } catch (error) {
    console.error("Error in createLeaveApply:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

// const getLeaveApplies = (req, res) => {
//   const { searchItem } = req.query; // Get the search query from request query parameters

//   console.log(searchItem)
//   let sql = `
//       SELECT la.employee_id, la.leave_appl_id, eh.first_name, eh.last_name, la.apply_strt_date, la.apply_end_date,
//              la.apply_day, la.leave_type_id, lt.leave_type, la.reason, eh.emp_his_id, la.approved_by,
//              u.firstname AS approved_by_firstname, u.lastname AS approved_by_lastname
//       FROM leave_apply la
//       LEFT JOIN employee_history eh ON la.employee_id = eh.emp_his_id
//       LEFT JOIN leave_type lt ON la.leave_type_id = lt.leave_type_id
//       LEFT JOIN user u ON u.id = la.approved_by
//   `;

//   let queryParams = [];

//   // If searchItem is provided, modify the query to include a search filter
//   if (searchItem && searchItem.trim() !== "") {
//       sql += `
//           WHERE eh.first_name LIKE ?
//           OR eh.last_name LIKE ?
//           OR CONCAT(eh.first_name, ' ', eh.last_name) LIKE ?
//           OR lt.leave_type LIKE ?
//           OR la.reason LIKE ?
//           OR la.apply_strt_date LIKE ?
//           OR la.apply_end_date LIKE ?
//           OR  la.apply_day LIKE ?
//       `;
//       const searchQuery = `%${searchItem}%`;
//       queryParams = [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery,searchQuery,searchQuery,searchQuery];
//   }

//   // Execute the query
//   db.run(sql, queryParams, (err, data) => {
//       if (err) {
//           console.error('Error fetching leave applications:', err);
//           return res.status(500).json({ error: 'Internal Server Error' });
//       }

//       // Map the result to extract specific fields
//       const result = data.map(emp => ({
//           employee_id: emp.employee_id,
//           leave_apply_id: emp.leave_appl_id,
//           employee_name: `${emp.first_name} ${emp.last_name}`,
//           apply_strt_date: emp.apply_strt_date,
//           apply_end_date: emp.apply_end_date,
//           apply_day: emp.apply_day,
//           leave_type_id: emp.leave_type_id,
//           leave_type: emp.leave_type,
//           reason: emp.reason,
//           employeehisid: emp.emp_his_id,
//           approved_byid: emp.approved_by,
//           approved_by_name: `${emp.approved_by_firstname} ${emp.approved_by_lastname}`,
//       }));

//       // Send the processed data back to the client
//       res.status(200).json({ data: result, message: 'Leave applications fetched successfully' });
//   });
// };

const getLeaveApplies = (req, res) => {
  try {
    const id = req.id;
    const { searchItem } = req.query;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    db.get(
      `SELECT created_by, is_admin FROM user WHERE id = ?`,
      [id],
      (err, user) => {
        if (err) {
          console.error("User check error:", err);
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found.",
          });
        }

        let ownerId;

        if (user.is_admin === 1) {
          ownerId = id;
        } else {
          if (!user.created_by) {
            return res.status(403).json({
              success: false,
              message: "You are not authorized to view leave applications.",
            });
          }

          ownerId = user.created_by;
        }

        let sql = `
          SELECT 
            la.employee_id, 
            la.leave_appl_id, 
            eh.first_name, 
            eh.last_name, 
            la.apply_strt_date, 
            la.apply_end_date, 
            la.apply_day, 
            la.leave_type_id, 
            lt.leave_type, 
            la.reason, 
            eh.emp_his_id, 
            la.approved_by, 
            u.firstname AS approved_by_firstname, 
            u.lastname AS approved_by_lastname
          FROM leave_apply la 
          LEFT JOIN employee_history eh ON la.employee_id = eh.emp_his_id 
          LEFT JOIN leave_type lt ON la.leave_type_id = lt.leave_type_id
          LEFT JOIN user u ON u.id = la.approved_by
          WHERE eh.created_by = ?
        `;

        let queryParams = [ownerId];

        if (searchItem && searchItem.trim() !== "") {
          sql += `
            AND (
              eh.first_name LIKE ? 
              OR eh.last_name LIKE ? 
              OR (eh.first_name || ' ' || eh.last_name) LIKE ? 
              OR lt.leave_type LIKE ? 
              OR la.reason LIKE ?
              OR la.apply_strt_date LIKE ?
              OR la.apply_end_date LIKE ?
              OR la.apply_day LIKE ?
            )
          `;

          const searchQuery = `%${searchItem}%`;
          queryParams.push(
            searchQuery,
            searchQuery,
            searchQuery,
            searchQuery,
            searchQuery,
            searchQuery,
            searchQuery,
            searchQuery
          );
        }

        sql += ` ORDER BY la.leave_appl_id DESC`;

        db.all(sql, queryParams, (err, data) => {
          if (err) {
            console.error("Error fetching leave applications:", err);
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }

          const result = data.map((emp) => ({
            employee_id: emp.employee_id,
            leave_apply_id: emp.leave_appl_id,
            employee_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
            apply_strt_date: emp.apply_strt_date,
            apply_end_date: emp.apply_end_date,
            apply_day: emp.apply_day,
            leave_type_id: emp.leave_type_id,
            leave_type: emp.leave_type,
            reason: emp.reason,
            employeehisid: emp.emp_his_id,
            approved_byid: emp.approved_by,
            approved_by_name: `${emp.approved_by_firstname || ""} ${
              emp.approved_by_lastname || ""
            }`.trim(),
          }));

          return res.status(200).json({
            success: true,
            data: result,
            message: "Leave applications fetched successfully",
          });
        });
      }
    );
  } catch (error) {
    console.error("Error in getLeaveApplies:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

// const getLeaveApplyById = (req, res) => {
//   const leave_apply_id = req.params.id;

//   // SQL query with concatenation of first name and last name
//   const sql = `
//       SELECT la.employee_id, la.leave_appl_id,
//              CONCAT(eh.first_name, ' ', eh.last_name) AS employee_name,  -- Concatenate employee first and last name
//              la.apply_strt_date, la.apply_end_date,
//              la.apply_day, la.leave_type_id, lt.leave_type, la.reason,
//              eh.emp_his_id, la.approved_by,
//              CONCAT(u.firstname, ' ', u.lastname) AS approved_by_name  -- Concatenate approver first and last name
//       FROM leave_apply la
//       LEFT JOIN employee_history eh ON la.employee_id = eh.emp_his_id
//       LEFT JOIN leave_type lt ON la.leave_type_id = lt.leave_type_id
//       LEFT JOIN user u ON u.id = la.approved_by
//       WHERE la.leave_appl_id = ?
//   `;

//   // Database query
//   db.pool.query(sql, [leave_apply_id], (err, data) => {
//       if (err) {
//           console.error('Error fetching leave application by ID:', err);
//           return res.status(500).json({ error: 'Internal Server Error' });
//       }

//       console.log("data", data);

//       // Respond with the result
//       res.status(200).json({ data: data });
//   });
// };
const getLeaveApplyById = (req, res) => {
  const leave_apply_id = req.params.id;

  const sql = `
    SELECT la.employee_id, la.leave_appl_id, 
           (eh.first_name || ' ' || eh.last_name) AS employee_name,  -- SQLite string concatenation
           la.apply_strt_date, la.apply_end_date, 
           la.apply_day, la.leave_type_id, lt.leave_type, la.reason, 
           eh.emp_his_id, la.approved_by, 
           (u.firstname || ' ' || u.lastname) AS approved_by_name  -- SQLite string concatenation
    FROM leave_apply la 
    LEFT JOIN employee_history eh ON la.employee_id = eh.emp_his_id 
    LEFT JOIN leave_type lt ON la.leave_type_id = lt.leave_type_id
    LEFT JOIN user u ON u.id = la.approved_by 
    WHERE la.leave_appl_id = ?
  `;

  // Use db.all for SELECT queries in SQLite
  db.all(sql, [leave_apply_id], (err, data) => {
    if (err) {
      console.error("Error fetching leave application by ID:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    console.log("data", data);

    res.status(200).json({ data: data });
  });
};

// const deleteLeaveApply = (req, res) => {
//     const leave_apply_id = req.params.id;

//     const sql = `DELETE FROM leave_apply WHERE leave_appl_id = ?`;

//     db.pool.query(sql, [leave_apply_id], (err, result) => {
//         if (err) {
//             console.error('Error deleting leave application:', err);
//             return res.status(500).json({ error: 'Internal Server Error' });
//         }

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Leave application not found' });
//         }

//         res.status(200).json({ message: 'Leave application deleted successfully' });
//     });
// };
const deleteLeaveApply = (req, res) => {
  const leave_apply_id = req.params.id;

  const sql = `DELETE FROM leave_apply WHERE leave_appl_id = ?`;

  db.run(sql, [leave_apply_id], function (err) {
    if (err) {
      console.error("Error deleting leave application:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Leave application not found" });
    }

    res.status(200).json({ message: "Leave application deleted successfully" });
  });
};

// const updateLeaveApply = (req, res) => {
//   const leave_apply_id = req.params.id;
//   const {
//     emp_his_id, leave_type_id, apply_strt_date, apply_end_date, apply_day,
//       reason, approved_by
//   } = req.body;

//   const sql = `
//       UPDATE leave_apply
//       SET employee_id = ?, leave_type_id = ?, apply_strt_date = ?, apply_end_date = ?, apply_day = ?,
//           reason = ?, approved_by = ?
//       WHERE leave_appl_id = ?
//   `;

//   const values = [
//     emp_his_id, leave_type_id, apply_strt_date, apply_end_date, apply_day,
//       reason, approved_by,  leave_apply_id
//   ];

//   db.pool.query(sql, values, (err, result) => {
//       if (err) {
//           console.error('Error updating leave application:', err);
//           return res.status(500).json({ error: 'Internal Server Error' });
//       }

//       if (result.affectedRows === 0) {
//           return res.status(404).json({ message: 'Leave application not found' });
//       }

//       res.status(200).json({ message: 'Leave application updated successfully' });
//   });
// };
const updateLeaveApply = (req, res) => {
  const leave_apply_id = req.params.id;
  const {
    emp_his_id,
    leave_type_id,
    apply_strt_date,
    apply_end_date,
    apply_day,
    reason,
    approved_by,
  } = req.body;

  const sql = `
      UPDATE leave_apply
      SET employee_id = ?, leave_type_id = ?, apply_strt_date = ?, apply_end_date = ?, apply_day = ?,
          reason = ?, approved_by = ?
      WHERE leave_appl_id = ?
  `;

  const values = [
    emp_his_id,
    leave_type_id,
    apply_strt_date,
    apply_end_date,
    apply_day,
    reason,
    approved_by,
    leave_apply_id,
  ];

  db.run(sql, values, function (err) {
    if (err) {
      console.error("Error updating leave application:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Leave application not found" });
    }

    res.status(200).json({ message: "Leave application updated successfully" });
  });
};

const importHolidays = (req, res) => {
  const user_id = req.id;
  const rows = req.body.rows;
  if (!rows || !Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ success: false, message: "No data provided" });

  const checkSub = "SELECT * FROM superadmin_user_plans WHERE user_id = ?";
  db.get(checkSub, [user_id], (err, subscription) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (subscription) { processImport(user_id); }
    else {
      db.get("SELECT created_by FROM user WHERE id = ?", [user_id], (err, userData) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!userData || !userData.created_by)
          return res.status(403).json({ success: false, message: "Not authorized." });
        db.get(checkSub, [userData.created_by], (err, creatorSub) => {
          if (err) return res.status(500).json({ success: false, message: err.message });
          if (!creatorSub) return res.status(403).json({ success: false, message: "Creator does not have an active subscription." });
          processImport(userData.created_by);
        });
      });
    }
  });

  function processImport(creator_id) {
    let imported = 0, skipped = 0, index = 0;

    function processNext() {
      if (index >= rows.length) return res.json({ success: true, imported, skipped });
      const row = rows[index++];
      const holiday_name = (row.Holiday_Name || "").trim();
      const start_date = (row.Start_Date || "").trim();
      const end_date = (row.End_Date || "").trim();
      const no_of_days = row.No_Of_Days;

      if (!holiday_name || !start_date || !end_date || !no_of_days) { skipped++; return processNext(); }

      db.get("SELECT holiday_name FROM payroll_holiday WHERE holiday_name = ? AND created_by = ?", [holiday_name, creator_id], (err, existing) => {
        if (err || existing) { skipped++; return processNext(); }
        db.run(
          "INSERT INTO payroll_holiday (holiday_name, start_date, end_date, no_of_days, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)",
          [holiday_name, start_date, end_date, parseInt(no_of_days), creator_id, creator_id],
          function(err) {
            if (err) { skipped++; return processNext(); }
            imported++;
            processNext();
          }
        );
      });
    }
    processNext();
  }
};

module.exports = {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getHolidayById,
  importHolidays,
  createLeaveType,
  getLeaveTypes,
  updateLeaveType,
  deleteLeaveType,
  getLeaveTypeById,
  createLeaveApply,
  getLeaveApplies,
  updateLeaveApply,
  deleteLeaveApply,
  getLeaveApplyById,
};
