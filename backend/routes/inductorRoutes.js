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

// 3. GET ANALYTICS (Matches exact DailyInductorData schema)
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    const rawKey = String(req.params.inductorKey || "").toUpperCase();
    const range = req.query.range || "5d";

    // Pot determination
    const isPm = rawKey.includes("PM");
    const potKey = isPm ? "pmPot" : "mainPot";

    // Letter determination
    let letter = "A";
    if (rawKey.includes("B")) letter = "B";
    else if (rawKey.includes("C")) letter = "C";
    else if (rawKey.includes("D")) letter = "D";

    // Exact historyController query
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
      const pot = doc[potKey] || doc[potKey.toLowerCase()] || {};
      const ind = pot[letter] || pot[letter.toLowerCase()] || pot[`inductor${letter}`] || {};
      const high = ind.high || ind.High || ind;
      const inter = ind.intermediate || ind.Intermediate || {};

      let cr =
        parseNum(high.conductanceRatio) ??
        parseNum(high.condRatio) ??
        parseNum(high.conductance_ratio) ??
        parseNum(high.ratio) ??
        parseNum(inter.conductanceRatio) ??
        parseNum(inter.condRatio) ??
        parseNum(ind.conductanceRatio) ??
        0;

      let cur =
        parseNum(high.inductorCurrent) ??
        parseNum(high.current) ??
        parseNum(high.lineCurrent) ??
        parseNum(inter.inductorCurrent) ??
        parseNum(inter.current) ??
        parseNum(ind.inductorCurrent) ??
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