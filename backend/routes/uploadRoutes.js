// backend/routes/uploadRoutes.js

const express = require("express");
const multer = require("multer");
const router = express.Router();
const { uploadExcel } = require("../controllers/uploadController");
// IMPORTANT: { protect } ko curly braces mein destructure kiya gaya hai
const { protect } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(xlsx|xls)$/i.test(file.originalname);
    cb(ok ? null : new Error("Only .xlsx or .xls files are allowed"), ok);
  },
});

router.post("/", protect, upload.single("file"), uploadExcel);

module.exports = router;