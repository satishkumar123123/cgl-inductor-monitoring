const mongoose = require("mongoose");

const balancingKvarSchema = new mongoose.Schema({
  inductorKey: { type: String, required: true }, // e.g. MAIN_A, PM_B
  inductorTitle: { type: String, required: true }, // e.g. Main Pot Inductor A
  date: { type: String, required: true },
  initialKvar: { type: Number, default: 0 },
  removedKvar: { type: Number, default: 0 },
  addKvar: { type: Number, default: 0 },
  actualKvar: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BalancingKvar", balancingKvarSchema);