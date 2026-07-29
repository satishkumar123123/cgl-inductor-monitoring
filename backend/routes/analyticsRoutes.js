// backend/routes/analyticsRoutes.js

const express = require("express");
const router = express.Router();
// IMPORTANT: { protect } ko curly braces mein destructure kiya gaya hai
const { protect } = require("../middleware/authMiddleware");
const { getAnalytics } = require("../controllers/analyticsController");

router.get("/", protect, getAnalytics);

module.exports = router;