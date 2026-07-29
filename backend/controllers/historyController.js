// backend/controllers/historyController.js
const DailyInductorData = require("../models/DailyInductorData");

/**
 * GET /api/history?from=&to=&search=
 * Returns a lightweight list for the History page.
 */
async function getHistory(req, res, next) {
  try {
    const { from, to, search } = req.query;
    const query = {};

    // Only apply date filter if both from and to are provided and valid
    if (from && to) {
      query.date = { $gte: from, $lte: to };
    } else if (from) {
      query.date = { $gte: from };
    } else if (to) {
      query.date = { $lte: to };
    }

    if (search) {
      query.$or = [
        { date: { $regex: search, $options: "i" } },
        { createdByName: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
    }

    const records = await DailyInductorData.find(query)
      .select("date source uploadedFileName createdByName status remarks lastUpdated createdAt")
      .sort({ date: -1, createdAt: -1 });

    res.json(records || []);
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistory };