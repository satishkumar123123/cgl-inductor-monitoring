const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const InductorRemark = require("../models/InductorRemark");

// Disable 304 Caching so browser always gets fresh data
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

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

// Helper to extract any number safely
const parseVal = (v) => {
  if (v === undefined || v === null || v === "" || v === "-" || v === "—") return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

// 3. GET ANALYTICS (LAST 5 DAYS TESTABLE ROUTE)
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    const rawKey = String(req.params.inductorKey || "MAIN_A").toUpperCase();
    const range = req.query.range || "5d";

    // Detect Pot (mainPot vs pmPot)
    const isPm = rawKey.includes("PM");
    const potKey = isPm ? "pmPot" : "mainPot";

    // Detect Inductor Letter (A, B, C, D)
    let letter = "A";
    if (rawKey.includes("B")) letter = "B";
    else if (rawKey.includes("C")) letter = "C";
    else if (rawKey.includes("D")) letter = "D";

    // Direct fetch from MongoDB daily_inductor_data collection
    const db = mongoose.connection.db;
    let records = [];

    if (db) {
      records = await db
        .collection("daily_inductor_data")
        .find({})
        .sort({ date: -1, createdAt: -1 })
        .toArray();
    }

    // Fallback if db instance isn't ready
    if (!records || records.length === 0) {
      const DailyInductorData = mongoose.models.DailyInductorData || require("../models/DailyInductorData");
      records = await DailyInductorData.find({}).sort({ date: -1, createdAt: -1 }).lean();
    }

    if (!records || records.length === 0) {
      return res.json({
        success: true,
        message: "No documents found in daily_inductor_data collection",
        totalDocsInDb: 0,
        data: []
      });
    }

    // Process records to extract conductanceRatio and current
    const extractPoint = (doc) => {
      const pot = doc[potKey] || doc[potKey.toLowerCase()] || doc[isPm ? "PMPOT" : "MAINPOT"] || {};
      const ind = pot[letter] || pot[letter.toLowerCase()] || pot[`inductor${letter}`] || {};
      const high = ind.high || ind.High || ind.HIGH || ind;
      const inter = ind.intermediate || ind.Intermediate || ind.INTERMEDIATE || {};

      let cr =
        parseVal(high.conductanceRatio) ??
        parseVal(high.condRatio) ??
        parseVal(high.conductance_ratio) ??
        parseVal(high.ratio) ??
        parseVal(inter.conductanceRatio) ??
        parseVal(inter.condRatio) ??
        parseVal(ind.conductanceRatio) ??
        0;

      let cur =
        parseVal(high.inductorCurrent) ??
        parseVal(high.current) ??
        parseVal(high.lineCurrent) ??
        parseVal(high.indCurrent) ??
        parseVal(inter.inductorCurrent) ??
        parseVal(inter.current) ??
        parseVal(ind.inductorCurrent) ??
        0;

      let rawDate = doc.date || (doc.createdAt ? new Date(doc.createdAt).toISOString().split("T")[0] : "N/A");
      let displayDate = rawDate;

      if (rawDate.includes("-")) {
        const parts = rawDate.split("-");
        if (parts.length === 3) displayDate = `${parts[1]}/${parts[2]}`;
      } else if (rawDate.includes("/")) {
        const parts = rawDate.split("/");
        if (parts.length >= 2) displayDate = `${parts[0]}/${parts[1]}`;
      }

      return {
        date: displayDate,
        fullDate: rawDate,
        conductanceRatio: Number(Number(cr).toFixed(4)),
        current: Number(Number(cur).toFixed(2)),
      };
    };

    // Range limit calculation (Default: Last 5 Days)
    let limit = 5;
    if (range === "20d") limit = 20;
    else if (range === "30d") limit = 30;
    else if (range === "5d") limit = 5;

    let chartData = [];

    if (range === "1y" || range === "2y") {
      const limitMonths = range === "2y" ? 24 : 12;
      const monthMap = new Map();
      records.forEach((doc) => {
        const d = doc.date || "";
        const monthKey = d.length >= 7 ? d.slice(0, 7) : "Monthly";
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, extractPoint(doc));
        }
      });
      chartData = Array.from(monthMap.values()).slice(0, limitMonths).reverse();
    } else {
      // Pick last N records and reverse for chronological left-to-right chart
      chartData = records.slice(0, limit).reverse().map(extractPoint);
    }

    return res.json({
      success: true,
      inductor: rawKey,
      requestedRange: range,
      totalRecordsInDb: records.length,
      returnedCount: chartData.length,
      data: chartData,
    });
  } catch (err) {
    console.error("Inductor Analytics Route Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;