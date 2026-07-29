const express = require("express");
const router = express.Router();
const ProductionDrossReport = require("../models/ProductionDrossReport");

// GET MONTHLY REPORT
router.get("/get-report", async (req, res) => {
  try {
    const { monthYear } = req.query;
    if (!monthYear) {
      return res.status(400).json({ success: false, message: "Month is required" });
    }

    let report = await ProductionDrossReport.findOne({ monthYear });
    if (!report) {
      return res.json({
        success: true,
        data: {
          monthYear,
          productionMT: 0,
          metalChargedMT: 0,
          totalDrossMT: 0,
          drossPercent: 0,
          drossKgPerMT: 0,
          bottomDrossLogs: [],
          totalBottomDrossMT: 0,
        },
      });
    }
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SAVE MONTHLY SUMMARY
router.post("/save-monthly", async (req, res) => {
  try {
    const { monthYear, productionMT, metalChargedMT, totalDrossMT, remarks } = req.body;

    if (!monthYear) {
      return res.status(400).json({ success: false, message: "Month is required" });
    }

    const prod = parseFloat(productionMT) || 0;
    const metal = parseFloat(metalChargedMT) || 0;
    const dross = parseFloat(totalDrossMT) || 0;

    const drossPercent = metal > 0 ? parseFloat(((dross / metal) * 100).toFixed(2)) : 0;
    const drossKgPerMT = prod > 0 ? parseFloat(((dross * 1000) / prod).toFixed(2)) : 0;

    let report = await ProductionDrossReport.findOne({ monthYear });

    if (report) {
      report.productionMT = prod;
      report.metalChargedMT = metal;
      report.totalDrossMT = dross;
      report.drossPercent = drossPercent;
      report.drossKgPerMT = drossKgPerMT;
      report.remarks = remarks || "";
      await report.save();
    } else {
      report = new ProductionDrossReport({
        monthYear,
        productionMT: prod,
        metalChargedMT: metal,
        totalDrossMT: dross,
        drossPercent,
        drossKgPerMT,
        remarks: remarks || "",
        bottomDrossLogs: [],
      });
      await report.save();
    }

    res.json({ success: true, data: report, message: "Saved successfully!" });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADD BOTTOM DROSS LOG
router.post("/add-bottom-dross", async (req, res) => {
  try {
    const { date, quantityMT, lineRemarks } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    const monthYear = date.slice(0, 7); // "YYYY-MM"
    const qty = parseFloat(quantityMT) || 0;

    let report = await ProductionDrossReport.findOne({ monthYear });
    if (!report) {
      report = new ProductionDrossReport({
        monthYear,
        productionMT: 0,
        metalChargedMT: 0,
        totalDrossMT: 0,
        bottomDrossLogs: [],
      });
    }

    report.bottomDrossLogs.push({ date, quantityMT: qty, lineRemarks: lineRemarks || "" });
    report.totalBottomDrossMT = report.bottomDrossLogs.reduce(
      (acc, item) => acc + (parseFloat(item.quantityMT) || 0),
      0
    );

    await report.save();
    res.json({ success: true, data: report, message: "Bottom dross log added!" });
  } catch (err) {
    console.error("Add bottom dross error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET ALL HISTORY
router.get("/history", async (req, res) => {
  try {
    const history = await ProductionDrossReport.find().sort({ monthYear: -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;