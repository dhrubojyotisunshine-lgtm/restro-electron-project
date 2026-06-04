const db = require("../utils/db");

// Get all customer types
const getCustomerTypes = async (req, res) => {
  const { SearchItem } = req.query;

  // SQL query: if SearchItem is provided, search for it; otherwise, return all data
  const sql = SearchItem
    ? "SELECT * FROM customer_type WHERE customer_type LIKE ? OR customer_type_id LIKE ? ORDER BY customer_type_id DESC"
    : "SELECT * FROM customer_type ORDER BY customer_type_id DESC";

  const values = SearchItem ? [`%${SearchItem}%`, `%${SearchItem}%`] : [];

  db.all(sql, values, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.json(results);
  });
};

module.exports = { getCustomerTypes };
