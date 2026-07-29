// backend/routes/reportRoutes.js

const express = require("express");
const router = express.Router();
// IMPORTANT: { protect } ko curly braces mein destructure kiya gaya hai
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const {
  getPmPotReport,
  getMainPotReport,
  getReportPreview,
  logReport,
  getReportHistory,
  deleteReportHistory,
} = require("../controllers/reportController");

router.get("/pm-pot/:date", protect, getPmPotReport);
router.get("/main-pot/:date", protect, getMainPotReport);
router.get("/preview/:reportType/:date", protect, getReportPreview);
router.post("/log", protect, logReport);
router.get("/history", protect, getReportHistory);
router.delete("/history/:id", protect, allowRoles("Admin"), deleteReportHistory);

module.exports = router;