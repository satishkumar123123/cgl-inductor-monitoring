// backend/routes/historyRoutes.js

const express = require("express");
const router = express.Router();
const { getHistory } = require("../controllers/historyController");
// IMPORTANT: { protect } ko curly braces mein destructure kiya gaya hai
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getHistory);

module.exports = router;