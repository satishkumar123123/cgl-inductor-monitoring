const express = require("express");
const router = express.Router();
const InductorRemark = require("../models/InductorRemark");

// अगर आपके पास इंडक्टर डेटा का मॉडल है तो उसे यहाँ अनकमेंट/इम्पोर्ट कर सकते हैं:
// const InductorData = require("../models/InductorData");

// 1. Get Remarks
router.get("/remarks/:inductorKey", async (req, res) => {
  try {
    const { inductorKey } = req.params;
    const remarks = await InductorRemark.find({ inductorKey }).sort({ createdAt: -1 });
    res.json({ success: true, data: remarks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Post Remark
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

// 3. Analytics Chart Data Route (RECENT 20 DATA POINTS)
router.get("/analytics/:inductorKey", async (req, res) => {
  try {
    const { inductorKey } = req.params;

    // --- CASE A: अगर DB से Real Data लाना हो तो यह इस्तेमाल करें ---
    /*
    if (typeof InductorData !== "undefined") {
      const records = await InductorData.find({ inductorKey })
        .sort({ date: -1 }) // सबसे नए पहले
        .limit(20)          // सिर्फ Recent 20 रिकॉर्ड्स
        .lean();

      // ग्राफ पर Left-to-Right (Old to New) दिखाने के लिए रिवर्स करें
      return res.json({
        success: true,
        data: records.reverse()
      });
    }
    */

    // --- CASE B: RECENT 20 SAMPLE / FALLBACK DATA ---
    const sampleRecent20Data = [
      { date: "Day 01", conductanceRatio: 0.81, current: 405 },
      { date: "Day 02", conductanceRatio: 0.82, current: 410 },
      { date: "Day 03", conductanceRatio: 0.80, current: 408 },
      { date: "Day 04", conductanceRatio: 0.83, current: 412 },
      { date: "Day 05", conductanceRatio: 0.85, current: 420 },
      { date: "Day 06", conductanceRatio: 0.84, current: 418 },
      { date: "Day 07", conductanceRatio: 0.82, current: 415 },
      { date: "Day 08", conductanceRatio: 0.81, current: 411 },
      { date: "Day 09", conductanceRatio: 0.83, current: 416 },
      { date: "Day 10", conductanceRatio: 0.86, current: 422 },
      { date: "Day 11", conductanceRatio: 0.85, current: 421 },
      { date: "Day 12", conductanceRatio: 0.84, current: 419 },
      { date: "Day 13", conductanceRatio: 0.82, current: 414 },
      { date: "Day 14", conductanceRatio: 0.80, current: 409 },
      { date: "Day 15", conductanceRatio: 0.83, current: 417 },
      { date: "Day 16", conductanceRatio: 0.85, current: 423 },
      { date: "Day 17", conductanceRatio: 0.84, current: 420 },
      { date: "Day 18", conductanceRatio: 0.86, current: 425 },
      { date: "Day 19", conductanceRatio: 0.85, current: 422 },
      { date: "Day 20", conductanceRatio: 0.87, current: 428 }
    ];

    res.json({ 
      success: true, 
      data: sampleRecent20Data 
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;