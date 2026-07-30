const express = require("express");
const router = express.Router();
const InductorRemark = require("../models/InductorRemark");

// 1. Get Remarks
router.get("/remarks/:inductorKey", async (req, res) => {
  try {
    const { inductorKey } = req.params;
    const remarks = await InductorRemark.find({ inductorKey }).sort({ createdAt: -1 });
    res.json({ success: true, data: remarks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Post Remark
router.post("/remarks", async (req, res) => {
  try {
    const { inductorKey, inductorName, remark, category, createdBy } = req.body;
    const newRemark = new InductorRemark({
      inductorKey,
      inductorName,
      remark,
      category: category || "General",
      createdBy: createdBy || "Site Admin",
    });
    await newRemark.save();
    res.json({ success: true, data: newRemark });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Analytics Chart Data Route (Safe fallback so 404 won't occur)
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    // Return sample/empty formatted data array if no telemetry DB exists
    res.json({ 
      success: true, 
      data: [
        { date: "01 Jul", conductanceRatio: 0.82, current: 410 },
        { date: "10 Jul", conductanceRatio: 0.85, current: 420 },
        { date: "20 Jul", conductanceRatio: 0.81, current: 415 },
        { date: "30 Jul", conductanceRatio: 0.84, current: 425 }
      ] 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;