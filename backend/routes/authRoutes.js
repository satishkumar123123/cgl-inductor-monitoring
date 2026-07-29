const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Dummy login handler for bypass mode
router.post("/login", (req, res) => {
  res.json({
    token: "bypass-token-123",
    user: { id: "bypass-admin-id", username: "admin", role: "Admin" }
  });
});

// User profile route
router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;