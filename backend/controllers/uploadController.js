const DailyInductorData = require("../models/DailyInductorData");
const { parseWorkbook } = require("../services/excelMappingService");

/**
 * POST /api/upload-excel
 * multipart/form-data: file=<xlsx>, date=YYYY-MM-DD
 * Parses the workbook, auto-maps rows/columns, and upserts the record for
 * the given date. Returns a mapping summary so the UI can show what happened.
 */
async function uploadExcel(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "No Excel file uploaded" });
    const { date } = req.body;
    if (!date) return res.status(400).json({ message: "date is required" });

    const { potUpdates, rowsImported, unmatched, errors } = parseWorkbook(req.file.buffer);

    const update = {
      date,
      source: "excel",
      uploadedFileName: req.file.originalname,
      uploadedTime: new Date(),
      lastUpdated: new Date(),
      ...potUpdates,
    };
    if (req.user) {
      update.createdBy = req.user.id;
      update.createdByName = req.user.name || req.user.username;
    }

    const record = await DailyInductorData.findOneAndUpdate(
      { date },
      update,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({
      message: "Imported successfully",
      fileName: req.file.originalname,
      uploadedTime: update.uploadedTime,
      rowsImported,
      unmatched,
      errors,
      record,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadExcel };
