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

// 3. GET REAL ANALYTICS (Recent 30 Days / 1 Year / 2 Years)
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    const { inductorKey } = req.params; // e.g. "MAIN_A", "MAIN_B", "PM_A"
    const range = req.query.range || "30d";

    // Extract pot and inductor letter: MAIN_A -> mainPot, A | PM_B -> pmPot, B
    let potKey = "mainPot";
    let indLetter = "A";

    if (inductorKey.startsWith("PM_")) {
      potKey = "pmPot";
      indLetter = inductorKey.replace("PM_", "");
    } else if (inductorKey.startsWith("MAIN_")) {
      potKey = "mainPot";
      indLetter = inductorKey.replace("MAIN_", "");
    }

    // Fetch records sorted by date
    let records = await DailyInductorData.find().sort({ date: -1 });

    const parseNum = (val) => {
      if (val === undefined || val === null || val === "" || val === "-") return 0;
      return parseFloat(val) || 0;
    };

    let chartList = [];

    if (range === "30d") {
      // Recent 30 records
      const sliceRecords = records.slice(0, 30).reverse();

      chartList = sliceRecords.map((r) => {
        const indObj = r[potKey]?.[indLetter] || {};
        const highObj = indObj.high || {};

        const condRatio =
          parseNum(highObj.conductanceRatio) ||
          parseNum(highObj.condRatio) ||
          parseNum(indObj.conductanceRatio) ||
          parseNum(indObj.condRatio);

        const curr =
          parseNum(highObj.inductorCurrent) ||
          parseNum(highObj.current) ||
          parseNum(indObj.inductorCurrent) ||
          parseNum(indObj.current);

        return {
          date: r.date ? r.date.slice(5) : "—", // e.g. "08-14"
          conductanceRatio: condRatio,
          current: curr,
        };
      });
    } else {
      // 1 Year or 2 Years: Take 1st entry of each month
      const limitMonths = range === "2y" ? 24 : 12;
      const monthMap = new Map();

      records.forEach((r) => {
        if (!r.date) return;
        const monthKey = r.date.slice(0, 7); // "YYYY-MM"

        if (!monthMap.has(monthKey)) {
          const indObj = r[potKey]?.[indLetter] || {};
          const highObj = indObj.high || {};

          const condRatio =
            parseNum(highObj.conductanceRatio) ||
            parseNum(highObj.condRatio) ||
            parseNum(indObj.conductanceRatio);

          const curr =
            parseNum(highObj.inductorCurrent) ||
            parseNum(highObj.current) ||
            parseNum(indObj.inductorCurrent);

          monthMap.set(monthKey, {
            date: monthKey,
            conductanceRatio: condRatio,
            current: curr,
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