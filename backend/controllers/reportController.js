const DailyInductorData = require("../models/DailyInductorData");
const ReportHistory = require("../models/ReportHistory");
const AnalysisHistory = require("../models/AnalysisHistory");
const { buildPmPotReport, buildMainPotReport } = require("../services/reportDataService");

async function loadRecordOr404(date, res) {
  const record = await DailyInductorData.findOne({ date });
  if (!record) {
    res.status(404).json({ message: `No saved readings found for ${date}. Save data for this date first.` });
    return null;
  }
  return record;
}

/** Finds the most recent saved record strictly before `date`, for trend comparison. */
async function findPreviousRecord(date) {
  return DailyInductorData.findOne({ date: { $lt: date } }).sort({ date: -1 });
}

/** GET /api/reports/pm-pot/:date */
async function getPmPotReport(req, res, next) {
  try {
    const record = await loadRecordOr404(req.params.date, res);
    if (!record) return;
    const previousRecord = await findPreviousRecord(record.date);
    const report = buildPmPotReport(record, previousRecord);
    res.json({
      date: record.date,
      generatedTime: new Date(),
      generatedByName: req.user?.name || req.user?.username || "",
      record: { source: record.source, remarks: record.remarks, status: record.status },
      ...report,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/reports/main-pot/:date */
async function getMainPotReport(req, res, next) {
  try {
    const record = await loadRecordOr404(req.params.date, res);
    if (!record) return;
    const previousRecord = await findPreviousRecord(record.date);
    const report = buildMainPotReport(record, previousRecord);
    res.json({
      date: record.date,
      generatedTime: new Date(),
      generatedByName: req.user?.name || req.user?.username || "",
      record: { source: record.source, remarks: record.remarks, status: record.status },
      ...report,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/preview/:reportType/:date
 * A lightweight version of the two endpoints above, used by the Report
 * History page's Preview action so it doesn't need to know which full
 * builder to call — just the report type and date.
 */
async function getReportPreview(req, res, next) {
  try {
    const { reportType, date } = req.params;
    const record = await loadRecordOr404(date, res);
    if (!record) return;
    const previousRecord = await findPreviousRecord(date);

    let report;
    if (reportType === "pm-pot") report = buildPmPotReport(record, previousRecord);
    else if (reportType === "main-pot") report = buildMainPotReport(record, previousRecord);
    else return res.status(400).json({ message: "Unknown report type for preview" });

    res.json({ date: record.date, ...report });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/reports/log
 * Body: { reportType, date, format, stats, observations, healthScore, equipmentStatus, recommendations }
 * Called whenever the user hits Generate/Download/Print on a report — records
 * both a `report_history` entry (Report History module) and an
 * `analysis_history` entry (Industrial Analysis Engine audit trail) in one call.
 */
async function logReport(req, res, next) {
  try {
    const { reportType, date, format, stats, observations, healthScore, equipmentStatus, recommendations } = req.body;
    if (!reportType) return res.status(400).json({ message: "reportType is required" });

    const reportEntry = await ReportHistory.create({
      reportType,
      date,
      format: format || "pdf",
      generatedBy: req.user?.id,
      generatedByName: req.user?.name || req.user?.username || "",
      generatedTime: new Date(),
    });

    let analysisEntry = null;
    if (date && (reportType === "PM Pot Analysis" || reportType === "Main Pot Analysis")) {
      analysisEntry = await AnalysisHistory.create({
        reportType,
        date,
        stats: stats || {},
        observations: observations || [],
        healthScore: healthScore ?? null,
        equipmentStatus: equipmentStatus || null,
        recommendations: recommendations || [],
        generatedBy: req.user?.id,
        generatedByName: req.user?.name || req.user?.username || "",
        generatedTime: new Date(),
      });
    }

    res.status(201).json({ report: reportEntry, analysis: analysisEntry });
  } catch (err) {
    next(err);
  }
}

/** GET /api/reports/history?reportType=&from=&to=&page=&pageSize= — paginated */
async function getReportHistory(req, res, next) {
  try {
    const { reportType, from, to } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(200, Number(req.query.pageSize) || 50);

    const query = {};
    if (reportType) query.reportType = reportType;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const [history, total] = await Promise.all([
      ReportHistory.find(query).sort({ generatedTime: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      ReportHistory.countDocuments(query),
    ]);

    res.json({ history, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/reports/history/:id */
async function deleteReportHistory(req, res, next) {
  try {
    const result = await ReportHistory.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Report history entry not found" });
    res.json({ message: "Deleted", id: req.params.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPmPotReport, getMainPotReport, getReportPreview, logReport, getReportHistory, deleteReportHistory };
