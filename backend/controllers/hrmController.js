const db = require("../utils/db");
const bcrypt = require("bcryptjs");
const saltRounds = 10; // You can increase this value for more security
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

const runDb = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else
        resolve({
          lastID: this.lastID,
          changes: this.changes,
        });
    });
  });
};
const getAllEmployeeHistories = async (req, res) => {
  try {
    const { searchItem } = req.query;
    let sql = `

     SELECT 
    eh.emp_his_id,
    p.position_name,
    d.department_name,
    dy.type_name,
     
   
    
    eh.first_name, 
    eh.last_name,
    eh.email,
    eh.phone,
    eh.hire_date,
    eh.original_hire_date,
    eh.picture
FROM 
    employee_history eh 
LEFT JOIN 
    position p 
    ON p.pos_id = eh.pos_id 
LEFT JOIN 
    duty_type dy 
    ON eh.duty_type = dy.id
LEFT JOIN 
    department d
    ON d.dept_id = eh.division_id

`;
    const queryParams = [];

    if (searchItem && searchItem.trim() !== "") {
      const searchQuery = `%${searchItem}%`;
      sql += ` WHERE 
        eh.first_name LIKE ? OR 
        eh.last_name LIKE ? OR 
        CONCAT(eh.first_name, ' ', eh.last_name) LIKE ? 
        OR
        p.position_name LIKE ? OR 
   
        d.department_name LIKE ? OR 
        dy.type_name LIKE ? OR 
        eh.email LIKE ? OR 
        eh.phone LIKE ?`;

      // Push the search parameters for each field
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

    sql += ` ORDER BY eh.emp_his_id DESC`;
    // Execute the query
    const results = await dbQuery(sql, queryParams);

    // Check if results exist and return formatted data
    if (results.length > 0) {
      const formattedResult = results.map((result) => ({
        emp_his_id: result.emp_his_id,
        photograph: result.picture,
        FirstName: result.first_name,
        LastName: result.last_name,
        Designation: result.position_name,
        Phone: result.phone,
        Email_Address: result.email,
        Division: result.department_name,
        Duty_type: result.type_name,
        Hire_Date: result.hire_date,
        Original_Hire_Date: result.original_hire_date,
      }));

      res.status(200).json({ success: true, data: formattedResult });
    } else {
      res.status(200).json({ success: true, data: [] });
    }
  } catch (err) {
    console.error("Error fetching employee histories:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching employee histories",
    });
  }
};

const createDesignation = async (req, res) => {
  const { position_name, position_details } = req.body;
  const user_id = req.id;

  try {
    // Step 1: Check subscription for logged-in user
    const subscriptionData = await dbQuery(
      "SELECT * FROM superadmin_user_plans WHERE user_id = ?",
      [user_id],
    );

    let created_by;

    if (subscriptionData.length > 0) {
      created_by = subscriptionData[0].user_id;
    } else {
      // Step 2: Check creator
      const userData = await dbQuery(
        "SELECT created_by FROM user WHERE id = ?",
        [user_id],
      );

      if (!userData || userData.length === 0 || !userData[0].created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to create a designation.",
        });
      }

      created_by = userData[0].created_by;

      // Step 3: Check creator subscription
      const creatorSubscription = await dbQuery(
        "SELECT * FROM superadmin_user_plans WHERE user_id = ?",
        [created_by],
      );

      if (creatorSubscription.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Creator does not have an active subscription.",
        });
      }
    }

    // Step 4: Insert designation
    const sql = `
      INSERT INTO position
      (position_name, position_details, created_by)
      VALUES (?, ?, ?)
    `;

    const result = await runDb(sql, [
      position_name,
      position_details,
      created_by,
    ]);

    return res.status(201).json({
      success: true,
      message: "Position created successfully.",
      data: {
        id: result.lastID,
      },
    });
  } catch (err) {
    console.error("Error creating position:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the position",
    });
  }
};

const getAllPositions = async (req, res) => {
  try {
    const id = req.id;
    const { searchItem } = req.query;

    // User Validation
    const userData = await dbQuery(
      "SELECT created_by, is_admin FROM user WHERE id = ?",
      [id],
    );

    if (!userData || userData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isAdmin = userData[0].is_admin;
    const created_by = userData[0].created_by;

    const creatorId = Number(isAdmin) === 1 ? id : created_by;

    if (!creatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view positions.",
      });
    }

    let sql = `
      SELECT *
      FROM position
      WHERE created_by = ?
    `;

    const queryParams = [creatorId];

    if (searchItem && searchItem.trim() !== "") {
      const searchQuery = `%${searchItem}%`;

      sql += `
        AND (
          position_name LIKE ?
          OR position_details LIKE ?
        )
      `;

      queryParams.push(searchQuery, searchQuery);
    }

    sql += ` ORDER BY pos_id DESC`;

    const results = await dbQuery(sql, queryParams);

    return res.status(200).json({
      success: true,
      data: results || [],
      message:
        results && results.length > 0
          ? "Positions fetched successfully"
          : "No positions found",
    });
  } catch (err) {
    console.error("Error fetching positions:", err);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching positions",
    });
  }
};

const deletePosition = async (req, res) => {
  const pos_id = req.params.id;

  try {
    // Check if the position exists first
    const checkSql = "SELECT * FROM `position` WHERE pos_id = ?";
    const positionExists = await dbQuery(checkSql, [pos_id]);

    if (positionExists.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Position not found" });
    }

    // Proceed with deletion
    const sql = "DELETE FROM `position` WHERE pos_id = ?";
    const results = await dbQuery(sql, [pos_id]);

    res.status(200).json({
      success: true,
      message: "Position deleted successfully",
      data: results,
    });
  } catch (err) {
    console.error("Error deleting position:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the position",
    });
  }
};
const getPositionById = async (req, res) => {
  const pos_id = req.params.id;
  try {
    const sql =
      "SELECT pos_id, position_name, position_details FROM `position` WHERE pos_id = ?";
    const results = await dbQuery(sql, [pos_id]);

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Position not found" });
    }

    res.status(200).json({ success: true, data: results[0] });
  } catch (err) {
    console.error("Error fetching position by ID:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the position",
    });
  }
};

const updatePosition = async (req, res) => {
  const pos_id = req.params.id;
  const { position_name, position_details } = req.body;

  try {
    // Check if the position exists first
    const checkSql = "SELECT * FROM `position` WHERE pos_id = ?";
    const positionExists = await dbQuery(checkSql, [pos_id]);

    if (positionExists.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Position not found" });
    }

    const position = position_name ? position_name : positionExists[0].position;

    const possitiondetails = position_details
      ? position_details
      : positionExists[0].position_details;
    const sql =
      "UPDATE `position` SET position_name = ?, position_details = ? WHERE pos_id = ?";
    const results = await dbQuery(sql, [position, possitiondetails, pos_id]);

    res.status(200).json({
      success: true,
      message: "Position updated successfully",
      data: results,
    });
  } catch (err) {
    console.error("Error updating position:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the position",
    });
  }
};
const getALlDutyTypes = async (req, res) => {
  try {
    const sql = "SELECT * FROM duty_type";
    const result = await dbQuery(sql);
    res.status(200).send({ data: result });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
};

const getAllFrequencyType = async (req, res) => {
  try {
    const sql = "SELECT * FROM pay_frequency";
    const result = await dbQuery(sql);
    res.status(200).send({ data: result });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
};

const getAllRateTypes = async (req, res) => {
  try {
    const sql = "SELECT * FROM rate_type";
    const result = await dbQuery(sql);
    res.status(200).send({ data: result });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
};

const maritalSaatus = async (req, res) => {
  try {
    const sql = "SELECT * FROM marital_info";
    const result = await dbQuery(sql);
    res.status(200).send({ data: result });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
};
const getGender = async (req, res) => {
  try {
    const sql = "SELECT * FROM gender";
    const result = await dbQuery(sql);
    res.status(200).send({ data: result });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
};

// const createEmployeeHistory = async (req, res) => {
//   const generateEmployeeID = () => {
//     return "EMP" + Math.floor(Math.random() * 100000);
//   };

//   // Generate employee ID
//   let employee_id = generateEmployeeID();
//   console.log("Generated Employee ID:", employee_id);

//   // Destructure request body
//   const {
//     pos_id,
//     first_name,
//     last_name,
//     email,
//     phone,
//     zip,
//     division_id,
//     duty_type,
//     voluntary_termination,
//     dob,
//     gender,
//     marital_status,
//     home_email,
//     home_phone,
//     emerg_contct,
//     emrg_w_phone,
//     termination_reason,
//     hire_date,
//     original_hire_date,
//     termination_date,
//     rehire_date,
//     rate_type,
//     rate,
//     pay_frequency,
//     pay_frequency_txt,
//     password,
//     country,
//     state,
//     city,
//   } = req.body;

//   // const country = "India";
//   // const state = "Madhya Pradesh";
//   // const city = "Sagar";
//   const picture = req.file ? req.file.filename : null;

//   try {
//     // Check if email exists in user or employee_history table
//     const checkEmailSql = `
//       SELECT email FROM user WHERE email = ?
//       UNION
//       SELECT email FROM employee_history WHERE email = ?`;
//     const emailExists = await dbQuery(checkEmailSql, [email, email]);

//     if (emailExists.length > 0) {
//       return res.status(400).send({ message: "Email already exists. Try a different one." });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Insert into user table
//     const userData = {
//       firstname: first_name,
//       lastname: last_name,
//       email: email,
//       password: hashedPassword,
//       image: picture,
//     };

//     const userSql = "INSERT INTO user SET ?";
//     const userresult = await dbQuery(userSql, userData);
//     const user_id = userresult.insertId;

//     // Insert into employee_history table
//     const insertSql = `
//       INSERT INTO employee_history (
//         employee_id, pos_id, first_name, last_name, email, phone, country, state, city, zip, division_id, duty_type, voluntary_termination, dob, gender,
//         marital_status, home_email, home_phone, emerg_contct, emrg_w_phone, termination_reason, hire_date, original_hire_date, termination_date,
//         rehire_date, rate_type, rate, pay_frequency, pay_frequency_txt, picture, user_id
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const result = await dbQuery(insertSql, [
//       employee_id,
//       pos_id,
//       first_name,
//       last_name,
//       email,
//       phone,
//       country,
//       state,
//       city,
//       zip,
//       division_id,
//       duty_type,
//       voluntary_termination,
//       dob,
//       gender,
//       marital_status,
//       home_email,
//       home_phone,
//       emerg_contct,
//       emrg_w_phone,
//       termination_reason,
//       hire_date,
//       original_hire_date,
//       termination_date,
//       rehire_date,
//       rate_type,
//       rate,
//       pay_frequency,
//       pay_frequency_txt,
//       picture,
//       user_id,
//     ]);

//     return res.status(200).send({
//       user: userresult,
//       employee: result,
//       custom: "All data inserted",
//       benefit: "Success",
//     });
//   } catch (err) {
//     console.error("Error processing request:", err);
//     return res.status(500).send("Server error");
//   }
// };

const createEmployeeHistory = async (req, res) => {
  const generateEmployeeID = () => {
    return "EMP" + Math.floor(Math.random() * 100000);
  };

  let employee_id = generateEmployeeID();
  console.log("Generated Employee ID:", employee_id);

  const {
    pos_id,
    first_name,
    last_name,
    email,
    phone,
    zip,
    division_id,
    duty_type,
    voluntary_termination,
    dob,
    gender,
    marital_status,
    home_email,
    home_phone,
    emerg_contct,
    emrg_w_phone,
    termination_reason,
    hire_date,
    original_hire_date,
    termination_date,
    rehire_date,
    rate_type,
    rate,
    pay_frequency,
    pay_frequency_txt,
    password,
    country,
    state,
    city,
  } = req.body;

  const picture = req.file ? req.file.filename : null;

  try {
    // Check if email exists in user or employee_history
    const checkEmailSql = `
      SELECT email FROM user WHERE email = ? 
      UNION 
      SELECT email FROM employee_history WHERE email = ?`;
    const emailExists = await dbQuery(checkEmailSql, [email, email]);

    if (emailExists.length > 0) {
      return res
        .status(400)
        .send({ message: "Email already exists. Try a different one." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ SQLite-style insert into user table
    const userSql = `
      INSERT INTO user (firstname, lastname, email, password, image)
      VALUES (?, ?, ?, ?, ?)`;
    const userresult = await dbQuery(userSql, [
      first_name,
      last_name,
      email,
      hashedPassword,
      picture,
    ]);

    const user_id = userresult.lastID; // In SQLite, use lastID instead of insertId

    // ✅ SQLite-style insert into employee_history
    const insertSql = `
      INSERT INTO employee_history (
        employee_id, pos_id, first_name, last_name, email, phone, country, state, city, zip, division_id, duty_type, voluntary_termination, dob, gender,
        marital_status, home_email, home_phone, emerg_contct, emrg_w_phone, termination_reason, hire_date, original_hire_date, termination_date,
        rehire_date, rate_type, rate, pay_frequency, pay_frequency_txt, picture, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const result = await dbQuery(insertSql, [
      employee_id,
      pos_id,
      first_name,
      last_name,
      email,
      phone,
      country,
      state,
      city,
      zip,
      division_id,
      duty_type,
      voluntary_termination,
      dob,
      gender,
      marital_status,
      home_email,
      home_phone,
      emerg_contct,
      emrg_w_phone,
      termination_reason,
      hire_date,
      original_hire_date,
      termination_date,
      rehire_date,
      rate_type,
      rate,
      pay_frequency,
      pay_frequency_txt,
      picture,
      user_id,
    ]);

    return res.status(200).send({
      user: userresult,
      employee: result,
      custom: "All data inserted",
      benefit: "Success",
    });
  } catch (err) {
    console.error("Error processing request:", err);
    return res.status(500).send("Server error");
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params; // Extract employee history ID from request parameters
    console.log(id);

    // Fetch the user_id associated with the employee history
    const sql = "SELECT user_id FROM employee_history WHERE emp_his_id = ?";
    const useridResult = await dbQuery(sql, [id]);

    if (useridResult.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee history not found" });
    }

    const userId = useridResult[0].user_id;

    // Delete the record from employee_history table
    const deleteHistorySql =
      "DELETE FROM employee_history WHERE emp_his_id = ?";
    const historyResult = await dbQuery(deleteHistorySql, [id]);

    if (historyResult.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee history not found" });
    }

    // Delete the associated user record from the user table
    const deleteUserSql = "DELETE FROM user WHERE id = ?";
    await dbQuery(deleteUserSql, [userId]);

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Employee history and associated user deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting employee history:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting employee history",
    });
  }
};

const getemployeeBYID = async (req, res) => {
  try {
    const { id } = req.params;

    // SQL query
    let sql = `
      SELECT 
       eh.emp_his_id,
       eh.first_name, 
        eh.last_name,
        eh.email,
        eh.phone,
        eh.country,
        eh.state,
        eh.city,
        eh.zip,
        eh.division_id,
        d.department_name AS division_name,
        
        eh.pos_id ,
        p.position_name AS designation_name,
        eh.duty_type  AS duty_type,
        dy.type_name AS duty_typename,
        eh.voluntary_termination,
        eh.dob,
        eh.gender,
        g.gender_name,
        eh.marital_status ,
        ms.marital_sta, 
        eh.picture,
        eh.home_email,
        eh.home_phone,
        eh.emerg_contct,
        eh.emrg_w_phone,
        eh.hire_date,
        eh.original_hire_date,
        eh.termination_reason,
        eh.hire_date,
        eh.original_hire_date,
        eh.termination_date,
        eh.rehire_date,
         eh.rate_type  ,  
        rt.r_type_name , 
        eh.rate,
         eh.pay_frequency ,
        pf.frequency_name, 
        eh.pay_frequency_txt
       
      FROM 
        employee_history eh 
      LEFT JOIN 
        position p ON p.pos_id = eh.pos_id 
      LEFT JOIN 
        duty_type dy ON eh.duty_type = dy.id
      LEFT JOIN 
        department d ON d.dept_id = eh.division_id
      LEFT JOIN 
        pay_frequency pf ON eh.pay_frequency = pf.id
      LEFT JOIN 
        marital_info ms ON eh.marital_status = ms.id
      LEFT JOIN 
        gender g ON g.id = eh.gender
      LEFT JOIN 
        rate_type rt ON eh.rate_type = rt.id
      WHERE 
        eh.emp_his_id = ?
    `;

    // Execute the query
    const results = await dbQuery(sql, [id]);

    // Send successful response
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching employee histories:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching employee histories",
    });
  }
};

const updateEmployeeHistory = async (req, res) => {
  try {
    const { id } = req.params; // Get employee_id from URL params
    const {
      first_name,
      last_name,
      email,
      phone,
      country,
      state,
      city,
      zip,
      division_id,
      pos_id,
      duty_type,
      voluntary_termination,
      dob,
      gender,
      marital_status,
      home_email,
      home_phone,
      emerg_contct,
      emrg_w_phone,
      termination_reason,
      hire_date,
      original_hire_date,
      termination_date,
      rehire_date,
      rate_type,
      rate,
      pay_frequency,
      pay_frequency_txt,
    } = req.body;

    // const country = "India";
    // const state = "Madhya Pradesh";
    // const city = "Sagar";

    // Get picture if uploaded
    const picture = req.file ? req.file.filename : null;

    // Fetch current employee data
    const result = await dbQuery(
      "SELECT * FROM employee_history WHERE emp_his_id = ?",
      [id],
    );
    const currentData = result[0];
    const user_id = result[0].user_id;
    console.log("userupdate", user_id);

    if (!currentData) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update data with new values or keep the old values if not provided
    const updateData = {
      pos_id: pos_id || currentData.pos_id,
      first_name: first_name || currentData.first_name,
      last_name: last_name || currentData.last_name,
      email: email || currentData.email,
      phone: phone || currentData.phone,
      country: country || currentData.country,
      state: state || currentData.state,
      city: city || currentData.city,
      zip: zip || currentData.zip,
      division_id: division_id || currentData.division_id,
      duty_type: duty_type || currentData.duty_type,
      voluntary_termination:
        voluntary_termination || currentData.voluntary_termination,
      dob: dob || currentData.dob,
      gender: gender || currentData.gender,
      marital_status: marital_status || currentData.marital_status,
      home_email: home_email || currentData.home_email,
      home_phone: home_phone || currentData.home_phone,
      emerg_contct: emerg_contct || currentData.emerg_contct,
      emrg_w_phone: emrg_w_phone || currentData.emrg_w_phone,
      termination_reason: termination_reason || currentData.termination_reason,
      hire_date: hire_date || currentData.hire_date,
      original_hire_date: original_hire_date || currentData.original_hire_date,
      termination_date: termination_date || currentData.termination_date,
      rehire_date: rehire_date || currentData.rehire_date,
      rate_type: rate_type || currentData.rate_type,
      rate: rate || currentData.rate,
      pay_frequency: pay_frequency || currentData.pay_frequency,
      pay_frequency_txt: pay_frequency_txt || currentData.pay_frequency_txt,
      picture: picture || currentData.picture,
    };

    // Update employee data in the employee_history table
    const updateSql = `
          UPDATE employee_history 
          SET pos_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?, country = ?, state = ?, city = ?, zip = ?, division_id = ?, 
          duty_type = ?, voluntary_termination = ?, dob = ?, gender = ?, marital_status = ?, home_email = ?, home_phone = ?, emerg_contct = ?, 
          emrg_w_phone = ?, termination_reason = ?, hire_date = ?, original_hire_date = ?, termination_date = ?, rehire_date = ?, rate_type = ?, 
          rate = ?, pay_frequency = ?, pay_frequency_txt = ?, picture = ?
          WHERE emp_his_id = ?;
      `;

    await dbQuery(updateSql, [
      updateData.pos_id,
      updateData.first_name,
      updateData.last_name,
      updateData.email,
      updateData.phone,
      updateData.country,
      updateData.state,
      updateData.city,
      updateData.zip,
      updateData.division_id,
      updateData.duty_type,
      updateData.voluntary_termination,
      updateData.dob,
      updateData.gender,
      updateData.marital_status,
      updateData.home_email,
      updateData.home_phone,
      updateData.emerg_contct,
      updateData.emrg_w_phone,
      updateData.termination_reason,
      updateData.hire_date,
      updateData.original_hire_date,
      updateData.termination_date,
      updateData.rehire_date,
      updateData.rate_type,
      updateData.rate,
      updateData.pay_frequency,
      updateData.pay_frequency_txt,
      updateData.picture,
      id,
    ]);

    // Update user data in the user table
    const updateUserSql = `
          UPDATE user 
          SET firstname = ?, lastname = ?, email = ?, image = ? 
          WHERE id = ?;
      `;

    await dbQuery(updateUserSql, [
      updateData.first_name,
      updateData.last_name,
      updateData.email,
      updateData.picture,
      user_id,
    ]);

    // Send success response
    return res.status(200).json({
      message: "Employee record updated successfully",
      id,
    });
  } catch (err) {
    console.error("Error updating employee record:", err);
    return res.status(500).send("Server error");
  }
};
// department

const getDepartments = (req, res) => {
  try {
    const id = req.id; // Populated from auth middleware
    const { searchItem } = req.query;

    // ID validation
    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    const checkUserQuery = `SELECT created_by, is_admin FROM user WHERE id = ?`;

    db.get(checkUserQuery, [id], (err, userData) => {
      if (err) {
        console.error("Database error: ", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const isAdmin = userData.is_admin;
      const created_by = userData.created_by;

      let getDepartmentsQuery;
      let queryParams = [];

      if (isAdmin === 1) {
        // Admin: fetch own created departments
        if (!searchItem || searchItem.trim() === "") {
          getDepartmentsQuery = `
            SELECT * FROM department 
            WHERE created_by = ? 
            ORDER BY dept_id DESC
          `;
          queryParams = [id];
        } else {
          const searchQuery = `%${searchItem}%`;
          getDepartmentsQuery = `
            SELECT * FROM department 
            WHERE created_by = ? 
            AND department_name LIKE ? 
            ORDER BY dept_id DESC
          `;
          queryParams = [id, searchQuery];
        }
      } else {
        // Non-admin: fetch departments created by their creator
        if (!created_by) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to view departments.",
          });
        }

        if (!searchItem || searchItem.trim() === "") {
          getDepartmentsQuery = `
            SELECT * FROM department 
            WHERE created_by = ? 
            ORDER BY dept_id DESC
          `;
          queryParams = [created_by];
        } else {
          const searchQuery = `%${searchItem}%`;
          getDepartmentsQuery = `
            SELECT * FROM department 
            WHERE created_by = ? 
            AND department_name LIKE ? 
            ORDER BY dept_id DESC
          `;
          queryParams = [created_by, searchQuery];
        }
      }

      db.all(getDepartmentsQuery, queryParams, (err, result) => {
        if (err) {
          console.error("Database query error: ", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching departments",
          });
        }

        return res.status(200).json({
          success: true,
          data: result,
          message: "Departments fetched successfully",
        });
      });
    });
  } catch (error) {
    console.error("Error in getDepartments: ", error);
    return res.status(500).json({
      success: false,
      message: "An internal error occurred",
    });
  }
};

// const addDepartment = (req, res) => {
//   const { department_name } = req.body;
//   const sql = "INSERT INTO department (department_name) VALUES (?)";
//   const values = [department_name];

//   db.run(sql, values, function (err) {
//     if (err) {
//       console.error("Database query error: ", err);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//     return res.json({
//       message: "Department added successfully",
//       departmentId: this.lastID,
//     });
//   });
// };

const addDepartment = (req, res) => {
  try {
    const { department_name, parent_id } = req.body;
    const user_id = req.id;

    // Validation
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    if (!department_name || department_name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Department name is required.",
      });
    }

    const parentId = parent_id ?? 0;

    // Step 1: Check if user has a subscription
    const checkSubscriptionQuery = `
      SELECT * FROM superadmin_user_plans 
      WHERE user_id = ?
    `;

    db.all(checkSubscriptionQuery, [user_id], (err, results) => {
      if (err) {
        console.error("Subscription check error: ", err);
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }

      if (results.length > 0) {
        // User has subscription
        const created_by = user_id;

        const sql = `
          INSERT INTO department (department_name, parent_id, created_by)
          VALUES (?, ?, ?)
        `;

        const values = [department_name, parentId, created_by];

        db.run(sql, values, function (err) {
          if (err) {
            console.error("Database query error: ", err);
            return res.status(500).json({
              success: false,
              error: "Internal Server Error",
            });
          }

          return res.status(201).json({
            success: true,
            message: "Department added successfully",
            departmentId: this.lastID,
          });
        });
      } else {
        // Step 2: Check if user was created by someone
        const checkUserCreatedByQuery = `
          SELECT created_by FROM user 
          WHERE id = ?
        `;

        db.get(checkUserCreatedByQuery, [user_id], (err, data) => {
          if (err) {
            console.error("User created_by check error: ", err);
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }

          if (!data || !data.created_by) {
            return res.status(403).json({
              success: false,
              message: "You are not authorized to add a department.",
            });
          }

          const created_by = data.created_by;

          // Step 3: Check if creator has subscription
          const checkCreatorSubscriptionQuery = `
            SELECT * FROM superadmin_user_plans 
            WHERE user_id = ?
          `;

          db.all(
            checkCreatorSubscriptionQuery,
            [created_by],
            (err, results) => {
              if (err) {
                console.error("Creator subscription check error: ", err);
                return res.status(500).json({
                  success: false,
                  message: "Internal Server Error",
                });
              }

              if (results.length > 0) {
                const sql = `
                INSERT INTO department (department_name, parent_id, created_by)
                VALUES (?, ?, ?)
              `;

                const values = [department_name, parentId, created_by];

                db.run(sql, values, function (err) {
                  if (err) {
                    console.error("Database query error: ", err);
                    return res.status(500).json({
                      success: false,
                      error: "Internal Server Error",
                    });
                  }

                  return res.status(201).json({
                    success: true,
                    message: "Department added successfully",
                    departmentId: this.lastID,
                  });
                });
              } else {
                return res.status(403).json({
                  success: false,
                  message: "Creator does not have an active subscription.",
                });
              }
            },
          );
        });
      }
    });
  } catch (error) {
    console.error("Error in addDepartment: ", error);
    return res.status(500).json({
      success: false,
      message: "An internal error occurred",
    });
  }
};

const deleteDepartment = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM department WHERE dept_id = ?";

  db.run(sql, [id], (err, data) => {
    if (err) {
      console.error("Database query error: ", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    return res.json({ message: "Department deleted successfully" });
  });
};

const updateDepartment = (req, res) => {
  const { id } = req.params;
  const { department_name } = req.body;

  // Step 1: Fetch the current department data
  const fetchCurrentDataSql = "SELECT * FROM department WHERE dept_id = ?";
  db.get(fetchCurrentDataSql, [id], (fetchErr, currentData) => {
    if (fetchErr) {
      console.error("Database fetch error:", fetchErr);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (!currentData) {
      return res
        .status(404)
        .json({ success: false, message: "Department record not found" });
    }

    // Step 2: Prepare the updated data
    const updatedData = {
      department_name:
        department_name !== undefined
          ? department_name
          : currentData.department_name,
    };

    // Step 3: Update the department record
    const updateSql = `
      UPDATE department 
      SET department_name = ? 
      WHERE dept_id = ?
    `;
    db.run(updateSql, [updatedData.department_name, id], function (updateErr) {
      if (updateErr) {
        console.error("Database update error:", updateErr);
        return res
          .status(500)
          .json({ success: false, message: "An error occurred" });
      } else if (this.changes === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Department record not found" });
      } else {
        return res
          .status(200)
          .json({ success: true, message: "Department updated successfully" });
      }
    });
  });
};

const getDepartmentById = (req, res) => {
  const { id } = req.params;

  // SQL query to fetch department by id
  const fetchDepartmentSql = "SELECT * FROM department WHERE dept_id = ?";

  db.all(fetchDepartmentSql, [id], (fetchErr, fetchData) => {
    if (fetchErr) {
      console.error("Database fetch error:", fetchErr);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }

    if (fetchData.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Department record not found" });
    }

    // Return the department data if found
    res.status(200).json({ success: true, data: fetchData[0] });
  });
};

// get all devision

// const getAllDivision = async (req, res) => {
//   try {
//     const { searchItem } = req.query;
//     let sql;
//     let queryParams = [];

//     // Log the search item for debugging purposes
//     console.log("search:", searchItem);

//     // If searchItem is not provided or empty, fetch all divisions where parent_id > 0
//     if (!searchItem || searchItem.trim() === "") {
//       sql = 'SELECT dept_id AS division_id , department_name AS division_name ,parent_id FROM department WHERE parent_id > 0';
//     } else {
//       // Use wildcard search for department names matching the searchItem
//       sql = 'SELECT dept_id AS division_id , department_name AS division_name ,parent_id FROM department WHERE department_name LIKE ? AND parent_id > 0';
//       queryParams = [`%${searchItem}%`];  // Wildcards for partial match
//     }
// sql+=` ORDER BY dept_id DESC`;
//     // Execute the SQL query
//     const result = await dbQuery(sql, queryParams);

//     // Check if result has any data
//     if (!result || result.length === 0) {
//       return res.status(404).json({ message: "No departments found" });
//     }

//     // Process parent_id for each department and fetch parent department names
//     const departmentsWithParentNames = await Promise.all(
//       result.map(async (dept) => {
//         if (dept.parent_id > 0) {
//           const parentDeptSql = "SELECT department_name FROM department WHERE dept_id = ?";
//           const parentDept = await dbQuery(parentDeptSql, [dept.parent_id]);

//           // Add the parent department name if a parent department exists
//           if (parentDept && parentDept.length > 0) {
//             return { ...dept, parent_department_name: parentDept[0].department_name };
//           }
//         }
//         // If no parent department found, return null for parent_department_name
//         return { ...dept, parent_department_name: null };
//       })
//     );

//     // Return the result with parent department names
//     res.status(200).json({ data: departmentsWithParentNames });
//   } catch (err) {
//     console.error('Error fetching departments:', err);
//     res.status(500).send("Server error");
//   }
// };
const getAllDivision = async (req, res) => {
  try {
    const id = req.id;
    const { searchItem } = req.query;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    const checkUserSql = `
      SELECT created_by, is_admin 
      FROM user 
      WHERE id = ?
    `;

    const userResult = await dbQuery(checkUserSql, [id]);

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isAdmin = userResult[0].is_admin;
    const created_by = userResult[0].created_by;

    let ownerId;

    if (isAdmin === 1) {
      ownerId = id;
    } else {
      if (!created_by) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view divisions.",
        });
      }

      ownerId = created_by;
    }

    let sql;
    let queryParams = [];

    if (!searchItem || searchItem.trim() === "") {
      sql = `
        SELECT 
          dept_id AS division_id, 
          department_name AS division_name, 
          parent_id 
        FROM department 
        WHERE parent_id > 0 
        AND created_by = ?
      `;
      queryParams = [ownerId];
    } else {
      sql = `
        SELECT 
          dept_id AS division_id, 
          department_name AS division_name, 
          parent_id 
        FROM department 
        WHERE department_name LIKE ? 
        AND parent_id > 0 
        AND created_by = ?
      `;
      queryParams = [`%${searchItem}%`, ownerId];
    }

    sql += ` ORDER BY dept_id DESC`;

    const result = await dbQuery(sql, queryParams);

    if (!result || result.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No departments found",
      });
    }
    const departmentsWithParentNames = await Promise.all(
      result.map(async (dept) => {
        if (dept.parent_id > 0) {
          const parentDeptSql = `
            SELECT department_name 
            FROM department 
            WHERE dept_id = ?
            AND created_by = ?
          `;

          const parentDept = await dbQuery(parentDeptSql, [
            dept.parent_id,
            ownerId,
          ]);

          if (parentDept && parentDept.length > 0) {
            return {
              ...dept,
              parent_department_name: parentDept[0].department_name,
            };
          }
        }

        return {
          ...dept,
          parent_department_name: null,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: departmentsWithParentNames,
      message: "Divisions fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching departments:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//for division list

//  const departmentDropdown = async (req, res) => {
//   try {
//     // Initialize an empty array to store department objects
//     let list = [];

//     // SQL query to select departments with parent_id = 0
//     const departmentQuery = "SELECT * FROM department WHERE parent_id = 0";

//     // Ensure you're using the promise version of db.pool
//     const [departments] = await db.pool.promise().query(departmentQuery);
//     // console.log("result", departments);

//     // Populate the list with department objects containing dept_id and department_name
//     departments.forEach(dept => {
//       list.push({
//         parent_id: dept.dept_id,
//         department_name: dept.department_name
//       });
//     });

//     // Return the dropdown list in the response
//     return res.status(200).json({ success: true, data: list });
//   } catch (error) {
//     console.error('Error fetching department dropdown:', error);
//     return res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// };

const departmentDropdown = async (req, res) => {
  try {
    const id = req.id;
    let list = [];

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    const checkUserQuery = `
      SELECT created_by, is_admin 
      FROM user 
      WHERE id = ?
    `;

    const userData = await new Promise((resolve, reject) => {
      db.get(checkUserQuery, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
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
          message: "You are not authorized to view departments.",
        });
      }

      ownerId = created_by;
    }

    const departmentQuery = `
      SELECT * 
      FROM department 
      WHERE parent_id = 0 
      AND created_by = ?
      ORDER BY dept_id DESC
    `;

    const departments = await new Promise((resolve, reject) => {
      db.all(departmentQuery, [ownerId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    departments.forEach((dept) => {
      list.push({
        parent_id: dept.dept_id,
        department_name: dept.department_name,
      });
    });

    return res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Error fetching department dropdown:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// const createDivison = (req, res) => {
//   const { department_name, parent_id } = req.body;
//   console.log(department_name, parent_id);

//   const sql =
//     "INSERT INTO department (department_name, parent_id) VALUES (?, ?)";
//   db.run(sql, [department_name, parent_id], function (err) {
//     if (err) {
//       return res.status(500).json({ error: err.message });
//     }
//     res.json({ message: "Department added", departmentId: this.lastID });
//   });
// };

const createDivison = (req, res) => {
  try {
    const { department_name, parent_id } = req.body;
    const user_id = req.id;

    // Validation
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found.",
      });
    }

    if (!department_name || department_name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Division name is required.",
      });
    }

    if (!parent_id || Number(parent_id) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Parent department is required.",
      });
    }

    const parentId = parent_id;

    // Step 1: Check if user has a subscription
    const checkSubscriptionQuery = `
      SELECT * FROM superadmin_user_plans 
      WHERE user_id = ?
    `;

    db.all(checkSubscriptionQuery, [user_id], (err, results) => {
      if (err) {
        console.error("Subscription check error:", err);
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }

      if (results.length > 0) {
        // User has subscription
        const created_by = user_id;

        const sql = `
          INSERT INTO department (department_name, parent_id, created_by)
          VALUES (?, ?, ?)
        `;

        db.run(sql, [department_name, parentId, created_by], function (err) {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
              success: false,
              error: err.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: "Division added successfully",
            departmentId: this.lastID,
          });
        });
      } else {
        // Step 2: Check if user was created by someone
        const checkUserCreatedByQuery = `
          SELECT created_by 
          FROM user 
          WHERE id = ?
        `;

        db.get(checkUserCreatedByQuery, [user_id], (err, data) => {
          if (err) {
            console.error("User created_by check error:", err);
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }

          if (!data || !data.created_by) {
            return res.status(403).json({
              success: false,
              message: "You are not authorized to add a division.",
            });
          }

          const created_by = data.created_by;

          // Step 3: Check if creator has subscription
          const checkCreatorSubscriptionQuery = `
            SELECT * FROM superadmin_user_plans 
            WHERE user_id = ?
          `;

          db.all(
            checkCreatorSubscriptionQuery,
            [created_by],
            (err, results) => {
              if (err) {
                console.error("Creator subscription check error:", err);
                return res.status(500).json({
                  success: false,
                  message: "Internal Server Error",
                });
              }

              if (results.length > 0) {
                const sql = `
                INSERT INTO department (department_name, parent_id, created_by)
                VALUES (?, ?, ?)
              `;

                db.run(
                  sql,
                  [department_name, parentId, created_by],
                  function (err) {
                    if (err) {
                      console.error("Database error:", err);
                      return res.status(500).json({
                        success: false,
                        error: err.message,
                      });
                    }

                    return res.status(201).json({
                      success: true,
                      message: "Division added successfully",
                      departmentId: this.lastID,
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
        });
      }
    });
  } catch (error) {
    console.error("Error in createDivison:", error);
    return res.status(500).json({
      success: false,
      message: "An internal error occurred",
    });
  }
};

const deleteDivison = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM department WHERE dept_id = ?";
  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.json({ message: "Department deleted" });
  });
};

// get by id

const getALldivisionbyId = async (req, res) => {
  const { id } = req.params;
  try {
    const sql = "SELECT * FROM department WHERE dept_id=?";
    const result = await dbQuery(sql, [id]);

    // Check if result has any data
    if (!result || result.length === 0) {
      return res.status(404).send({ message: "No data found" });
    }

    // Process parent_id for each department
    const departmentsWithParentNames = await Promise.all(
      result.map(async (dept) => {
        if (dept.parent_id !== 0) {
          const result2Query =
            "SELECT department_name FROM department WHERE dept_id = ?";
          const parentDept = await dbQuery(result2Query, [dept.parent_id]);

          // If a parent department exists, add the parent department name
          if (parentDept.length > 0) {
            return {
              ...dept,
              parent_department_name: parentDept[0].department_name,
            };
          }
        }
        // If no parent_id, return department as it is
        return { ...dept, parent_department_name: null };
      }),
    );

    res.status(200).send({ data: departmentsWithParentNames });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// const updateDivison= (req, res) => {
//   const { id } = req.params;
//   const { department_name, parent_id } = req.body;

//   // Step 1: Fetch the current department data
//   const fetchCurrentDataSql = 'SELECT * FROM department WHERE dept_id = ?';
//   db.runy(fetchCurrentDataSql, [id], (fetchErr, fetchData) => {
//       if (fetchErr) {
//           console.error('Database fetch error:', fetchErr);
//           return res.status(500).json({ error: 'Internal Server Error' });
//       }

//       if (fetchData.length === 0) {
//           return res.status(404).json({ success: false, message: 'Department record not found' });
//       }

//       const currentData = fetchData[0];

//       // Step 2: Prepare the updated data
//       const updatedData = {
//           department_name: department_name !== undefined ? department_name : currentData.department_name,
//           parent_id: parent_id !== undefined ? parent_id : currentData.parent_id
//       };

//       // Step 3: Update the department record
//       const updateSql = `
//           UPDATE department
//           SET department_name = ?, parent_id = ?
//           WHERE dept_id = ?
//       `;
//       db.pool.query(updateSql, [
//           updatedData.department_name,
//           updatedData.parent_id,
//           id
//       ], (updateErr, result) => {
//           if (updateErr) {
//               console.error('Database update error:', updateErr);
//               return res.status(500).json({ success: false, message: 'An error occurred' });
//           } else if (result.affectedRows === 0) {
//               return res.status(404).json({ success: false, message: 'Department record not found' });
//           } else {
//               return res.status(200).json({ success: true, message: 'Department updated successfully' });
//           }
//       });
//   });
// };
const updateDivison = (req, res) => {
  const { id } = req.params;
  const { department_name, parent_id } = req.body;

  // Step 1: Fetch the current department data
  const fetchCurrentDataSql = "SELECT * FROM department WHERE dept_id = ?";
  db.get(fetchCurrentDataSql, [id], (fetchErr, currentData) => {
    if (fetchErr) {
      console.error("Database fetch error:", fetchErr);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (!currentData) {
      return res
        .status(404)
        .json({ success: false, message: "Department record not found" });
    }

    // Step 2: Prepare the updated data
    const updatedData = {
      department_name:
        department_name !== undefined
          ? department_name
          : currentData.department_name,
      parent_id: parent_id !== undefined ? parent_id : currentData.parent_id,
    };

    // Step 3: Update the department record
    const updateSql = `
      UPDATE department 
      SET department_name = ?, parent_id = ? 
      WHERE dept_id = ?
    `;
    db.run(
      updateSql,
      [updatedData.department_name, updatedData.parent_id, id],
      function (updateErr) {
        if (updateErr) {
          console.error("Database update error:", updateErr);
          return res
            .status(500)
            .json({ success: false, message: "An error occurred" });
        } else if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Department record not found" });
        } else {
          return res.status(200).json({
            success: true,
            message: "Department updated successfully",
          });
        }
      },
    );
  });
};

module.exports = {
  getAllEmployeeHistories,
  createDesignation,
  getAllPositions,
  getAllDivision,
  getALlDutyTypes,
  getAllFrequencyType,
  getAllRateTypes,
  maritalSaatus,
  getGender,
  createEmployeeHistory,
  deleteEmployee,
  getemployeeBYID,
  updateEmployeeHistory,
  getDepartments,
  addDepartment,
  deleteDepartment,
  updateDepartment,
  getDepartmentById,
  departmentDropdown,
  createDivison,
  deleteDivison,
  getALldivisionbyId,
  updateDivison,
  deletePosition,
  getPositionById,
  updatePosition,
};
