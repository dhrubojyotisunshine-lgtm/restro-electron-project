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

function queryDb(query, params) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
}

// as discussed with filter get api done according to total sales and table no because in frontend filter is not working
const getTableBySale = async (req, res) => {
  try {
    const { from, to } = req.query;
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
        message: "You are not authorized to view table sale report",
      });
    }

    let sql = `
      SELECT 
        t.tableid, 
        t.tablename,
        SUM(co.totalamount) AS total_amount
      FROM rest_table t
      JOIN customer_order co ON co.table_no = t.tableid
      JOIN bill b ON b.order_id = co.order_id
      WHERE co.order_status = 4 
        AND b.bill_status = 1
        AND co.created_by = ?
    `;

    const params = [creatorId];

    if (from && to) {
      sql += ` AND co.order_date BETWEEN ? AND ?`;
      params.push(from, to);
    }

    sql += ` GROUP BY t.tableid, t.tablename`;

    const results = await queryDb(sql, params);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("Error fetching table by sale report:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the table by sale report",
    });
  }
};

const salesReport = async (req, res) => {
  const { from, to, saleinvoice, payment_method_id, searchItem } = req.query;
  const userId = req.id;

  try {
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
        message: "You are not authorized to view sales report",
      });
    }

    let params = [creatorId];

    let sql = `
      SELECT 
        co.saleinvoice,
        c.customer_name,
        p.payment_method,
        b.total_amount,
        b.service_charge,
        b.VAT,
        b.discount,
        b.bill_amount,
        co.order_date
      FROM customer_order co
      JOIN bill b ON b.order_id = co.order_id
      LEFT JOIN customer_info c ON co.customer_id = c.customer_id
      LEFT JOIN payment_method p ON b.payment_method_id = p.payment_method_id
      WHERE b.bill_status = 1 
        AND co.order_status = 4
        AND co.created_by = ?
    `;

    if (from && to) {
      sql += ` AND co.order_date BETWEEN ? AND ?`;
      params.push(from, to);
    }

    if (saleinvoice) {
      sql += ` AND co.saleinvoice = ?`;
      params.push(saleinvoice);
    }

    if (payment_method_id) {
      sql += ` AND b.payment_method_id = ?`;
      params.push(payment_method_id);
    }

    if (searchItem) {
      sql += `
        AND (
          c.customer_name LIKE ?
          OR co.saleinvoice LIKE ?
          OR p.payment_method LIKE ?
          OR b.total_amount LIKE ?
          OR b.service_charge LIKE ?
          OR b.VAT LIKE ?
          OR b.discount LIKE ?
          OR b.bill_amount LIKE ?
        )
      `;

      const searchTerm = `%${searchItem}%`;

      params.push(
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
      );
    }

    sql += ` ORDER BY co.order_id DESC`;

    const results = await queryDb(sql, params);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("Error fetching sales report:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the sales report",
    });
  }
};

// const getWaiterTotalAmount = async (req, res) => {
//   try {
//     const { from, to, searchItem } = req.query;

//     // Base SQL query
//     let sql = `
//       SELECT co.waiter_id, SUM(co.totalamount) AS total_amount,
//       CONCAT(w.first_name, ' ', w.last_name) AS WaiterName
//       FROM customer_order co
//       JOIN bill b ON b.order_id = co.order_id
//       LEFT JOIN employee_history w ON co.waiter_id = w.emp_his_id
//       WHERE co.order_status = 4
//         AND b.bill_status = 1
//         AND co.waiter_id > 0
//     `;

//     const queryParams = [];

//     // Add date filtering if both from and to dates are provided
//     if (from && to) {
//       sql += ` AND co.order_date BETWEEN ? AND ?`;
//       queryParams.push(from, to);
//     }

//     // Group by waiter_id to get total amounts per waiter
//     sql += ` GROUP BY co.waiter_id`;

//     // Add the search condition if searchItem is provided
//     if (searchItem) {
//       const searchQuery = `%${searchItem}%`;
//       sql += `
//         HAVING CONCAT(WaiterName) LIKE ?
//         OR total_amount LIKE ?
//       `;
//       queryParams.push(searchQuery, searchQuery);
//     }

//     // Order by total amount in descending order
//     sql += ` ORDER BY total_amount DESC`;

//     // Execute the query
//     const results = await dbQuery(sql, queryParams);

//     // Respond with results
//     res.status(200).json({
//       success: true,
//     });
//     data: results
//   } catch (err) {
//     console.error('Error fetching total amount for waiters:', err);
//     res.status(500).json({
//       success: false,
//       message: 'An error occurred while fetching the total amount for waiters'
//     });
//   }
// };

const getWaiterTotalAmount = async (req, res) => {
  try {
    const { from, to, searchItem } = req.query;
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
        message: "You are not authorized to view waiter report",
      });
    }

    let sql = `
      SELECT 
        co.waiter_id,
        SUM(co.totalamount) AS total_amount,
        w.first_name || ' ' || w.last_name AS WaiterName
      FROM customer_order co
      JOIN bill b ON b.order_id = co.order_id
      LEFT JOIN employee_history w ON co.waiter_id = w.emp_his_id
      WHERE co.order_status = 4 
        AND b.bill_status = 1 
        AND co.waiter_id > 0
        AND co.created_by = ?
    `;

    const queryParams = [creatorId];

    if (from && to) {
      sql += ` AND co.order_date BETWEEN ? AND ?`;
      queryParams.push(from, to);
    }

    sql += `
      GROUP BY co.waiter_id, w.first_name, w.last_name
    `;

    if (searchItem) {
      const searchQuery = `%${searchItem}%`;

      sql += `
        HAVING WaiterName LIKE ?
        OR total_amount LIKE ?
      `;

      queryParams.push(searchQuery, searchQuery);
    }

    sql += ` ORDER BY total_amount DESC`;

    const results = await queryDb(sql, queryParams);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("Error fetching total amount for waiters:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the total amount for waiters",
    });
  }
};

const serviceChargeReport = async (req, res) => {
  try {
    const { from, to, saleinvoice, searchItem } = req.query;
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
        message: "You are not authorized to view service charge report",
      });
    }

    let sql = `
      SELECT 
        b.order_id,
        b.service_charge
      FROM customer_order co
      JOIN bill b ON b.order_id = co.order_id
      WHERE b.bill_status = 1 
        AND co.order_status = 4
        AND co.created_by = ?
    `;

    const params = [creatorId];

    if (from && to) {
      sql += ` AND co.order_date BETWEEN ? AND ?`;
      params.push(from, to);
    }

    if (saleinvoice) {
      sql += ` AND co.saleinvoice = ?`;
      params.push(saleinvoice);
    }

    if (searchItem) {
      const searchTerm = `%${searchItem}%`;

      sql += `
        AND (
          b.order_id LIKE ?
          OR b.service_charge LIKE ?
        )
      `;

      params.push(searchTerm, searchTerm);
    }

    sql += ` ORDER BY co.order_id DESC`;

    const results = await queryDb(sql, params);

    return res.status(200).json({
      success: true,
      data: results || [],
    });
  } catch (err) {
    console.error("Error fetching service charge report:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the service charge report",
    });
  }
};

const showDataCommsion = async (req, res) => {
  try {
    const { from, to, searchItem } = req.query;
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
        message: "You are not authorized to view commission data",
      });
    }

    let sql = `
      SELECT 
        SUM(c.bill_amount) AS totalamount,
        e.pos_id,
        e.first_name || ' ' || e.last_name AS WaiterName
      FROM customer_order a
      JOIN bill c ON a.order_id = c.order_id
      LEFT JOIN employee_history e ON a.waiter_id = e.emp_his_id
      WHERE a.order_status = 4 
        AND c.bill_status = 1
        AND a.created_by = ?
    `;

    let params = [creatorId];

    if (from && to) {
      sql += ` AND a.order_date BETWEEN ? AND ?`;
      params.push(from, to);
    }

    sql += ` GROUP BY a.waiter_id, e.pos_id, e.first_name, e.last_name`;

    if (searchItem) {
      const searchQuery = `%${searchItem}%`;

      sql += `
        HAVING WaiterName LIKE ?
        OR totalamount LIKE ?
      `;

      params.push(searchQuery, searchQuery);
    }

    const results = await queryDb(sql, params);

    const updatedResults = await Promise.all(
      results.map(async (row) => {
        const commissionQuery = `
          SELECT rate 
          FROM payroll_commission_setting 
          WHERE pos_id = ?
        `;

        const commissionResults = await queryDb(commissionQuery, [row.pos_id]);

        const commissionRate =
          commissionResults.length > 0 ? commissionResults[0].rate : 0;

        return {
          ...row,
          commissionRate,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: updatedResults,
    });
  } catch (err) {
    console.error("Error fetching commission data:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching commission data",
    });
  }
};

const orderCasherReport = async (req, res) => {
  try {
    const { from, to, searchItem } = req.query;
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
        message: "You are not authorized to view cashier report",
      });
    }

    let sql = `
      SELECT 
        SUM(a.totalamount) AS totalamount,
        a.order_id,
        w.firstname || ' ' || w.lastname AS CashierName
      FROM customer_order a
      LEFT JOIN bill c ON a.order_id = c.order_id
      LEFT JOIN user w ON c.create_by = w.id
      WHERE a.order_status = 4
        AND a.created_by = ?
    `;

    const params = [creatorId];

    if (from && to) {
      sql += ` AND a.order_date BETWEEN ? AND ?`;
      params.push(from, to);
    }

    sql += ` GROUP BY c.create_by, w.firstname, w.lastname`;

    if (searchItem) {
      const searchQuery = `%${searchItem}%`;

      sql += `
        HAVING CashierName LIKE ?
        OR totalamount LIKE ?
      `;

      params.push(searchQuery, searchQuery);
    }

    sql += ` ORDER BY a.order_id DESC`;

    const results = await queryDb(sql, params);

    return res.status(200).json({
      success: true,
      data: results || [],
    });
  } catch (err) {
    console.error("Error fetching order cashier report:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the order cashier report",
    });
  }
};

const salesReportFiltering = async (req, res) => {
  try {
    const { from, to, customertype, searchItem } = req.query;
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
        message: "You are not authorized to view sales report",
      });
    }

    let sql = `
      SELECT 
        co.saleinvoice,
        co.customer_id,
        co.waiter_id,
        co.order_date,
        co.cutomertype,
        co.order_id,
        ci.customer_name,
        ci.customer_email,
        ci.customer_phone,
        ct.customer_type,
        u.firstname AS waiter_first_name,
        u.lastname AS waiter_last_name,
        b.discount,
        b.total_amount,
        b.bill_status
      FROM customer_order co
      LEFT JOIN customer_info ci ON co.customer_id = ci.customer_id
      LEFT JOIN customer_type ct ON co.cutomertype = ct.customer_type_id
      LEFT JOIN user u ON co.waiter_id = u.id
      LEFT JOIN bill b ON co.order_id = b.order_id 
      WHERE co.order_status = 4 
        AND b.bill_status = 1
        AND co.created_by = ?
    `;

    const params = [creatorId];

    if (from && to) {
      sql += ` AND co.order_date BETWEEN ? AND ?`;
      params.push(from, to);
    }

    if (customertype) {
      sql += ` AND co.cutomertype = ?`;
      params.push(customertype);
    }

    if (searchItem) {
      const searchTerm = `%${searchItem}%`;

      sql += `
        AND (
          ci.customer_name LIKE ?
          OR u.firstname LIKE ?
          OR u.lastname LIKE ?
          OR b.discount LIKE ?
          OR ct.customer_type LIKE ?
          OR co.saleinvoice LIKE ?
        )
      `;

      params.push(
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
      );
    }

    sql += ` ORDER BY co.order_id DESC`;

    const results = await queryDb(sql, params);

    const detailedResults = results.map((order) => ({
      order_id: order.order_id,
      saleinvoice: order.saleinvoice,
      order_date: order.order_date,

      customer_id: order.customer_id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,

      customertype: order.customer_type,

      waiter_id: order.waiter_id,
      first_name: order.waiter_first_name,
      last_name: order.waiter_last_name,

      discount: order.discount,
      total_amount: order.total_amount,
      bill_status: order.bill_status,
    }));

    return res.status(200).json({
      success: true,
      data: detailedResults,
    });
  } catch (err) {
    console.error("Error fetching sales report:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the sales report",
    });
  }
};

const salesByDate = async (req, res) => {
  try {
    const { from, to, searchItem } = req.query;
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
        message: "You are not authorized to view sales by date",
      });
    }

    let sql = `
      SELECT 
        co.order_id, 
        co.order_date, 
        om.price, 
        om.menuqty, 
        om.varientid, 
        om.menu_id,
        v.variantName AS varientName,
        i.ProductName AS foodName
      FROM customer_order co
      JOIN order_menu om ON co.order_id = om.order_id
      LEFT JOIN variant v ON om.varientid = v.variantid
      LEFT JOIN item_foods i ON om.menu_id = i.ProductsID
      LEFT JOIN bill b ON b.order_id = om.order_id
      WHERE co.order_status = 4 
        AND b.bill_status = 1
        AND co.created_by = ?
    `;

    const params = [creatorId];

    if (from && to) {
      sql += ` AND co.order_date BETWEEN ? AND ?`;
      params.push(from, to);
    }

    if (searchItem) {
      const searchQuery = `%${searchItem}%`;

      sql += `
        AND (
          om.menuqty LIKE ? 
          OR v.variantName LIKE ? 
          OR i.ProductName LIKE ?
          OR om.price LIKE ?
        )
      `;

      params.push(searchQuery, searchQuery, searchQuery, searchQuery);
    }

    sql += ` ORDER BY co.order_id DESC`;

    const results = await queryDb(sql, params);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("Error fetching sales by date:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching sales by date",
    });
  }
};

const itemSalesReport = async (req, res) => {
  try {
    const { from, to, categoryid, searchItem } = req.query;
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
        message: "You are not authorized to view item sales report",
      });
    }

    let sql = `
      SELECT 
        co.order_id, 
        co.order_date, 
        om.price, 
        om.menuqty, 
        om.varientid, 
        om.menu_id,
        v.variantName AS varientName,
        i.ProductName AS foodName,
        i.ProductsID
      FROM customer_order co
      JOIN order_menu om ON co.order_id = om.order_id
      LEFT JOIN variant v ON om.varientid = v.variantid
      LEFT JOIN item_foods i ON om.menu_id = i.ProductsID
      LEFT JOIN bill b ON b.order_id = om.order_id
      WHERE co.order_status = 4 
        AND b.bill_status = 1
        AND co.created_by = ?
    `;

    const params = [creatorId];

    if (categoryid) {
      sql += ` AND i.CategoryID = ?`;
      params.push(categoryid);
    }

    if (from && to) {
      sql += ` AND co.order_date BETWEEN ? AND ?`;
      params.push(from, to);
    }

    if (searchItem) {
      const searchQuery = `%${searchItem}%`;

      sql += `
        AND (
          om.menuqty LIKE ? 
          OR v.variantName LIKE ? 
          OR i.ProductName LIKE ?
          OR om.price LIKE ?
        )
      `;

      params.push(searchQuery, searchQuery, searchQuery, searchQuery);
    }

    sql += ` ORDER BY co.order_id DESC`;

    const results = await queryDb(sql, params);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("Error fetching item sales report:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching item sales report",
    });
  }
};

const getCashRegister = async (req, res) => {
  try {
    const { start_date, end_date, user_id, searchItem } = req.query;
    const loggedInUserId = req.id;

    const [userResult] = await queryDb(
      "SELECT is_admin, created_by FROM user WHERE id = ?",
      [loggedInUserId],
    );

    if (!userResult) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { is_admin, created_by } = userResult;
    const creatorId = Number(is_admin) === 1 ? loggedInUserId : created_by;

    if (!creatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view cash register data",
      });
    }

    let query = `
      SELECT 
        cr.id, 
        cr.userid, 
        cr.opening_balance, 
        cr.closing_balance, 
        cr.opendate, 
        cr.closedate, 
        cr.status, 
        cr.openingnote, 
        cr.closing_note,
        TRIM(
          COALESCE(u.firstname, '') || ' ' || COALESCE(u.lastname, '')
        ) AS username
      FROM tbl_cashregister AS cr
      LEFT JOIN user AS u ON cr.userid = u.id
      WHERE cr.status = 1
        AND (
          cr.userid = ?
          OR u.created_by = ?
        )
    `;

    const queryParams = [creatorId, creatorId];

    if (start_date && end_date) {
      query += ` AND cr.opendate BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    if (user_id) {
      query += ` AND cr.userid = ?`;
      queryParams.push(user_id);
    }

    if (searchItem) {
      query += `
        AND (
          cr.opening_balance LIKE ? 
          OR cr.closing_balance LIKE ? 
          OR TRIM(
            COALESCE(u.firstname, '') || ' ' || COALESCE(u.lastname, '')
          ) LIKE ?
        )
      `;

      const searchPattern = `%${searchItem}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY cr.id DESC`;

    const rows = await queryDb(query, queryParams);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching cash register data:", error);

    return res.status(500).json({
      success: false,
      message: "Error retrieving cash register data.",
      error: error.message,
    });
  }
};

// get cash register user

const getCashUser = async (req, res) => {
  try {
    let query = `
      SELECT cr.id, cr.userid,
             CONCAT(u.firstname, ' ', u.lastname) AS username
      FROM tbl_cashregister AS cr
      LEFT JOIN user AS u ON cr.userid = u.id
      WHERE cr.status = 1
      GROUP BY cr.userid;
    `;
    const rows = await dbQuery(query);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching cash register data:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving cash register data.",
      error: error.message,
    });
  }
};

// register viwe data
const purchaseReport = async (req, res) => {
  try {
    const { start_date, end_date, searchItem } = req.query;
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
        message: "You are not authorized to view purchase report",
      });
    }

    let query = `
      SELECT 
        a.*,
        a.invoiceid,
        a.total_price,
        b.supid,
        b.supName
      FROM purchaseitem a
      LEFT JOIN supplier b ON b.supid = a.suplierID
      WHERE a.created_by = ?
    `;

    const queryParams = [creatorId];

    if (start_date && end_date) {
      query += ` AND a.purchasedate BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    if (searchItem) {
      query += `
        AND (
          a.invoiceid LIKE ? OR 
          a.total_price LIKE ? OR 
          b.supName LIKE ?
        )
      `;

      const searchQuery = `%${searchItem}%`;
      queryParams.push(searchQuery, searchQuery, searchQuery);
    }

    query += ` ORDER BY a.purchasedate DESC`;

    const results = await queryDb(query, queryParams);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("Error fetching purchase report:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the purchase report",
    });
  }
};

const getCashRegisterView = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInUserId = req.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID parameter is required.",
      });
    }

    const [userResult] = await queryDb(
      "SELECT is_admin, created_by FROM user WHERE id = ?",
      [loggedInUserId],
    );

    if (!userResult) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { is_admin, created_by } = userResult;
    const creatorId = Number(is_admin) === 1 ? loggedInUserId : created_by;

    if (!creatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view cash register",
      });
    }

    const query1 = `
      SELECT cr.opendate, cr.closedate, cr.userid
      FROM tbl_cashregister cr
      LEFT JOIN user u ON cr.userid = u.id
      WHERE cr.id = ?
        AND (
          cr.userid = ?
          OR u.created_by = ?
        )
    `;

    const [result] = await queryDb(query1, [id, creatorId, creatorId]);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Cash register entry not found.",
      });
    }

    const { opendate, closedate, userid } = result;

    if (!opendate || !userid) {
      return res.status(404).json({
        success: false,
        message: "Open date or user ID is missing.",
      });
    }

    const isValidDate = (date) => !isNaN(new Date(date).getTime());

    const formatDateTime = (dateTime) => {
      if (!isValidDate(dateTime)) {
        throw new Error(`Invalid date value: ${dateTime}`);
      }

      const dateObj = new Date(dateTime);
      const date = dateObj.toISOString().split("T")[0];
      const time = dateObj.toTimeString().split(" ")[0];

      return { date, time };
    };

    const openDateTime = formatDateTime(opendate);

    const closeDateTime =
      closedate && isValidDate(closedate)
        ? formatDateTime(closedate)
        : { date: openDateTime.date, time: "23:59:59" };

    const query2 = `
      SELECT order_id, bill_amount 
      FROM bill 
      WHERE create_by = ? 
        AND bill_date = ? 
        AND bill_time BETWEEN ? AND ?
    `;

    const bills = await queryDb(query2, [
      userid,
      openDateTime.date,
      openDateTime.time,
      closeDateTime.time,
    ]);

    return res.status(200).json({
      success: true,
      data: bills,
    });
  } catch (error) {
    console.error("Error fetching cash register view:", error);

    return res.status(500).json({
      success: false,
      message: "Error retrieving cash register view data.",
      error: error.message,
    });
  }
};

const productwise = async (req, res) => {
  try {
    const { itemid, start_date, end_date } = req.query;
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
        message: "You are not authorized to view product-wise report",
      });
    }

    let productReportQuery = `
      SELECT 
        a.*, 
        SUM(a.itemquantity) AS totalqty, 
        b.ProductsID, 
        b.ProductName 
      FROM production a
      LEFT JOIN item_foods b ON b.ProductsID = a.itemid
      WHERE a.savedby = ?
    `;

    const queryParams = [creatorId];

    if (itemid) {
      productReportQuery += ` AND a.itemid = ?`;
      queryParams.push(itemid);
    }

    if (start_date && end_date) {
      productReportQuery += ` AND a.saveddate BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    productReportQuery += `
      GROUP BY a.itemid, b.ProductsID, b.ProductName
      ORDER BY a.saveddate DESC
    `;

    const productResults = await queryDb(productReportQuery, queryParams);

    const data = productResults.map((product) => ({
      ...product,
      ProductName: product.ProductName,
      In_Qnty: product.totalqty || 0,
      Out_Qnty: 0,
      Stock: 0,
    }));

    for (const product of data) {
      const salesQuery = `
        SELECT SUM(a.menuqty) AS totalsaleqty 
        FROM order_menu a
        LEFT JOIN customer_order b ON b.order_id = a.order_id
        WHERE a.menu_id = ? 
          AND b.order_status != 5
          AND b.created_by = ?
      `;

      const salesResults = await queryDb(salesQuery, [
        product.ProductsID,
        creatorId,
      ]);

      const totalSaleQty = salesResults[0]?.totalsaleqty || 0;

      product.Out_Qnty = totalSaleQty;
      product.Stock = product.In_Qnty - totalSaleQty;
    }

    return res.status(200).json({
      success: true,
      title: "Purchase Report",
      data,
    });
  } catch (error) {
    console.error("Error generating product-wise report:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while generating the product-wise report",
    });
  }
};

const ingredientReportById = async (start_date, end_date, id) => {
  try {
    // Query for production
    let productionQuery = `
      SELECT itemid, itemquantity
      FROM production
    `;
    const queryParams = [];
    let whereClauses = [];

    if (start_date && end_date) {
      whereClauses.push(`saveddate BETWEEN ? AND ?`);
      queryParams.push(start_date, end_date);
    }

    if (whereClauses.length > 0) {
      productionQuery += `WHERE ${whereClauses.join(" AND ")}`;
    }

    const productionResults = await dbQuery(productionQuery, queryParams);

    let totalSaleQty = 0;

    for (const production of productionResults) {
      const saleQuery = `
        SELECT 
          SUM(a.qty) AS totalsaleqty 
        FROM production_details a
        WHERE a.ingredientid = ? AND a.foodid = ?
        GROUP BY a.foodid
      `;
      const saleResults = await dbQuery(saleQuery, [id, production.itemid]);
      const saleQty = saleResults[0]?.totalsaleqty || 0;

      totalSaleQty += saleQty * production.itemquantity;
    }

    return totalSaleQty;
  } catch (error) {
    console.error("Error generating sales data:", error);
    throw new Error("Failed to calculate sales quantity.");
  }
};

const ingredientReport = async (req, res) => {
  try {
    const { start_date, end_date, pid } = req.query;
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
        message: "You are not authorized to view ingredient report",
      });
    }

    let mainQuery = `
      SELECT 
        a.*, 
        SUM(a.quantity) AS totalqty, 
        b.id, 
        b.ingredient_name, 
        b.stock_qty, 
        c.uom_short_code
      FROM purchase_details a
      LEFT JOIN ingredients b ON b.id = a.indredientid
      INNER JOIN unit_of_measurement c ON c.id = b.uom_id
      WHERE b.created_by = ?
    `;

    const queryParams = [creatorId];

    if (pid) {
      mainQuery += ` AND a.indredientid = ?`;
      queryParams.push(pid);
    }

    if (start_date && end_date) {
      mainQuery += ` AND a.purchasedate BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    mainQuery += `
      GROUP BY a.indredientid, b.id, b.ingredient_name, b.stock_qty, c.uom_short_code
      ORDER BY a.purchasedate DESC
    `;

    const mainResults = await queryDb(mainQuery, queryParams);

    const data = mainResults.map((ingredientDatas) => ({
      ProductName: ingredientDatas.ingredient_name,
      In_Qnty: `${ingredientDatas.totalqty || 0} ${ingredientDatas.uom_short_code}`,
      Out_Qnty: `${(ingredientDatas.totalqty || 0) - (ingredientDatas.stock_qty || 0)} ${ingredientDatas.uom_short_code}`,
      Stock: `${ingredientDatas.stock_qty || 0} ${ingredientDatas.uom_short_code}`,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error generating ingredient report:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while generating the ingredient report.",
    });
  }
};

const orderDelivery = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
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
        message: "You are not authorized to view order delivery report",
      });
    }

    let query = `
      SELECT 
        SUM(c.total_amount) AS totalamount,
        c.shipping_type 
      FROM customer_order a
      LEFT JOIN bill c ON a.order_id = c.order_id
      WHERE a.order_status = 4
        AND a.created_by = ?
    `;

    const queryParams = [creatorId];

    if (start_date && end_date) {
      query += ` AND a.order_date BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` GROUP BY c.shipping_type`;

    const results = await queryDb(query, queryParams);

    return res.status(200).json({
      success: true,
      data: results || [],
    });
  } catch (error) {
    console.error("Error fetching order delivery data:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching order delivery data.",
    });
  }
};
module.exports = {
  getTableBySale,
  salesReport,
  getWaiterTotalAmount,
  serviceChargeReport,
  showDataCommsion,
  orderCasherReport,
  salesReportFiltering,
  salesByDate,
  itemSalesReport,
  getCashRegister,
  getCashUser,
  getCashRegisterView,
  purchaseReport,
  productwise,
  ingredientReport,
  orderDelivery,
};
