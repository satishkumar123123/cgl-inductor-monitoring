const express = require("express");
const router = express.Router();
const InductorRemark = require("../models/InductorRemark");
const DailyInductorData = require("../models/DailyInductorData");

// 1. GET REMARKS
router.get("/remarks/:inductorKey", async (req, res) => {
  try {
    const { inductorKey } = req.params;
    const remarks = await InductorRemark.find({ inductorKey }).sort({ createdAt: -1 });
    res.json({ success: true, data: remarks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    res.json({ success: true, data: newRemark });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET ANALYTICS DATA (Direct Schema Matching: mainPot / pmPot -> A,B,C,D -> high / intermediate)
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    const rawKey = (req.params.inductorKey || "").toUpperCase().trim();
    const range = req.query.range || "20d";

    // Detect Pot (mainPot vs pmPot)
    let potKey = "mainPot";
    if (rawKey.includes("PM")) {
      potKey = "pmPot";
    }

    // Detect Inductor Letter (A, B, C, D)
    let letter = "A";
    if (rawKey.includes("B")) letter = "B";
    else if (rawKey.includes("C")) letter = "C";
    else if (rawKey.includes("D")) letter = "D";

    // Fetch all records sorted by date descending
    const records = await DailyInductorData.find().sort({ date: -1 });

    const parseVal = (v) => {
      if (v === undefined || v === null || v === "" || v === "-") return null;
      const num = Number(v);
      return isNaN(num) ? null : num;
    };

    // Helper to get Conductance Ratio & Current for the selected inductor
    const extractPoint = (doc) => {
      const indObj = doc[potKey]?.[letter] || {};
      const high = indObj.high || {};
      const inter = indObj.intermediate || {};

      // Priority: High -> Intermediate -> Root of Inductor
      const conductanceRatio =
        parseVal(high.conductanceRatio) ??
        parseVal(inter.conductanceRatio) ??
        parseVal(indObj.conductanceRatio) ??
        0;

      const current =
        parseVal(high.inductorCurrent) ??
        parseVal(inter.inductorCurrent) ??
        parseVal(high.lineCurrent) ??
        parseVal(inter.lineCurrent) ??
        parseVal(indObj.inductorCurrent) ??
        0;

      return {
        date: doc.date || "N/A",
        conductanceRatio,
        current,
      };
    };

    let chartData = [];

    if (range === "20d" || range === "30d") {
      const limit = range === "20d" ? 20 : 30;
      // Slice latest N entries and reverse to show chronologically (left to right)
      chartData = records.slice(0, limit).reverse().map(extractPoint);
    } else {
      // 1 Year or 2 Years (Monthly grouping)
      const limitMonths = range === "2y" ? 24 : 12;
      const monthMap = new Map();

      records.forEach((doc) => {
        if (!doc.date) return;
        const monthKey = doc.date.slice(0, 7); // e.g. "2026-08"
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, extractPoint(doc));
        }
      });

      chartData = Array.from(monthMap.values()).slice(0, limitMonths).reverse();
    }

    return res.json({ success: true, data: chartData });
  } catch (err) {
    console.error("Inductor Analytics Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;