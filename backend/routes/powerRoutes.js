// backend/routes/powerRoutes.js

const express = require("express");
const router = express.Router();
// IMPORTANT: { protect } ko curly braces mein destructure kiya gaya hai
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const {
  createPower,
  getPowerByDate,
  updatePower,
  deletePower,
  listPower,
  getMonthlyAnalysis,
  getYearlyAnalysis,
} = require("../controllers/powerController");

// Specific sub-paths must be registered before the generic "/:date" route.
router.get("/monthly", protect, getMonthlyAnalysis);
router.get("/yearly", protect, getYearlyAnalysis);
router.get("/", protect, listPower);
router.post("/", protect, createPower);
router.get("/:date", protect, getPowerByDate);
router.put("/:date", protect, updatePower);
router.delete("/:date", protect, allowRoles("Admin"), deletePower);

module.exports = router;