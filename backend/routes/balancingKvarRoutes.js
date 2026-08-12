const express = require("express");
const router = express.Router();
const BalancingKvar = require("../models/BalancingKvar");

// Get History for specific Inductor
router.get("/:inductorKey", async (req, res) => {
  try {
    const logs = await BalancingKvar.find({ inductorKey: req.params.inductorKey }).sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save Log permanently
router.post("/", async (req, res) => {
  try {
    const { inductorKey, inductorTitle, date, initialKvar, removedKvar, addKvar, actualKvar } = req.body;
    const newLog = new BalancingKvar({
      inductorKey,
      inductorTitle,
      date,
      initialKvar,
      removedKvar,
      addKvar,
      actualKvar,
    });
    await newLog.save();
    res.json({ success: true, data: newLog });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete specific history log
router.delete("/:id", async (req, res) => {
  try {
    await BalancingKvar.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Log deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;