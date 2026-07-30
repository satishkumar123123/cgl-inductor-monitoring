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

// 1. ADDED INDUCTOR REMARKS ROUTE IMPORT
const inductorRoutes = require("./routes/inductorRoutes");

const app = express();

// Trust proxy for IP rate limiting & proxy setups
app.set("trust proxy", 1);

// DYNAMIC CORS CONFIGURATION
// Localhost ke kisi bhi port ko allow karega (e.g. 5173, 3000, 5174, etc.)
// aur process.env.CLIENT_ORIGIN se custom production domains handle honge.
const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman, backend-to-backend)
      if (!origin) return callback(null, true);

      // Check if origin is localhost or 127.0.0.1 on ANY port
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
app.use(express.json({ limit: "5mb" }));
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

// 2. MOUNTED INDUCTOR REMARKS ROUTE
app.use("/api/inductors", inductorRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`CGL Dashboard API listening on port ${PORT}`));
});