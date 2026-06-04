const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const db = require("../utils/db");

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

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

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers["authorization"];

    if (!token) {
      return res.status(401).send({ message: "No token provided" });
    }

    const verified = jwt.verify(token, JWT_SECRET);

    console.log("Decoded ID:", verified.id);

    // ✅ IMPORTANT FIX
    req.id = verified.id;

    next(); // no need of if condition
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).send({ message: "Token expired" });
    }
    return res.status(401).send({ message: "Invalid token" });
  }
};

module.exports = verifyToken;
