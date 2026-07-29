const mongoose = require("mongoose");

/**
 * Stores the computed statistics + automatic industrial observations for
 * every report generated, independent of the report's PDF/Excel format —
 * this is the audit trail of "what the analysis engine concluded" over time.
 */
const AnalysisHistorySchema = new mongoose.Schema(
  {
    reportType: { type: String, enum: ["PM Pot Analysis", "Main Pot Analysis"], required: true },
    date: { type: String, required: true },
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    observations: { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ id, message, severity }]
    healthScore: { type: Number, default: null },
    equipmentStatus: { type: String, enum: ["Excellent", "Good", "Normal", "Needs Attention", "Critical", null], default: null },
    recommendations: { type: [String], default: [] },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    generatedByName: { type: String, default: "" },
    generatedTime: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "analysis_history" }
);

module.exports = mongoose.model("AnalysisHistory", AnalysisHistorySchema);
