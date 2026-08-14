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

// 3. GET ANALYTICS - DEEP INTROSPECTION QUERY
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    const rawKey = String(req.params.inductorKey || "").toUpperCase();
    const range = req.query.range || "5d";

    // 1. Pot & Inductor Detection
    const isPm = rawKey.includes("PM");
    const potKey = isPm ? "pmPot" : "mainPot";

    let letter = "A";
    if (rawKey.includes("B")) letter = "B";
    else if (rawKey.includes("C")) letter = "C";
    else if (rawKey.includes("D")) letter = "D";

    // 2. Fetch all records from DailyInductorData
    let records = await DailyInductorData.find().sort({ date: -1 }).lean();

    if (!records || records.length === 0) {
      // Fallback check if stored without lean
      records = await DailyInductorData.find().sort({ createdAt: -1 }).lean();
    }

    if (!records || records.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const parseNum = (val) => {
      if (val === undefined || val === null || val === "" || val === "-" || val === "—") return null;
      const n = parseFloat(val);
      return isNaN(n) ? null : n;
    };

    // Helper: Deep Search inside an object for key aliases
    const findInObj = (obj, aliases) => {
      if (!obj || typeof obj !== "object") return null;
      for (const k of Object.keys(obj)) {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const alias of aliases) {
          const cleanA = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (cleanK === cleanA) {
            const parsed = parseNum(obj[k]);
            if (parsed !== null) return parsed;
          }
        }
      }
      return null;
    };

    const extractPoint = (doc) => {
      const pot = doc[potKey] || doc[potKey.toLowerCase()] || {};
      const ind = pot[letter] || pot[letter.toLowerCase()] || pot[`inductor${letter}`] || {};
      const high = ind.high || ind.High || {};
      const inter = ind.intermediate || ind.Intermediate || {};

      const ratioAliases = [
        "conductanceRatio",
        "condRatio",
        "conductance_ratio",
        "conductanceCurrentRatio",
        "ratio",
        "conductance"
      ];

      const currentAliases = [
        "inductorCurrent",
        "current",
        "lineCurrent",
        "indCurrent",
        "i",
        "inductor_current"
      ];

      // Priority 1: High level
      let cr = findInObj(high, ratioAliases);
      let cur = findInObj(high, currentAliases);

      // Priority 2: Intermediate level
      if (cr === null) cr = findInObj(inter, ratioAliases);
      if (cur === null) cur = findInObj(inter, currentAliases);

      // Priority 3: Root of Inductor
      if (cr === null) cr = findInObj(ind, ratioAliases);
      if (cur === null) cur = findInObj(ind, currentAliases);

      // Format clean readable date
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
        conductanceRatio: cr !== null ? Number(cr.toFixed(4)) : 0,
        current: cur !== null ? Number(cur.toFixed(2)) : 0,
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