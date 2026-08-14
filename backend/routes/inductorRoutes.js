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

// 3. GET ANALYTICS WITH ROBUST FIELD SEARCH
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    const { inductorKey } = req.params; // e.g. "MAIN_A", "PM_A"
    const range = req.query.range || "20d";

    let potKey = "mainPot";
    let indLetter = "A";

    if (inductorKey.toUpperCase().includes("PM")) {
      potKey = "pmPot";
      indLetter = inductorKey.replace(/PM_?/i, "").trim().toUpperCase() || "A";
    } else {
      potKey = "mainPot";
      indLetter = inductorKey.replace(/MAIN_?/i, "").trim().toUpperCase() || "A";
    }

    const records = await DailyInductorData.find().sort({ date: -1 });

    const parseNum = (val) => {
      if (val === undefined || val === null || val === "" || val === "-") return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

    // Deep search function for conductanceRatio & current
    const extractValues = (r) => {
      const pot = r[potKey] || r[potKey.toLowerCase()] || {};
      const ind = pot[indLetter] || pot[indLetter.toLowerCase()] || pot;
      const high = ind.high || ind.High || ind;
      const intermediate = ind.intermediate || ind.Intermediate || {};

      // Find Conductance Ratio
      const cr =
        parseNum(high.conductanceRatio) ??
        parseNum(high.condRatio) ??
        parseNum(high.conductance_ratio) ??
        parseNum(ind.conductanceRatio) ??
        parseNum(ind.condRatio) ??
        parseNum(intermediate.conductanceRatio) ??
        parseNum(r.conductanceRatio) ??
        0;

      // Find Current
      const cur =
        parseNum(high.inductorCurrent) ??
        parseNum(high.current) ??
        parseNum(high.inductor_current) ??
        parseNum(ind.inductorCurrent) ??
        parseNum(ind.current) ??
        parseNum(intermediate.inductorCurrent) ??
        parseNum(r.inductorCurrent) ??
        0;

      return { cr, cur };
    };

    let chartList = [];

    if (range === "20d" || range === "30d") {
      const limit = range === "20d" ? 20 : 30;
      const sliceRecords = records.slice(0, limit).reverse();

      chartList = sliceRecords.map((r) => {
        const { cr, cur } = extractValues(r);
        return {
          date: r.date ? (r.date.includes("-") ? r.date.split("-").slice(1).join("/") : r.date) : "N/A",
          conductanceRatio: cr,
          current: cur,
        };
      });
    } else {
      const limitMonths = range === "2y" ? 24 : 12;
      const monthMap = new Map();

      records.forEach((r) => {
        if (!r.date) return;
        const monthKey = r.date.slice(0, 7);

        if (!monthMap.has(monthKey)) {
          const { cr, cur } = extractValues(r);
          monthMap.set(monthKey, {
            date: monthKey,
            conductanceRatio: cr,
            current: cur,
          });
        }
      });

      chartList = Array.from(monthMap.values()).slice(0, limitMonths).reverse();
    }

    res.json({ success: true, data: chartList });
  } catch (err) {
    console.error("Analytics fetch error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;