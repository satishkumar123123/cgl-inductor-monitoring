const mongoose = require("mongoose");

/**
 * Automatic audit trail of every mutating request (create/update/delete,
 * login, uploads, report generation). Populated by middleware/auditLogger.js
 * so individual controllers never need to remember to log anything.
 */
const AuditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String, default: "anonymous" },
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number },
    durationMs: { type: Number },
    ip: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { collection: "audit_logs" }
);

AuditLogSchema.index({ userName: 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
