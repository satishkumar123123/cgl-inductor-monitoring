require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const auditLogger = require("./middleware/auditLogger");

const authRoutes = require("./routes/authRoutes");
const dataRoutes = require("./routes/dataRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const historyRoutes = require("./routes/historyRoutes");
const reportRoutes = require("./routes/reportRoutes");
const powerRoutes = require("./routes/powerRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const auditRoutes = require("./routes/auditRoutes");
const productionDrossRoutes = require("./routes/productionDrossRoutes");
const inductorRoutes = require("./routes/inductorRoutes");

// 1. ADDED BALANCING KVAR ROUTE IMPORT
const balancingKvarRoutes = require("./routes/balancingKvarRoutes");

const app = express();

// Trust proxy for IP rate limiting & proxy setups
app.set("trust proxy", 1);

// DYNAMIC CORS CONFIGURATION
const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost || configuredOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error(`CORS policy blocked request from origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(compression());

// Increased body limits to 20mb for heavy Excel JSON payloads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(auditLogger);

// Rate limiting for auth
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});
app.use("/api/auth/login", loginLimiter);

// Health check endpoint
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "cgl-dashboard-backend" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/upload-excel", uploadRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/power", powerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/production-dross", productionDrossRoutes);
app.use("/api/inductors", inductorRoutes);

// 2. MOUNTED BALANCING KVAR ROUTE
app.use("/api/balancing-kvar", balancingKvarRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`CGL Dashboard API listening on port ${PORT}`));
});