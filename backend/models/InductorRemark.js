const mongoose = require("mongoose");

const InductorRemarkSchema = new mongoose.Schema(
  {
    inductorKey: { type: String, required: true, index: true }, // e.g. "MAIN_A", "MAIN_B", "PM_A", etc.
    inductorName: { type: String, required: true }, // e.g. "Main Pot Inductor A"
    remark: { type: String, required: true },
    category: { type: String, default: "General" }, // e.g., "Maintenance", "Greasing", "Inspection", "General"
    createdBy: { type: String, default: "Site Admin" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.InductorRemark ||
  mongoose.model("InductorRemark", InductorRemarkSchema);