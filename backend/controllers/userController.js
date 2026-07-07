const db = require("../utils/db");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

const saltRounds = 10; // You can increase this value for more security

const dbQuery = (query, values) => {
  return new Promise((resolve, reject) => {
    db.all(query, values, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

const addUser = async (req, res) => {
  try {
    const loggedInUserId = req.id;

    const body = {};
    for (let key in req.body) {
      body[key.trim()] = req.body[key];
    }

    const { firstname, lastname, about, email, password, status, is_admin } =
      body;

    if (
      !firstname ||
      !lastname ||
      !email ||
      !password ||
      status === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const checkLoggedInUserQuery = `
      SELECT id, created_by, is_admin 
      FROM user 
      WHERE id = ?
    `;

    db.get(checkLoggedInUserQuery, [loggedInUserId], (err, loggedInUser) => {
      if (err) {
        console.error("Logged-in user check error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error while checking logged-in user",
          error: err.message,
        });
      }

      if (!loggedInUser) {
        return res.status(404).json({
          success: false,
          message: "Logged-in user not found",
        });
      }

      let created_by;

      if (loggedInUser.is_admin === 1) {
        created_by = loggedInUserId;
      } else {
        if (!loggedInUser.created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to add user.",
          });
        }

        created_by = loggedInUser.created_by;
      }

      const checkEmailQuery = `
        SELECT COUNT(*) AS count 
        FROM user 
        WHERE email = ?
      `;

      db.get(checkEmailQuery, [email], async (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Database error while checking email",
            error: err.message,
          });
        }

        if (result.count > 0) {
          return res.status(409).json({
            success: false,
            message: "User with this email already exists",
          });
        }

        const image = req.file ? req.file.filename : null;
        const last_login = new Date().toISOString();
        const last_logout = null;

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertUserQuery = `
          INSERT INTO user 
          (
            firstname, 
            lastname, 
            about, 
            email, 
            password, 
            image, 
            last_login, 
            last_logout, 
            status, 
            is_admin,
            created_by
          ) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          firstname,
          lastname,
          about || "",
          email,
          hashedPassword,
          image,
          last_login,
          last_logout,
          status,
          is_admin || 0,
          created_by,
        ];

        db.run(insertUserQuery, values, function (err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error while adding user",
              error: err.message,
            });
          }

          return res.status(200).json({
            success: true,
            message: "User added successfully",
            data: { user_id: this.lastID },
          });
        });
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const loggedInUserId = req.id;
    const { searchItem } = req.query;

    const checkLoggedInUserQuery = `
      SELECT id, created_by, is_admin 
      FROM user 
      WHERE id = ?
    `;

    db.get(checkLoggedInUserQuery, [loggedInUserId], (err, loggedInUser) => {
      if (err) {
        console.error("Logged-in user check error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error while checking logged-in user",
          error: err.message,
        });
      }

      if (!loggedInUser) {
        return res.status(404).json({
          success: false,
          message: "Logged-in user not found",
        });
      }

      let sql = `
        SELECT * 
        FROM user 
        WHERE 1 = 1
      `;

      const values = [];

      if (loggedInUser.is_admin === 1) {
        sql += ` AND created_by = ? `;
        values.push(loggedInUserId);
      } else {
        if (!loggedInUser.created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to view users.",
          });
        }

        sql += ` AND created_by = ? `;
        values.push(loggedInUser.created_by);
      }

      if (searchItem && searchItem.trim() !== "") {
        const searchValue = `%${searchItem.trim()}%`;

        sql += `
          AND (
            firstname LIKE ? 
            OR lastname LIKE ? 
            OR about LIKE ? 
            OR email LIKE ? 
            OR last_login LIKE ? 
            OR last_logout LIKE ? 
            OR ip_address LIKE ? 
            OR (status = 1 AND 'active' LIKE ?)
            OR (status = 0 AND 'inactive' LIKE ?)
            OR (firstname || ' ' || lastname) LIKE ?
          )
        `;

        values.push(
          searchValue,
          searchValue,
          searchValue,
          searchValue,
          searchValue,
          searchValue,
          searchValue,
          searchValue,
          searchValue,
          searchValue,
        );
      }

      sql += ` ORDER BY id DESC`;

      db.all(sql, values, (err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Unable to fetch data",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          data,
        });
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  const sqlFetchImage = `SELECT image FROM user WHERE id = ?`;
  db.get(sqlFetchImage, [id], (err, result) => {
    if (err) {
      console.error("Error fetching image:", err);
      return res
        .status(500)
        .json({ error: "Internal Server Error", details: err });
    }

    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }

    const imageFilename = result.image;

    const sqlDeleteUser = `DELETE FROM user WHERE id = ?`;
    db.run(sqlDeleteUser, [id], function (err) {
      if (err) {
        console.error("Error deleting user:", err);
        return res
          .status(500)
          .json({ error: "Internal Server Error", details: err });
      }

      if (imageFilename) {
        const imagePath = path.join(__dirname, "../asset/user", imageFilename);
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Error deleting image file:", unlinkErr);
              return res
                .status(500)
                .json({ error: "Internal Server Error", details: unlinkErr });
            }
            return res.json({
              message: "User and image file deleted successfully",
            });
          });
        } else {
          return res.json({
            message: "User deleted successfully, image file not found",
          });
        }
      } else {
        return res.json({
          message: "User deleted successfully, no associated image",
        });
      }
    });
  });
};

const getUserById = async (req, res) => {
  try {
    const id = req.params.id; // Get user ID from the URL parameters

    const getUserQuery = "SELECT * FROM user WHERE id = ?";

    db.get(getUserQuery, [id], (err, result) => {
      if (err) {
        return res
          .status(500)
          .send({ error: "Error while fetching user", details: err.message });
      }

      if (!result) {
        return res.status(404).send({ error: "User not found" });
      }

      // Map the result to get only the necessary fields
      const user = {
        firstname: result.firstname,
        lastname: result.lastname,
        email: result.email,
        about: result.about,
        image: result.image,
        status: result.status,
        is_admin: result.is_admin,
      };

      res
        .status(200)
        .send({ message: "User retrieved successfully", data: user });
    });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Internal server error", details: err.message });
  }
};

const logoutUser = async (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE user SET last_logout = datetime('now') WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .send({ error: "Logout failed", details: err.message });
    }
    res.status(200).send({ message: "Logout successful" });
  });
};

const syncActivationData = async (req, res) => {
  const { user, restaurant, subscription, plan } = req.body;

  if (!user || !restaurant || !subscription || !plan) {
    return res.status(400).json({
      success: false,
      message: "User, restaurant, subscription and plan data are required",
    });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const userQuery = `
      INSERT OR REPLACE INTO user (
        id,
        firstname,
        lastname,
        about,
        waiter_kitchenToken,
        email,
        password,
        password_reset_token,
        image,
        last_login,
        last_logout,
        ip_address,
        counter,
        status,
        is_admin,
        authtoken,
        subscription_id,
        created_by,
        super_admin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(userQuery, [
      user.id,
      user.firstname,
      user.lastname,
      user.about,
      user.waiter_kitchenToken,
      user.email,
      user.password,
      user.password_reset_token,
      user.image,
      user.last_login,
      user.last_logout,
      user.ip_address,
      user.counter,
      user.status,
      user.is_admin,
      user.authtoken,
      user.subscription_id,
      user.created_by,
      user.super_admin,
    ]);

    const restaurantQuery = `
      INSERT OR REPLACE INTO restaurant_settings (
        sl_no,
        restaurant_name,
        invoice_logo,
        address,
        website,
        date_format,
        time_zone,
        status,
        currency_symbol,
        currency_position,
        user_id,
        phone_number,
        plan_id,
        country,
        state,
        city,
        zipcode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(restaurantQuery, [
      restaurant.sl_no,
      restaurant.restaurant_name,
      restaurant.invoice_logo,
      restaurant.address,
      restaurant.website,
      restaurant.date_format,
      restaurant.time_zone,
      restaurant.status,
      restaurant.currency_symbol,
      restaurant.currency_position,
      restaurant.user_id,
      restaurant.phone_number,
      restaurant.plan_id,
      restaurant.country,
      restaurant.state,
      restaurant.city,
      restaurant.zipcode,
    ]);

    const subscriptionQuery = `
      INSERT OR REPLACE INTO superadmin_user_plans (
        user_plan_id,
        user_id,
        plan_id,
        payment_type,
        payment_method,
        start_date,
        end_date,
        trial_date,
        package_status,
        created_by,
        created_at,
        subscription_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(subscriptionQuery, [
      subscription.user_plan_id,
      subscription.user_id,
      subscription.plan_id,
      subscription.payment_type,
      subscription.payment_method,
      subscription.start_date,
      subscription.end_date,
      subscription.trial_date,
      subscription.package_status,
      subscription.created_by,
      subscription.created_at,
      subscription.subscription_key,
    ]);

    const planQuery = `
      INSERT OR REPLACE INTO subscription_plans (
        plan_id,
        package_name,
        currency,
        price_interval,
        price_with_currency,
        number_of_active_users,
        interval_value,
        package_description,
        number_of_invoice,
        status,
        trial_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(planQuery, [
      plan.plan_id,
      plan.package_name,
      plan.currency,
      plan.price_interval,
      plan.price_with_currency,
      plan.number_of_active_users,
      plan.interval_value,
      plan.package_description,
      plan.number_of_invoice,
      plan.status,
      plan.trial_days,
    ]);

    db.run("COMMIT", (err) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({
          success: false,
          message: "Failed to sync activation data",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Activation data synced successfully",
      });
    });
  });
};

// const loginUser = async (req, res) => {
//   const { email, password } = req.body;

//   console.log(email, password);

//   const sql = `SELECT * FROM user WHERE email = ?`;

//   db.get(sql, [email], async (err, user) => {
//     // Use db.get() to fetch one row
//     if (err) {
//       return res
//         .status(500)
//         .send({ error: "Internal server error", details: err.message });
//     }

//     if (!user) {
//       // If no user found, return error
//       return res.status(401).send({ message: "Invalid email" });
//     }

//     // Compare the hashed password
//     const isPasswordMatch = await bcrypt.compare(password, user.password);
//     if (!isPasswordMatch) {
//       return res.status(401).send({ message: "Invalid email or password" });
//     }

//     // Update last login time
//     const updateSql = `UPDATE user SET last_login = datetime('now') WHERE id = ?`;
//     db.run(updateSql, [user.id], (updateErr) => {
//       if (updateErr) {
//         return res.status(500).send({
//           error: "Failed to update last login time",
//           details: updateErr.message,
//         });
//       }
//       console.log("user", user.id, user.email);
//       console.log("od", user.lastID);
//       console.log(user);
//       const payload = { id: user.id, email: user.email };

//       const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "60m" });
//       // Save token in database
//       const updateTokenSql = `UPDATE user SET authtoken = ? WHERE id = ?`;
//       db.run(updateTokenSql, [token, user.id], (tokenErr) => {
//         if (tokenErr) {
//           return res.status(500).send({
//             error: "Failed to update token",
//             details: tokenErr.message,
//           });
//         }
//         console.log("idadmin", user.is_admin);
//         console.log(user.is_admin == 1);
//         // Check if user is an admin
//         if (user.is_admin == 1) {
//           console.log(user.is_admin == 1);
//           return res.status(200).send({
//             message: "Admin login successful",
//             token,
//             userId: user.id,
//             username: `${user.firstname} ${user.lastname}`,
//             isAdmin: true,
//           });
//         } else {
//           // Fetch role_id for non-admin users
//           const roleQuery = `SELECT fk_role_id FROM sec_user_access_tbl WHERE fk_user_id = ?`;
//           db.get(roleQuery, [user.id], (roleErr, roleData) => {
//             if (roleErr) {
//               return res.status(500).send({
//                 error: "Error fetching user role",
//                 details: roleErr.message,
//               });
//             }

//             if (!roleData) {
//               return res
//                 .status(403)
//                 .send({ error: "Role not assigned to the user" });
//             }

//             const roleId = roleData.fk_role_id;

//             // Fetch permissions
//             const permissionQuery = `SELECT * FROM sec_role_permission WHERE role_id = ?`;
//             db.all(permissionQuery, [roleId], (permErr, permData) => {
//               if (permErr) {
//                 return res.status(500).send({
//                   error: "Error fetching role permissions",
//                   details: permErr.message,
//                 });
//               }

//               return res.status(200).send({
//                 message: "Login successful",
//                 token,
//                 userId: user.id,
//                 username: `${user.firstname} ${user.lastname}`,
//                 roleId,
//                 permData,
//                 isAdmin: false,
//               });
//             });
//           });
//         }
//       });
//     });
//   });
// };

const loginUser = async (req, res) => {
  const { email, password, superadmin } = req.body;

  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }

  const sql = `SELECT * FROM user WHERE email = ?`;

  db.get(sql, [email], async (err, user) => {
    if (err) {
      return res.status(500).send({
        error: "Internal server error",
        details: err.message,
      });
    }

    if (!user) {
      return res.status(401).send({ message: "Invalid email" });
    }

    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "60m" });

    const updateLoginSql = `
      UPDATE user 
      SET last_login = datetime('now'), authtoken = ? 
      WHERE id = ?
    `;

    // ✅ Super Admin Impersonation Login
    if (superadmin === true) {
      const superAdminCheckQuery = `
        SELECT * FROM user 
        WHERE super_admin = 2 
        LIMIT 1
      `;

      db.get(superAdminCheckQuery, [], (saErr, saUser) => {
        if (saErr || !saUser) {
          return res.status(403).send({
            message: "Super Admin privilege required to impersonate",
          });
        }

        db.run(updateLoginSql, [token, user.id], (updateErr) => {
          if (updateErr) {
            return res.status(500).send({
              error: "Login update failed",
              details: updateErr.message,
            });
          }

          const subQuery = `
            SELECT start_date, end_date, plan_id, package_status
            FROM superadmin_user_plans
            WHERE user_id = ?
            ORDER BY user_plan_id DESC
            LIMIT 1
          `;

          db.get(subQuery, [user.id], (subErr, plan) => {
            let subscriptionStatus = "no_subscription";

            if (plan) {
              if (plan.package_status?.toLowerCase() !== "approved") {
                subscriptionStatus = "not_approved";
              } else if (new Date() > new Date(plan.end_date)) {
                subscriptionStatus = "expired";
              } else {
                subscriptionStatus = "active";
              }
            }

            return res.status(200).send({
              message: "Admin login successful",
              token,
              userId: user.id,
              username: `${user.firstname} ${user.lastname}`,
              isAdmin: true,
              superAdmin: user.super_admin === 2,
              planData: plan || null,
              subscriptionStatus,
            });
          });
        });
      });

      return;
    }

    // ✅ Password check regular login
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    // ✅ Super Admin Normal Login
    if (user.super_admin === 2 && !superadmin) {
      db.run(updateLoginSql, [token, user.id], (updateErr) => {
        if (updateErr) {
          return res.status(500).send({
            error: "Login update failed",
            details: updateErr.message,
          });
        }

        return res.status(200).send({
          message: "Super Admin login successful",
          token,
          userId: user.id,
          username: `${user.firstname} ${user.lastname}`,
          isAdmin: false,
          superAdmin: true,
          websitelink: "https://krayon.softwarestesting.co.in/superadmin",
          subscriptionStatus: "superadmin",
        });
      });

      return;
    }

    // ✅ Plan / Subscription Check
    const subQuery = `
      SELECT start_date, end_date, plan_id, package_status
      FROM superadmin_user_plans
      WHERE user_id = ?
      ORDER BY user_plan_id DESC
      LIMIT 1
    `;

    db.get(subQuery, [user.id], (subErr, plan) => {
      let subscriptionStatus = "no_subscription";

      if (plan) {
        if (plan.package_status?.toLowerCase() !== "approved") {
          subscriptionStatus = "not_approved";
        } else if (new Date() > new Date(plan.end_date)) {
          subscriptionStatus = "expired";
        } else {
          subscriptionStatus = "active";
        }
      }

      db.run(updateLoginSql, [token, user.id], (updateErr) => {
        if (updateErr) {
          return res.status(500).send({
            error: "Login update failed",
            details: updateErr.message,
          });
        }

        // ✅ Admin Login
        if (user.is_admin == 1) {
          return res.status(200).send({
            message: "Admin login successful",
            token,
            userId: user.id,
            username: `${user.firstname} ${user.lastname}`,
            isAdmin: true,
            superAdmin: false,
            planData: plan || null,
            subscriptionStatus,
          });
        }

        // ✅ Normal User Role Permission
        const roleQuery = `
          SELECT fk_role_id 
          FROM sec_user_access_tbl 
          WHERE fk_user_id = ?
        `;

        db.get(roleQuery, [user.id], (roleErr, roleData) => {
          if (roleErr) {
            return res.status(500).send({
              error: "Error fetching user role",
              details: roleErr.message,
            });
          }

          if (!roleData) {
            return res.status(403).send({
              error: "Role not assigned to the user",
            });
          }

          const roleId = roleData.fk_role_id;

          const permissionQuery = `
            SELECT * FROM sec_role_permission 
            WHERE role_id = ?
          `;

          db.all(permissionQuery, [roleId], (permErr, permData) => {
            if (permErr) {
              return res.status(500).send({
                error: "Error fetching role permissions",
                details: permErr.message,
              });
            }

            return res.status(200).send({
              message: "Login successful",
              token,
              userId: user.id,
              username: `${user.firstname} ${user.lastname}`,
              roleId,
              permData,
              isAdmin: false,
              superAdmin: false,
              planData: plan || null,
              subscriptionStatus,
            });
          });
        });
      });
    });
  });
};
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstname, lastname, about, email, password, status, is_admin } =
    req.body;
  console.log(req.body);

  if (!password) {
    return res.status(400).send({ error: "Password is Mandatory" });
  }

  const fetchCurrentDataSql = "SELECT * FROM user WHERE id = ?";
  db.get(fetchCurrentDataSql, [id], async (fetchErr, currentData) => {
    if (fetchErr) {
      console.error("Database fetch error: ", fetchErr);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (!currentData) {
      return res.status(404).json({ error: "User not found" });
    }

    let newImageFilename = currentData.image;
    if (req.file) {
      newImageFilename = req.file.filename;

      if (currentData.image) {
        const oldFilePath = path.join(
          __dirname,
          "../assets/users",
          currentData.image,
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Error deleting old file: ", unlinkErr);
            }
          });
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const sql = `UPDATE user 
                  SET firstname = ?, lastname = ?, about = ?, email = ?, status = ?, is_admin = ?,
                      password = COALESCE(?, password), 
                      image = ?
                  WHERE id = ?`;

    const values = [
      firstname || currentData.firstname,
      lastname || currentData.lastname,
      about || currentData.about,
      email || currentData.email,
      status || currentData.status,
      is_admin || currentData.is_admin,
      hashedPassword,
      newImageFilename,
      id,
    ];

    db.run(sql, values, function (err) {
      if (err) {
        console.error("Database query error: ", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      return res.json({ message: "User data updated successfully" });
    });
  });
};

const STATIC_COUNTRIES = [
  { countryName: "Afghanistan", countryCode: "AF" },
  { countryName: "Albania", countryCode: "AL" },
  { countryName: "Algeria", countryCode: "DZ" },
  { countryName: "Andorra", countryCode: "AD" },
  { countryName: "Angola", countryCode: "AO" },
  { countryName: "Argentina", countryCode: "AR" },
  { countryName: "Armenia", countryCode: "AM" },
  { countryName: "Australia", countryCode: "AU" },
  { countryName: "Austria", countryCode: "AT" },
  { countryName: "Azerbaijan", countryCode: "AZ" },
  { countryName: "Bahrain", countryCode: "BH" },
  { countryName: "Bangladesh", countryCode: "BD" },
  { countryName: "Belarus", countryCode: "BY" },
  { countryName: "Belgium", countryCode: "BE" },
  { countryName: "Belize", countryCode: "BZ" },
  { countryName: "Benin", countryCode: "BJ" },
  { countryName: "Bhutan", countryCode: "BT" },
  { countryName: "Bolivia", countryCode: "BO" },
  { countryName: "Bosnia and Herzegovina", countryCode: "BA" },
  { countryName: "Botswana", countryCode: "BW" },
  { countryName: "Brazil", countryCode: "BR" },
  { countryName: "Brunei", countryCode: "BN" },
  { countryName: "Bulgaria", countryCode: "BG" },
  { countryName: "Burkina Faso", countryCode: "BF" },
  { countryName: "Burundi", countryCode: "BI" },
  { countryName: "Cambodia", countryCode: "KH" },
  { countryName: "Cameroon", countryCode: "CM" },
  { countryName: "Canada", countryCode: "CA" },
  { countryName: "Central African Republic", countryCode: "CF" },
  { countryName: "Chad", countryCode: "TD" },
  { countryName: "Chile", countryCode: "CL" },
  { countryName: "China", countryCode: "CN" },
  { countryName: "Colombia", countryCode: "CO" },
  { countryName: "Comoros", countryCode: "KM" },
  { countryName: "Congo", countryCode: "CG" },
  { countryName: "Costa Rica", countryCode: "CR" },
  { countryName: "Croatia", countryCode: "HR" },
  { countryName: "Cuba", countryCode: "CU" },
  { countryName: "Cyprus", countryCode: "CY" },
  { countryName: "Czech Republic", countryCode: "CZ" },
  { countryName: "Denmark", countryCode: "DK" },
  { countryName: "Djibouti", countryCode: "DJ" },
  { countryName: "Dominican Republic", countryCode: "DO" },
  { countryName: "Ecuador", countryCode: "EC" },
  { countryName: "Egypt", countryCode: "EG" },
  { countryName: "El Salvador", countryCode: "SV" },
  { countryName: "Eritrea", countryCode: "ER" },
  { countryName: "Estonia", countryCode: "EE" },
  { countryName: "Eswatini", countryCode: "SZ" },
  { countryName: "Ethiopia", countryCode: "ET" },
  { countryName: "Fiji", countryCode: "FJ" },
  { countryName: "Finland", countryCode: "FI" },
  { countryName: "France", countryCode: "FR" },
  { countryName: "Gabon", countryCode: "GA" },
  { countryName: "Gambia", countryCode: "GM" },
  { countryName: "Georgia", countryCode: "GE" },
  { countryName: "Germany", countryCode: "DE" },
  { countryName: "Ghana", countryCode: "GH" },
  { countryName: "Greece", countryCode: "GR" },
  { countryName: "Guatemala", countryCode: "GT" },
  { countryName: "Guinea", countryCode: "GN" },
  { countryName: "Haiti", countryCode: "HT" },
  { countryName: "Honduras", countryCode: "HN" },
  { countryName: "Hungary", countryCode: "HU" },
  { countryName: "Iceland", countryCode: "IS" },
  { countryName: "India", countryCode: "IN" },
  { countryName: "Indonesia", countryCode: "ID" },
  { countryName: "Iran", countryCode: "IR" },
  { countryName: "Iraq", countryCode: "IQ" },
  { countryName: "Ireland", countryCode: "IE" },
  { countryName: "Israel", countryCode: "IL" },
  { countryName: "Italy", countryCode: "IT" },
  { countryName: "Jamaica", countryCode: "JM" },
  { countryName: "Japan", countryCode: "JP" },
  { countryName: "Jordan", countryCode: "JO" },
  { countryName: "Kazakhstan", countryCode: "KZ" },
  { countryName: "Kenya", countryCode: "KE" },
  { countryName: "Kuwait", countryCode: "KW" },
  { countryName: "Kyrgyzstan", countryCode: "KG" },
  { countryName: "Laos", countryCode: "LA" },
  { countryName: "Latvia", countryCode: "LV" },
  { countryName: "Lebanon", countryCode: "LB" },
  { countryName: "Lesotho", countryCode: "LS" },
  { countryName: "Liberia", countryCode: "LR" },
  { countryName: "Libya", countryCode: "LY" },
  { countryName: "Liechtenstein", countryCode: "LI" },
  { countryName: "Lithuania", countryCode: "LT" },
  { countryName: "Luxembourg", countryCode: "LU" },
  { countryName: "Madagascar", countryCode: "MG" },
  { countryName: "Malawi", countryCode: "MW" },
  { countryName: "Malaysia", countryCode: "MY" },
  { countryName: "Maldives", countryCode: "MV" },
  { countryName: "Mali", countryCode: "ML" },
  { countryName: "Malta", countryCode: "MT" },
  { countryName: "Mauritania", countryCode: "MR" },
  { countryName: "Mauritius", countryCode: "MU" },
  { countryName: "Mexico", countryCode: "MX" },
  { countryName: "Moldova", countryCode: "MD" },
  { countryName: "Monaco", countryCode: "MC" },
  { countryName: "Mongolia", countryCode: "MN" },
  { countryName: "Montenegro", countryCode: "ME" },
  { countryName: "Morocco", countryCode: "MA" },
  { countryName: "Mozambique", countryCode: "MZ" },
  { countryName: "Myanmar", countryCode: "MM" },
  { countryName: "Namibia", countryCode: "NA" },
  { countryName: "Nepal", countryCode: "NP" },
  { countryName: "Netherlands", countryCode: "NL" },
  { countryName: "New Zealand", countryCode: "NZ" },
  { countryName: "Nicaragua", countryCode: "NI" },
  { countryName: "Niger", countryCode: "NE" },
  { countryName: "Nigeria", countryCode: "NG" },
  { countryName: "North Korea", countryCode: "KP" },
  { countryName: "North Macedonia", countryCode: "MK" },
  { countryName: "Norway", countryCode: "NO" },
  { countryName: "Oman", countryCode: "OM" },
  { countryName: "Pakistan", countryCode: "PK" },
  { countryName: "Palestine", countryCode: "PS" },
  { countryName: "Panama", countryCode: "PA" },
  { countryName: "Papua New Guinea", countryCode: "PG" },
  { countryName: "Paraguay", countryCode: "PY" },
  { countryName: "Peru", countryCode: "PE" },
  { countryName: "Philippines", countryCode: "PH" },
  { countryName: "Poland", countryCode: "PL" },
  { countryName: "Portugal", countryCode: "PT" },
  { countryName: "Qatar", countryCode: "QA" },
  { countryName: "Romania", countryCode: "RO" },
  { countryName: "Russia", countryCode: "RU" },
  { countryName: "Rwanda", countryCode: "RW" },
  { countryName: "Saudi Arabia", countryCode: "SA" },
  { countryName: "Senegal", countryCode: "SN" },
  { countryName: "Serbia", countryCode: "RS" },
  { countryName: "Sierra Leone", countryCode: "SL" },
  { countryName: "Singapore", countryCode: "SG" },
  { countryName: "Slovakia", countryCode: "SK" },
  { countryName: "Slovenia", countryCode: "SI" },
  { countryName: "Somalia", countryCode: "SO" },
  { countryName: "South Africa", countryCode: "ZA" },
  { countryName: "South Korea", countryCode: "KR" },
  { countryName: "South Sudan", countryCode: "SS" },
  { countryName: "Spain", countryCode: "ES" },
  { countryName: "Sri Lanka", countryCode: "LK" },
  { countryName: "Sudan", countryCode: "SD" },
  { countryName: "Sweden", countryCode: "SE" },
  { countryName: "Switzerland", countryCode: "CH" },
  { countryName: "Syria", countryCode: "SY" },
  { countryName: "Taiwan", countryCode: "TW" },
  { countryName: "Tajikistan", countryCode: "TJ" },
  { countryName: "Tanzania", countryCode: "TZ" },
  { countryName: "Thailand", countryCode: "TH" },
  { countryName: "Timor-Leste", countryCode: "TL" },
  { countryName: "Togo", countryCode: "TG" },
  { countryName: "Trinidad and Tobago", countryCode: "TT" },
  { countryName: "Tunisia", countryCode: "TN" },
  { countryName: "Turkey", countryCode: "TR" },
  { countryName: "Turkmenistan", countryCode: "TM" },
  { countryName: "Uganda", countryCode: "UG" },
  { countryName: "Ukraine", countryCode: "UA" },
  { countryName: "United Arab Emirates", countryCode: "AE" },
  { countryName: "United Kingdom", countryCode: "GB" },
  { countryName: "United States", countryCode: "US" },
  { countryName: "Uruguay", countryCode: "UY" },
  { countryName: "Uzbekistan", countryCode: "UZ" },
  { countryName: "Venezuela", countryCode: "VE" },
  { countryName: "Vietnam", countryCode: "VN" },
  { countryName: "Yemen", countryCode: "YE" },
  { countryName: "Zambia", countryCode: "ZM" },
  { countryName: "Zimbabwe", countryCode: "ZW" },
].map((c, i) => ({ ...c, id: i + 1 }));

const getAllCountry = async (req, res) => {
  res.status(200).json({ data: STATIC_COUNTRIES });
};

// States by country
const getStatesByCountry = async (req, res) => {
  try {
    const countryName = req.params.countryName;

    // ✅ 1. Validation
    if (!countryName) {
      return res.status(400).json({ error: "Country name is required" });
    }

    console.log("✅ Fetching states for:", countryName);

    // ✅ 2. Axios call with timeout
    const response = await axios.post(
      "https://countriesnow.space/api/v0.1/countries/states",
      { country: countryName },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000, // ✅ 10 sec timeout added
      },
    );

    // ✅ 3. Safe API response check
    if (
      !response.data ||
      !response.data.data ||
      !Array.isArray(response.data.data.states)
    ) {
      console.log("⚠️ No states array from API:", response.data);
      return res.status(404).json({
        data: [],
        error: "No states found for this country",
      });
    }

    // ✅ 4. Clean mapping
    const states = response.data.data.states.map((state, index) => ({
      stateName: state.name,
      id: index + 1,
    }));

    res.status(200).json({ data: states });
  } catch (error) {
    // ✅ 5. Proper detailed backend logs
    console.error("❌ FULL STATE API ERROR:");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response from API:", error.message);
    } else {
      console.error("Axios setup error:", error.message);
    }

    // ✅ 6. Frontend safe response
    res.status(500).json({
      data: [],
      error: "Failed to retrieve states",
      reason: error.message,
    });
  }
};

// Cities by country + state
const getCitiesByState = async (req, res) => {
  try {
    const { countryName, stateName } = req.params;

    const response = await axios.post(
      "https://countriesnow.space/api/v0.1/countries/state/cities",
      { country: countryName, state: stateName },
      { headers: { "Content-Type": "application/json" } }, // ✅ must
    );

    if (!response.data.data) {
      return res.status(404).json({ data: [], error: "No cities found" });
    }

    const cities = response.data.data.map((city, index) => ({
      cityName: city,
      id: index + 1,
    }));

    res.status(200).json({ data: cities });
  } catch (error) {
    console.error(
      "Error fetching cities:",
      error.response?.data || error.message,
    );
    res.status(500).json({ error: "Failed to retrieve cities" });
  }
};

const checkIncheckOut = async (req, res) => {
  try {
    // ✅ SQLite uses `||` instead of CONCAT()
    const query = `SELECT id, firstname || ' ' || lastname AS username, last_login, last_logout FROM user`;

    const result = await dbQuery(query);

    if (result.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    const formatDateTime = (dateTime) => {
      if (!dateTime) return { date: null, time: null };
      const dateObj = new Date(dateTime);
      if (isNaN(dateObj)) {
        throw new Error(`Invalid date value: ${dateTime}`);
      }
      const date = dateObj.toISOString().split("T")[0];
      const time = dateObj.toTimeString().split(" ")[0];
      return { date, time };
    };

    const dataMap = result.map((data) => {
      const loginDateTime = formatDateTime(data.last_login);
      const logoutDateTime = formatDateTime(data.last_logout);

      return {
        userid: data.id,
        username: data.username,
        last_login_date: loginDateTime.date,
        last_login_time: loginDateTime.time,
        last_logout_date: logoutDateTime.date,
        last_logout_time: logoutDateTime.time,
      };
    });

    res.status(200).json({ data: dataMap });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

const ForgetPasswordController = async (req, res) => {
  const { email } = req.body;
  console.log("email", email);

  try {
    // ✅ SQLite query (same as MySQL here since placeholders are also ?)
    const rows = await dbQuery("SELECT * FROM user WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = rows[0];
    const id = user.id;

    const token = jwt.sign({ id: id }, process.env.JWT_SECRET || "uhkjhkh", {
      expiresIn: "1h",
    });

    const transporter = nodemailer.createTransport({
      host: "mail.theprojectxyz.xyz",
      port: 465,
      secure: true,
      auth: {
        user: "akashlakshkar@theprojectxyz.xyz",
        pass: "jBkPx@+Wjj^A",
      },
    });

    console.log("userid and token", id, token);

    const mailOptions = {
      from: "support@krayon.upgradu.in",
      to: user.email,
      subject: "Password Reset Request",
      html: `
              <h1>Password Reset Request</h1>
              <p>You requested a password reset. Click the link below to reset your password:</p>
              <p><a href="https://krayon.theprojectxyz.xyz/frontend/resetpassword/${id}/${token}">Reset Password</a></p>
              <p>If you did not request this, please ignore this email.</p>
          `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    res.status(200).json({ message: "Password reset link sent to email" });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const resetPasswordController = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    console.log("Reset Password Initiated");
    console.log("User ID and Token:", id, token);

    // ✅ SQLite-compatible SELECT query
    const user = await dbQuery("SELECT * FROM user WHERE id = ?", [id]);
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    console.log("User Found:", user);

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ✅ SQLite-compatible UPDATE query
    await dbQuery("UPDATE user SET password = ? WHERE id = ?", [
      hashedPassword,
      id,
    ]);

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error in Reset Password Controller:", error);
    res
      .status(500)
      .json({ error: "An error occurred while resetting the password." });
  }
};

module.exports = {
  addUser,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  syncActivationData,
  getStatesByCountry,
  getCitiesByState,
  loginUser,
  logoutUser,
  getAllCountry,
  checkIncheckOut,
  ForgetPasswordController,
  resetPasswordController,
};
