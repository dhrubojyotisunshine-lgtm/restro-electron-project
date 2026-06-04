const db = require("../utils/db");
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

const getExpenseIten = async (req, res) => {
  try {
    const { searchItem } = req.query;
    const user_id = req.id;

    const checkSubscriptionQuery =
      "SELECT * FROM superadmin_user_plans WHERE user_id = ?";

    db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (subscription) {
        return fetchExpenseItems(searchItem, user_id, res);
      }

      const checkUserCreatedByQuery =
        "SELECT created_by FROM user WHERE id = ?";

      db.get(checkUserCreatedByQuery, [user_id], (err, userData) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message,
          });
        }

        if (!userData || !userData.created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to view expense items.",
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
                message: err.message,
              });
            }

            if (!creatorSubscription) {
              return res.status(403).json({
                success: false,
                message: "Creator does not have an active subscription.",
              });
            }

            return fetchExpenseItems(searchItem, created_by, res);
          },
        );
      });
    });
  } catch (err) {
    console.error("Error fetching expense items:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

function fetchExpenseItems(searchItem, created_by, res) {
  let sql = "SELECT * FROM expense_item WHERE created_by = ?";
  let queryParams = [created_by];

  if (searchItem && searchItem.trim() !== "") {
    sql += " AND expense_item_name LIKE ?";
    queryParams.push(`%${searchItem}%`);
  }

  sql += " ORDER BY id DESC";

  db.all(sql, queryParams, (err, result) => {
    if (err) {
      console.error("Error fetching expense items:", err);

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }

    return res.status(200).json({
      success: true,
      data: result || [],
      message:
        result && result.length > 0
          ? "Expense items fetched successfully"
          : "No expense items found",
    });
  });
}

const postExpenseIten = async (req, res) => {
  try {
    const { expense_item_name } = req.body;
    const user_id = req.id;

    if (!expense_item_name) {
      return res.status(400).json({
        success: false,
        message: "expense_item_name required",
      });
    }

    const checkSubscriptionQuery =
      "SELECT * FROM superadmin_user_plans WHERE user_id = ?";

    db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (subscription) {
        return insertExpenseItem(user_id);
      }

      const checkUserCreatedByQuery =
        "SELECT created_by FROM user WHERE id = ?";

      db.get(checkUserCreatedByQuery, [user_id], (err, userData) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message,
          });
        }

        if (!userData || !userData.created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to add expense item.",
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
                message: err.message,
              });
            }

            if (!creatorSubscription) {
              return res.status(403).json({
                success: false,
                message: "Creator does not have an active subscription.",
              });
            }

            return insertExpenseItem(created_by);
          },
        );
      });
    });

    function insertExpenseItem(created_by) {
      const sql = `
        INSERT INTO expense_item (expense_item_name, created_by)
        VALUES (?, ?)
      `;

      db.run(sql, [expense_item_name, created_by], function (err) {
        if (err) {
          console.error("Insert error:", err);
          return res.status(500).json({
            success: false,
            message: "Server error",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Expense item inserted successfully",
          created_by_used: created_by,
          id: this.lastID,
        });
      });
    }
  } catch (err) {
    console.error("Insert error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteExpenseItem = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM expense_item WHERE id = ?`;
    await dbQuery(sql, [id]);
    res.status(200).json({ message: "Successfully Deleted" });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ message: "An error occurred" });
  }
};
const getExpenseItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `SELECT * FROM expense_item WHERE id = ?`;
    const result = await dbQuery(sql, [id]);

    if (result.length > 0) {
      res.status(200).json({ data: result[0] });
    } else {
      res.status(404).json({ message: "Expense item not found" });
    }
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ message: "An error occurred" });
  }
};

const DbQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        return reject(err);
      }
      // `this` refers to the statement context, which contains `changes`
      resolve({ changes: this.changes });
    });
  });
};

const updateExpenseItem = async (req, res) => {
  const { id } = req.params;
  const { expense_item_name } = req.body;
  console.log(expense_item_name, "dd");

  const sql = `UPDATE expense_item SET expense_item_name = ? WHERE id = ?`;
  const result = await DbQuery(sql, [expense_item_name, id]);

  if (result.changes > 0) {
    res.status(200).json({ message: "Expense item updated successfully" });
  } else {
    res
      .status(404)
      .json({ message: "Expense item not found or no changes made" });
  }
};

// add expense page
const getExpenses = async (req, res) => {
  try {
    const { seachItem } = req.query;
    const user_id = req.id;

    const checkSubscriptionQuery =
      "SELECT * FROM superadmin_user_plans WHERE user_id = ?";

    db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (subscription) {
        return fetchExpenses(seachItem, user_id, res);
      }

      const checkUserCreatedByQuery =
        "SELECT created_by FROM user WHERE id = ?";

      db.get(checkUserCreatedByQuery, [user_id], (err, userData) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message,
          });
        }

        if (!userData || !userData.created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to view expenses.",
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
                message: err.message,
              });
            }

            if (!creatorSubscription) {
              return res.status(403).json({
                success: false,
                message: "Creator does not have an active subscription.",
              });
            }

            return fetchExpenses(seachItem, created_by, res);
          },
        );
      });
    });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the expenses",
    });
  }
};

function fetchExpenses(seachItem, created_by, res) {
  let sql = `
    SELECT e.*, ei.expense_item_name, e.amount, e.date
    FROM expense e
    LEFT JOIN expense_item ei ON ei.id = e.type
    WHERE e.created_by = ?
  `;

  const params = [created_by];

  if (seachItem && seachItem.trim() !== "") {
    sql += `
      AND (
        ei.expense_item_name LIKE ?
        OR e.amount LIKE ?
        OR e.date LIKE ?
      )
    `;

    params.push(`%${seachItem}%`, `%${seachItem}%`, `%${seachItem}%`);
  }

  sql += ` ORDER BY e.id DESC`;

  db.all(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching expenses:", err);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching the expenses",
      });
    }

    return res.status(200).json({
      success: true,
      data: results,
    });
  });
}

const createExpense = async (req, res) => {
  const { VDate, type, paytype, amount, bankid } = req.body;

  const user_id = req.id;
  const voucher_no = new Date().toISOString().replace(/[-T:.Z]/g, "");
  const createdate = new Date().toISOString().slice(0, 19).replace("T", " ");
  const Vtype = "Expense";

  const checkSubscriptionQuery =
    "SELECT * FROM superadmin_user_plans WHERE user_id = ?";

  db.get(checkSubscriptionQuery, [user_id], (err, subscription) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    if (subscription) {
      return insertExpense(user_id);
    }

    const checkUserCreatedByQuery = "SELECT created_by FROM user WHERE id = ?";

    db.get(checkUserCreatedByQuery, [user_id], (err, userData) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (!userData || !userData.created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to create expense.",
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
              message: err.message,
            });
          }

          if (!creatorSubscription) {
            return res.status(403).json({
              success: false,
              message: "Creator does not have an active subscription.",
            });
          }

          return insertExpense(created_by);
        },
      );
    });
  });

  async function insertExpense(CreateBy) {
    const sql = `
      INSERT INTO expense (date, type, voucher_no, amount, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const result = await dbQuery(sql, [
        VDate,
        type,
        voucher_no,
        amount,
        CreateBy,
      ]);

      if (Number(paytype) === 1) {
        const cashInHandQuery = `
          INSERT INTO acc_transaction (
            VNo, Vtype, VDate, COAID, Narration,
            Debit, Credit, IsPosted, CreateBy, CreateDate, IsAppove
          ) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const cashInHandParams = [
          voucher_no,
          Vtype,
          VDate,
          "1020101",
          `${type} Expense ${voucher_no}`,
          0,
          amount,
          1,
          CreateBy,
          createdate,
          1,
        ];

        await dbQuery(cashInHandQuery, cashInHandParams);
      } else {
        const bankSummaryQuery = `
          INSERT INTO bank_summary (
            date, ac_type, bank_id, description,
            deposite_id, dr, cr, ammount, status
          ) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const bankSummaryParams = [
          VDate,
          "Credit (-)",
          bankid,
          `${type} Expense`,
          voucher_no,
          null,
          amount,
          amount,
          1,
        ];

        await dbQuery(bankSummaryQuery, bankSummaryParams);
      }

      return res.status(201).json({
        success: true,
        message: "Expense created successfully",
        data: result,
      });
    } catch (err) {
      console.error("Error creating expense:", err);
      return res.status(500).json({
        success: false,
        message: "An error occurred while creating the expense",
      });
    }
  }
};

const deleteExpense = async (req, res) => {
  const voucher_no = req.params.id;

  // SQL query to delete an expense
  const sql = `
    DELETE FROM expense WHERE voucher_no = ?
  `;

  try {
    // Execute the delete query
    const result = await dbQuery(sql, [voucher_no]);

    if (result.affectedRows === 0) {
      // If no rows were affected, the voucher_no might not exist
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    // Optionally, you can also delete related transactions from acc_transaction and bank_summary
    await dbQuery(`DELETE FROM acc_transaction WHERE VNo = ?`, [voucher_no]);
    await dbQuery(`DELETE FROM bank_summary WHERE deposite_id = ?`, [
      voucher_no,
    ]);

    res
      .status(200)
      .json({ success: true, message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the expense",
    });
  }
};
module.exports = {
  getExpenseIten,
  postExpenseIten,
  deleteExpenseItem,
  getExpenseItemById,
  updateExpenseItem,
  getExpenses,
  createExpense,
  deleteExpense,
};
