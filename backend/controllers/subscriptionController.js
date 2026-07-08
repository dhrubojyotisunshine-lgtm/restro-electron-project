const db = require("../utils/db");
const verifyToken = require("../middleware/authicantejwt");
const axios = require("axios");

const LIVE_API_URL = "https://krayon.softwarestesting.co.in/api";

const getAllPlans = (req, res) => {
  db.all(
    `SELECT * FROM subscription_plans
     WHERE status = 'Active'
       AND plan_id IN (
         SELECT MAX(plan_id) FROM subscription_plans WHERE status = 'Active' GROUP BY package_name
       )
     GROUP BY plan_id
     ORDER BY plan_id ASC`,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error fetching subscription plans:", err);
        return res.status(500).json({ success: false, message: "Error fetching plans" });
      }
      res.status(200).json({ success: true, data: rows });
    }
  );
};

const getSubscriptionsByUser = (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const query = `
    SELECT
      sup.user_plan_id,
      sup.start_date,
      sup.end_date,
      sup.trial_date,
      sup.package_status,
      sup.payment_type,
      sup.payment_method AS paid_via,
      NULL AS transaction_id,
      sp.package_name,
      sp.price_with_currency,
      CASE
        WHEN sup.end_date IS NOT NULL AND date('now') > sup.end_date THEN 'Expired'
        WHEN LOWER(sup.package_status) = 'superseded' THEN 'Superseded'
        WHEN LOWER(sup.package_status) = 'approved' AND date('now') <= sup.end_date THEN 'Active'
        WHEN LOWER(sup.package_status) = 'pending' THEN 'Pending'
        ELSE 'Unknown'
      END AS plan_status
    FROM superadmin_user_plans sup
    LEFT JOIN subscription_plans sp ON sup.plan_id = sp.plan_id
    WHERE sup.user_id = ?
    ORDER BY sup.user_plan_id DESC
  `;
  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error("Error fetching subscriptions:", err);
      return res.status(500).json({ success: false, message: "Error fetching subscriptions" });
    }
    res.status(200).json({ success: true, data: rows });
  });
};

const createSubscription = (req, res) => {
  const { user_id, plan_id } = req.body;
  if (!user_id || !plan_id) {
    return res.status(400).json({ success: false, message: "user_id and plan_id are required" });
  }
  db.run(
    `INSERT INTO superadmin_user_plans (user_id, plan_id, package_status) VALUES (?, ?, 'Pending')`,
    [user_id, plan_id],
    function (err) {
      if (err) {
        console.error("Error creating subscription:", err);
        return res.status(500).json({ success: false, message: "Error creating subscription" });
      }
      res.status(200).json({ success: true, message: "Subscription request submitted (Pending approval)" });
    }
  );
};

// Strips ISO timestamp to YYYY-MM-DD for SQLite date() compatibility
const toDateOnly = (val) => {
  if (!val) return val;
  return String(val).slice(0, 10);
};

// Shared DB upsert logic used by both syncSubscriptionData and triggerSubscriptionSync
const upsertToLocalDB = (subscriptions, plans, callback) => {
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    if (plans && plans.length > 0) {
      // Deduplicate by plan_id — prevents JOIN multiplication when subscription_plans has no UNIQUE constraint
      const uniquePlans = Object.values(
        plans.reduce((acc, p) => { acc[p.plan_id] = p; return acc; }, {})
      );
      const planStmt = db.prepare(
        `INSERT OR IGNORE INTO subscription_plans (plan_id, package_name, price_with_currency) VALUES (?, ?, ?)`
      );
      uniquePlans.forEach((p) => {
        planStmt.run(p.plan_id, p.package_name, p.price_with_currency);
      });
      planStmt.finalize();
    }

    const insertStmt = db.prepare(
      `INSERT OR IGNORE INTO superadmin_user_plans
       (user_plan_id, user_id, plan_id, start_date, end_date, trial_date, package_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const updateStmt = db.prepare(
      `UPDATE superadmin_user_plans
       SET package_status = ?, start_date = ?, end_date = ?, trial_date = ?
       WHERE user_plan_id = ?`
    );
    subscriptions.forEach((s) => {
      const start = toDateOnly(s.start_date);
      const end = toDateOnly(s.end_date);
      const trial = toDateOnly(s.trial_date);
      insertStmt.run(s.user_plan_id, s.user_id, s.plan_id, start, end, trial, s.package_status);
      updateStmt.run(s.package_status, start, end, trial, s.user_plan_id);
    });
    insertStmt.finalize();
    updateStmt.finalize();

    db.run("COMMIT", callback);
  });
};

// Called by frontend (via POST body) — existing endpoint kept for compatibility
const syncSubscriptionData = (req, res) => {
  const { subscriptions, plans } = req.body;
  if (!subscriptions || !Array.isArray(subscriptions)) {
    return res.status(400).json({ success: false, message: "subscriptions array required" });
  }

  upsertToLocalDB(subscriptions, plans, (err) => {
    if (err) {
      db.run("ROLLBACK");
      return res.status(500).json({ success: false, message: "Sync failed" });
    }
    res.status(200).json({ success: true, message: "Subscription data synced" });
  });
};

// Backend fetches from live server, syncs locally, returns local data
// Frontend only calls localhost — no live API calls from the browser
const triggerSubscriptionSync = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  try {
    const liveRes = await axios.get(`${LIVE_API_URL}/subscriptions/${userId}`, {
      timeout: 10000,
    });
    const subscriptions = liveRes.data?.data || [];

    if (subscriptions.length > 0) {
      const plans = subscriptions
        .filter((s) => s.plan_id && s.package_name)
        .map((s) => ({
          plan_id: s.plan_id,
          package_name: s.package_name,
          price_with_currency: s.price_with_currency,
        }));

      await new Promise((resolve) => {
        upsertToLocalDB(subscriptions, plans, (err) => {
          if (err) db.run("ROLLBACK");
          resolve();
        });
      });
    }
  } catch {
    // Offline or live server error — skip sync, return local data below
  }

  // Always return local SQLite data (works offline after first sync)
  const query = `
    SELECT
      sup.user_plan_id,
      sup.start_date,
      sup.end_date,
      sup.trial_date,
      sup.package_status,
      sup.payment_type,
      sup.payment_method AS paid_via,
      NULL AS transaction_id,
      sp.package_name,
      sp.price_with_currency,
      CASE
        WHEN sup.end_date IS NOT NULL AND date('now') > sup.end_date THEN 'Expired'
        WHEN LOWER(sup.package_status) = 'superseded' THEN 'Superseded'
        WHEN LOWER(sup.package_status) = 'approved' AND date('now') <= sup.end_date THEN 'Active'
        WHEN LOWER(sup.package_status) = 'pending' THEN 'Pending'
        ELSE 'Unknown'
      END AS plan_status
    FROM superadmin_user_plans sup
    LEFT JOIN subscription_plans sp ON sup.plan_id = sp.plan_id
    WHERE sup.user_id = ?
    ORDER BY sup.user_plan_id DESC
  `;
  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error fetching subscriptions" });
    }
    res.status(200).json({ success: true, data: rows });
  });
};

// Proxies renewal request to live server so superadmin is notified
const renewPlan = async (req, res) => {
  const { userPlanId } = req.params;
  const authToken = req.headers.authorization;

  try {
    const liveRes = await axios.put(
      `${LIVE_API_URL}/renew-plan/${userPlanId}`,
      {},
      { headers: { Authorization: authToken }, timeout: 10000 }
    );
    res.status(liveRes.status).json(liveRes.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || "Failed to request renewal";
    res.status(status).json({ success: false, message });
  }
};

module.exports = {
  getAllPlans,
  getSubscriptionsByUser,
  createSubscription,
  syncSubscriptionData,
  triggerSubscriptionSync,
  renewPlan,
};
