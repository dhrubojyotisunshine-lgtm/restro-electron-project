const db = require("../utils/db");
const dbQuery = (query, values) => {
    return new Promise((resolve, reject) => {
      db.pool.query(query, values, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  };



  const getAllSettings = async (req, res) => {
    try {
      // Query to fetch only specific fields
      const getAllQuery = `
        SELECT 
          id, 
          address, 
          email, 
          phone, 
          phone_optional, 
          logo, 
          logo_footer, 
          powerbytxt,
          fevicon,
          restro_name
        FROM common_setting`;
  
      db.all(getAllQuery, (err, results) => {
        if (err) {
          console.error("Error while fetching all settings:", err);
          return res.status(500).json({ success: false, message: "Error fetching settings" });
        }
        res.status(200).json({ success: true, data: results });
      });
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      res.status(500).json({ success: false, message: "An error occurred" });
    }
  };
  

  const createSetting = async (req, res) => {
    try {
      const {
        email,
        phone,
        phone_optional,
        address,
        powerbytxt,
        restro_name
      } = req.body;
  
      // File uploads with fallback to null if no file is uploaded
      const logo = req.files && req.files.logo ? req.files.logo[0].filename : null;
      const logo_footer = req.files && req.files.logo_footer ? req.files.logo_footer[0].filename : null;
      const fevicon = req.files && req.files.fevicon ? req.files.fevicon[0].filename : null;
  
      // Construct data object
      const settingData = {
        email,
        phone,
        phone_optional,
        address,
        powerbytxt,
        restro_name,
        logo,
        logo_footer,
        fevicon
      };
  
      // Insert new record
      const createQuery = "INSERT INTO common_setting SET ?";
      db.run(createQuery, settingData, (err, result) => {
        if (err) {
          console.error("Error while inserting setting:", err);
          return res.status(500).json({ success: false, message: "Error saving setting" });
        }
        res.status(200).json({ success: true, message: "Setting saved successfully" });
      });
  
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      res.status(500).json({ success: false, message: "An error occurred" });
    }
  };


  const updateSetting = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        email,
        phone,
        phone_optional,
        address,
        powerbytxt,
        restro_name
      } = req.body;
  
      // Initialize the settingData object with fields from the request body
      const settingData = {
        email,
        phone,
        phone_optional,
        address,
        powerbytxt,
        restro_name
      };
  
      // Update only the file fields if new files are uploaded
      if (req.files && req.files.logo) {
        settingData.logo = req.files.logo[0].filename;
      }
      if (req.files && req.files.logo_footer) {
        settingData.logo_footer = req.files.logo_footer[0].filename;
      }
      if (req.files && req.files.fevicon) {
        settingData.fevicon = req.files.fevicon[0].filename;
      }
  
      // Construct the SQL query and update
      const updateQuery = "UPDATE common_setting SET ? WHERE id = ?";
      db.run(updateQuery, [settingData, id], (err, result) => {
        if (err) {
          console.error("Error while updating setting:", err);
          return res.status(500).json({ success: false, message: "Error updating setting" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: "Setting not found" });
        }
        res.status(200).json({ success: true, message: "Setting updated successfully" });
      });
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      res.status(500).json({ success: false, message: "An error occurred" });
    }
  };


  const getSettingById = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Query to fetch specific fields for a given ID
      const getByIdQuery = `
        SELECT 
          id, 
          address, 
          email, 
          phone, 
          phone_optional, 
          logo, 
          logo_footer, 
          powerbytxt,
          fevicon,
          restro_name
        FROM common_setting WHERE id = ?`;
  
      db.get(getByIdQuery, [id], (err, result) => {
        if (err) {
          console.error("Error while fetching setting:", err);
          return res.status(500).json({ success: false, message: "Error fetching setting" });
        }
        if (result.length === 0) {
          return res.status(404).json({ success: false, message: "Setting not found" });
        }
        res.status(200).json({ success: true, data: result[0] });
      });
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      res.status(500).json({ success: false, message: "An error occurred" });
    }
  };

  // sound setting

  const createOrUpdateSoundSetting = (req, res) => {
    const nofitysound = req.file ? req.file.path : null;
  
    if (!nofitysound) {
      return res.status(400).json({ success: false, message: 'Missing sound file' });
    }
  
    // Check if a record already exists
    const checkQuery = 'SELECT soundid FROM tbl_soundsetting LIMIT 1';
    db.get(checkQuery, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error checking sound setting', error: err });
      }
  
      if (results.length > 0) {
        console.log("update",results[0].soundid)
        // If a record exists, update it
        const updateQuery = 'UPDATE tbl_soundsetting SET nofitysound = ? WHERE soundid = ?';
        db.run(updateQuery, [nofitysound, results[0].soundid], (updateErr) => {
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({ success: false, message: 'Error updating sound setting', error: updateErr });
          }
  
          return res.status(200).json({ success: true, message: 'Sound setting updated successfully' });
        });
      } else {
        console.log("post",nofitysound)
        // If no record exists, create a new one
        const insertQuery = 'INSERT INTO tbl_soundsetting (nofitysound) VALUES (?)';
        db.run(insertQuery, [nofitysound], (insertErr, result) => {
          if (insertErr) {
            console.error(insertErr);
            return res.status(500).json({ success: false, message: 'Error creating sound setting', error: insertErr });
          }
  
          return res.status(201).json({ success: true, message: 'Sound setting created successfully' });
        });
      }
    });
  };









  const getAllSoundSettings = (req, res) => {
    const query = 'SELECT * FROM tbl_soundsetting';
    db.all(query, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching sound settings' });
      }
      res.status(200).json({ success: true, data: results });
    });
  };
  module.exports={
    getAllSettings,
    createSetting,
    updateSetting,
    getSettingById,
    createOrUpdateSoundSetting,
    getAllSoundSettings
  }