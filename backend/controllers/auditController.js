const asyncHandler = require("../utils/asyncHandler");
const AuditLog = require("../models/AuditLog");

/**
 * GET /api/audit-logs?user=&method=&from=&to=&page=&pageSize=
 * Admin only. Paginated so the audit trail stays fast to query even after
 * months of activity.
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { user, method, from, to } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(200, Number(req.query.pageSize) || 50);

  const query = {};
  if (user) query.userName = { $regex: user, $options: "i" };
  if (method) query.method = method;
  if (from || to) {
    query.timestamp = {};
    if (from) query.timestamp.$gte = new Date(from);
    if (to) query.timestamp.$lte = new Date(to);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ timestamp: -1 }).skip((page - 1) * pageSize).limit(pageSize),
    AuditLog.countDocuments(query),
  ]);

  res.json({ logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

module.exports = { getAuditLogs };
