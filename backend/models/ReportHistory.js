// backend/controllers/reportController.js
const ReportHistory = require("../models/ReportHistory");

// 1. LOG / SAVE REPORT ENTRY
exports.logReport = async (req, res) => {
  try {
    const { reportType, date, periodLabel, format } = req.body;

    if (!reportType) {
      return res.status(400).json({ message: "Report type is required" });
    }

    const reportEntry = new ReportHistory({
      reportType,
      date: date || new Date().toISOString().split("T")[0],
      periodLabel: periodLabel || "",
      format: format || "pdf",
      generatedByName: req.user?.username || req.body.generatedByName || "Admin User",
      generatedBy: req.user?._id || undefined,
      generatedTime: new Date(),
    });

    const savedReport = await reportEntry.save();

    return res.status(201).json({
      message: "Report logged successfully",
      data: savedReport,
    });
  } catch (err) {
    console.error("Error in logReport:", err);
    res.status(500).json({ message: "Failed to log report", error: err.message });
  }
};

// 2. GET REPORT HISTORY
exports.getReportHistory = async (req, res) => {
  try {
    const history = await ReportHistory.find()
      .sort({ generatedTime: -1 })
      .limit(100);

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 3. DELETE REPORT HISTORY ENTRY
exports.deleteReportHistory = async (req, res) => {
  try {
    const { id } = req.params;
    await ReportHistory.findByIdAndDelete(id);
    res.json({ message: "Report history entry deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

// 4. PM POT REPORT PREVIEW / DATA
exports.getPmPotReport = async (req, res) => {
  try {
    const { date } = req.params;
    res.json({ message: `PM Pot report data for ${date}`, date });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 5. MAIN POT REPORT PREVIEW / DATA
exports.getMainPotReport = async (req, res) => {
  try {
    const { date } = req.params;
    res.json({ message: `Main Pot report data for ${date}`, date });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 6. GENERAL PREVIEW
exports.getReportPreview = async (req, res) => {
  try {
    const { reportType, date } = req.params;
    res.json({ message: `Preview for ${reportType} on ${date}`, reportType, date });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};