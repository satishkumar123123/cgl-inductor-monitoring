const express = require("express");
const router = express.Router();
const DailyInductorData = require("../models/DailyInductorData");
const InductorRemark = require("../models/InductorRemark");

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

// Helper for Case-Insensitive Key Matching
const getFieldInsensitive = (obj, targetKey) => {
  if (!obj || typeof obj !== "object") return null;
  const cleanTarget = String(targetKey).toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const key of Object.keys(obj)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanKey === cleanTarget) {
      return obj[key];
    }
  }
  return null;
};

// 3. GET ANALYTICS (Case-Insensitive for MAINPOT, MainPot, mainPot, etc.)
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    const rawKey = String(req.params.inductorKey || "").toUpperCase();
    const range = req.query.range || "5d";

    const isPm = rawKey.includes("PM");
    const targetPot = isPm ? "pmpot" : "mainpot";

    let targetLetter = "a";
    if (rawKey.includes("B")) targetLetter = "b";
    else if (rawKey.includes("C")) targetLetter = "c";
    else if (rawKey.includes("D")) targetLetter = "d";

    const records = await DailyInductorData.find({})
      .sort({ date: -1, createdAt: -1 })
      .lean();

    if (!records || records.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const parseNum = (val) => {
      if (val === undefined || val === null || val === "" || val === "-" || val === "—") return null;
      const n = parseFloat(val);
      return isNaN(n) ? null : n;
    };

    const extractPoint = (doc) => {
      // 1. Find Pot (mainPot, MAINPOT, main_pot, MAIN_POT)
      const pot = getFieldInsensitive(doc, targetPot) || doc[isPm ? "pmPot" : "mainPot"] || {};
      
      // 2. Find Inductor (A, B, C, D, inductorA, INDUCTOR_A)
      const ind = getFieldInsensitive(pot, targetLetter) || getFieldInsensitive(pot, `inductor${targetLetter}`) || pot;
      
      // 3. Find Levels (HIGH, High, high, INTERMEDIATE, Interm)
      const high = getFieldInsensitive(ind, "high") || ind;
      const inter = getFieldInsensitive(ind, "intermediate") || getFieldInsensitive(ind, "interm") || {};

      // 4. Find Conductance Ratio
      const crVal =
        getFieldInsensitive(high, "conductanceRatio") ??
        getFieldInsensitive(high, "condRatio") ??
        getFieldInsensitive(high, "conductanceratio") ??
        getFieldInsensitive(high, "ratio") ??
        getFieldInsensitive(inter, "conductanceRatio") ??
        getFieldInsensitive(inter, "condRatio") ??
        getFieldInsensitive(ind, "conductanceRatio") ??
        0;

      // 5. Find Inductor Current
      const curVal =
        getFieldInsensitive(high, "inductorCurrent") ??
        getFieldInsensitive(high, "current") ??
        getFieldInsensitive(high, "lineCurrent") ??
        getFieldInsensitive(inter, "inductorCurrent") ??
        getFieldInsensitive(inter, "current") ??
        getFieldInsensitive(ind, "inductorCurrent") ??
        0;

      const cr = parseNum(crVal) || 0;
      const cur = parseNum(curVal) || 0;

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
        conductanceRatio: Number(cr.toFixed(4)),
        current: Number(cur.toFixed(2)),
      };
    };

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
      chartData = records.slice(0, limit).reverse().map(extractPoint);
    }

    return res.json({ success: true, data: chartData });
  } catch (err) {
    console.error("Inductor Analytics Route Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;