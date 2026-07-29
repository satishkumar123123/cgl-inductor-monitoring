// backend/middleware/auditLogger.js
const AuditLog = require("../models/AuditLog");

const auditLogger = async (req, res, next) => {
  const start = Date.now();

  // Jab response finish ho tab log save karein
  res.on("finish", async () => {
    // Only log mutating requests (POST, PUT, DELETE, PATCH)
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
      try {
        await AuditLog.create({
          user: req.user?._id || undefined,
          userName: req.user?.username || req.body?.createdByName || "Admin User",
          method: req.method,
          path: req.originalUrl || req.path,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
          ip: req.ip || req.connection?.remoteAddress || "",
          timestamp: new Date(),
        });
      } catch (err) {
        console.error("Audit Log Save Error:", err.message);
      }
    }
  });

  next();
};

module.exports = auditLogger;