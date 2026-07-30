const express = require("express");
const router = express.Router();
const InductorRemark = require("../models/InductorRemark");
const TelemetryData = require("../models/TelemetryData"); // Your telemetry model

// 1. Get Remarks for Inductor
router.get("/remarks/:inductorKey", async (req, res) => {
  try {
    const remarks = await InductorRemark.find({ inductorKey: req.params.inductorKey }).sort({ createdAt: -1 });
    res.json({ success: true, data: remarks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Save Remark
router.post("/remarks", async (req, res) => {
  try {
    const { inductorKey, inductorName, remark, category } = req.body;
    const newRemark = new InductorRemark({ inductorKey, inductorName, remark, category });
    await newRemark.save();
    res.json({ success: true, data: newRemark });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET CHART DATA (Filtered by Range: 30d, 1y, 2y)
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    const { inductorKey } = req.params;
    const range = req.query.range || "30d"; // '30d', '1y', '2y'

    const now = new Date();
    let startDate = new Date();

    if (range === "30d") startDate.setDate(now.getDate() - 30);
    if (range === "1y") startDate.setFullYear(now.getFullYear() - 1);
    if (range === "2y") startDate.setFullYear(now.getFullYear() - 2);

    // Fetch raw data points
    const records = await TelemetryData.find({
      inductorKey,
      timestamp: { $gte: startDate, $lte: now }
    }).sort({ timestamp: 1 });

    let finalData = [];

    if (range === "30d") {
      // Daily points
      finalData = records.map(r => ({
        date: new Date(r.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        conductanceRatio: r.conductanceRatio || 0,
        current: r.current || 0
      }));
    } else {
      // 1 Year / 2 Years: Take 1st date of each month
      const monthlyMap = new Map();
      records.forEach(r => {
        const d = new Date(r.timestamp);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        // Pick first entry of month or specifically 1st date
        if (!monthlyMap.has(monthKey) || d.getDate() === 1) {
          monthlyMap.set(monthKey, {
            date: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
            conductanceRatio: r.conductanceRatio || 0,
            current: r.current || 0
          });
        }
      });
      finalData = Array.from(monthlyMap.values());
    }

    res.json({ success: true, data: finalData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;