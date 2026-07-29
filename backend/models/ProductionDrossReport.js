const mongoose = require("mongoose");

// Individual Bottom Dross Entry Schema
const BottomDrossLogSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // e.g. "2026-07-15"
    quantityMT: { type: Number, required: true, default: 0 },
    lineRemarks: { type: String, default: "" }, // e.g. "Line Down 20-25 Feb"
  },
  { _id: true, timestamps: true }
);

// Monthly Production & Dross Schema
const ProductionDrossReportSchema = new mongoose.Schema(
  {
    monthYear: { type: String, required: true, unique: true, index: true }, // Format: "YYYY-MM" e.g., "2026-07"
    productionMT: { type: Number, default: 0 },
    metalChargedMT: { type: Number, default: 0 },
    totalDrossMT: { type: Number, default: 0 },
    drossPercent: { type: Number, default: 0 },
    drossKgPerMT: { type: Number, default: 0 },
    bottomDrossLogs: [BottomDrossLogSchema],
    totalBottomDrossMT: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
    updatedBy: { type: String, default: "Admin" },
  },
  { timestamps: true, collection: "production_dross_reports" }
);

module.exports =
  mongoose.models.ProductionDrossReport ||
  mongoose.model("ProductionDrossReport", ProductionDrossReportSchema);