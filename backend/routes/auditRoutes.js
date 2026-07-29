// backend/routes/auditRoutes.js

const express = require("express");
const router = express.Router();
// IMPORTANT: { protect } ko curly braces mein destructure kiya gaya hai
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { getAuditLogs } = require("../controllers/auditController");

router.get("/", protect, allowRoles("Admin"), getAuditLogs);

module.exports = router;