const multer = require("multer");
const path = require("path");
const fs = require("fs");

const baseUploadPath = path.join(__dirname, "../uploads");

// ensure folder exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "";

    if (file.fieldname === "logo") {
      folder = "logo";
    } else if (file.fieldname === "logo_footer") {
      folder = "footer";
    } else if (file.fieldname === "fevicon") {
      folder = "favicon";
    }

    const uploadPath = path.join(baseUploadPath, folder);

    ensureDir(uploadPath); // ✅ create folder if not exist

    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

module.exports = upload;
