const express = require("express");
const router = express.Router();
const InductorRemark = require("../models/InductorRemark");
const DailyInductorData = require("../models/DailyInductorData");

// 1. GET REMARKS
router.get("/remarks/:inductorKey", async (req, res) => {
  try {
    const { inductorKey } = req.params;
    const remarks = await InductorRemark.find({ inductorKey }).sort({ createdAt: -1 });
    return res.json({ success: true, data: remarks });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. SAVE REMARK
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
    return res.json({ success: true, data: newRemark });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET ANALYTICS (GUARANTEED DATA EXTRACTOR - LAST 5 / 20 / 30 DATA)
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    const rawKey = String(req.params.inductorKey || "").toUpperCase();
    const range = req.query.range || "5d"; // Default 5 data

    // Determine Pot
    const isPm = rawKey.includes("PM");
    const potKey = isPm ? "pmPot" : "mainPot";

    // Determine Inductor Letter
    let letter = "A";
    if (rawKey.includes("B")) letter = "B";
    else if (rawKey.includes("C")) letter = "C";
    else if (rawKey.includes("D")) letter = "D";

    // Fetch from MongoDB
    const records = await DailyInductorData.find().sort({ date: -1 }).lean();

    if (!records || records.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const parseNum = (val) => {
      if (val === undefined || val === null || val === "" || val === "-") return 0;
      const n = parseFloat(val);
      return isNaN(n) ? 0 : n;
    };

    const extractPoint = (doc) => {
      const pot = doc[potKey] || doc[potKey.toLowerCase()] || {};
      const ind = pot[letter] || pot[letter.toLowerCase()] || pot[`inductor${letter}`] || {};
      const high = ind.high || ind.High || ind;
      const inter = ind.intermediate || ind.Intermediate || {};

      let cr =
        parseNum(high.conductanceRatio) ||
        parseNum(inter.conductanceRatio) ||
        parseNum(ind.conductanceRatio) ||
        parseNum(high.condRatio) ||
        parseNum(inter.condRatio);

      let cur =
        parseNum(high.inductorCurrent) ||
        parseNum(inter.inductorCurrent) ||
        parseNum(high.current) ||
        parseNum(high.lineCurrent) ||
        parseNum(ind.inductorCurrent);

      // Date formatting for X-Axis
      let displayDate = doc.date || "N/A";
      if (displayDate.includes("-")) {
        const parts = displayDate.split("-");
        if (parts.length === 3) displayDate = `${parts[1]}/${parts[2]}`;
      }

      return {
        date: displayDate,
        fullDate: doc.date,
        conductanceRatio: cr,
        current: cur,
      };
    };

    // Determine limit count
    let limit = 5;
    if (range === "20d") limit = 20;
    else if (range === "30d") limit = 30;
    else if (range === "5d") limit = 5;

    let chartData = [];

    if (range === "1y" || range === "2y") {
      const limitMonths = range === "2y" ? 24 : 12;
      const monthMap = new Map();
      records.forEach((doc) => {
        if (!doc.date) return;
        const monthKey = doc.date.slice(0, 7);
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, extractPoint(doc));
        }
      });
      chartData = Array.from(monthMap.values()).slice(0, limitMonths).reverse();
    } else {
      chartData = records.slice(0, limit).reverse().map(extractPoint);
    }

    return res.json({ success: true, data: chartData });
  } catch (err) {
    console.error("Inductor Analytics Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;