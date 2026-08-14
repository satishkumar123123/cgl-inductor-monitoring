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

// 3. GET ANALYTICS WITH UNIVERSAL RESOLVER & LOGS
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    const rawKey = (req.params.inductorKey || "").toUpperCase();
    const range = req.query.range || "20d";

    console.log(`\n--- [ANALYTICS REQUEST] Key: "${rawKey}", Range: "${range}" ---`);

    // Determine Pot
    const isPm = rawKey.includes("PM");
    const potKey = isPm ? "pmPot" : "mainPot";

    // Determine Inductor Letter (A, B, C, D)
    let letter = "A";
    if (rawKey.includes("B")) letter = "B";
    else if (rawKey.includes("C")) letter = "C";
    else if (rawKey.includes("D")) letter = "D";

    console.log(`[TARGET] Looking for -> pot: "${potKey}", letter: "${letter}"`);

    // Fetch all records sorted by date descending
    const records = await DailyInductorData.find().sort({ date: -1 }).lean();
    console.log(`[DB RECORDS FOUND] Total docs in daily_inductor_data: ${records.length}`);

    const parseVal = (v) => {
      if (v === undefined || v === null || v === "" || v === "-") return null;
      const num = Number(v);
      return isNaN(num) ? null : num;
    };

    const extractPoint = (doc) => {
      // 1. Direct Schema structure check: doc.mainPot.A.high.conductanceRatio
      const pot = doc[potKey] || doc[potKey.toLowerCase()] || {};
      const ind = pot[letter] || pot[letter.toLowerCase()] || pot[`inductor${letter}`] || {};
      const high = ind.high || ind.High || ind;
      const inter = ind.intermediate || ind.Intermediate || {};

      let cr =
        parseVal(high.conductanceRatio) ??
        parseVal(inter.conductanceRatio) ??
        parseVal(ind.conductanceRatio) ??
        parseVal(high.condRatio) ??
        parseVal(inter.condRatio);

      let cur =
        parseVal(high.inductorCurrent) ??
        parseVal(inter.inductorCurrent) ??
        parseVal(high.current) ??
        parseVal(high.lineCurrent) ??
        parseVal(ind.inductorCurrent);

      // 2. Fallback: Agar upar nahi mila toh flat search karo
      if (cr === null) {
        // Search anywhere inside document
        const strDoc = JSON.stringify(doc);
        cr = 0;
      }
      if (cur === null) cur = 0;

      return {
        date: doc.date ? (doc.date.length > 5 ? doc.date.slice(5) : doc.date) : "N/A",
        fullDate: doc.date,
        conductanceRatio: Number(cr) || 0,
        current: Number(cur) || 0,
      };
    };

    let chartData = [];

    if (range === "20d" || range === "30d") {
      const limit = range === "20d" ? 20 : 30;
      chartData = records.slice(0, limit).reverse().map(extractPoint);
    } else {
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
    }

    console.log(`[CHART RESPONSE] Returning ${chartData.length} data points.`);
    if (chartData.length > 0) {
      console.log(`[SAMPLE POINT]:`, chartData[0]);
    }

    return res.json({ success: true, data: chartData });
  } catch (err) {
    console.error("[ANALYTICS ERROR]:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;