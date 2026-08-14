// backend/models/DailyInductorData.js
const mongoose = require("mongoose");

const LevelSchema = new mongoose.Schema(
  {
    rPhase: { type: Number, default: null },
    yPhase: { type: Number, default: null },
    bPhase: { type: Number, default: null },
    inductorVoltage: { type: Number, default: null },
    lineCurrent: { type: Number, default: null },
    linePF: { type: Number, default: null },
    power: { type: Number, default: null },
    inductorCurrent: { type: Number, default: null },
    impedanceZ: { type: Number, default: null },
    resistanceR: { type: Number, default: null },
    reactanceX: { type: Number, default: null },
    inductorPF: { type: Number, default: null },
    inductorKVA: { type: Number, default: null },
    conductanceInitial: { type: Number, default: null },
    conductanceRatio: { type: Number, default: null },
    kvarConnected: { type: Number, default: null },
    balancingKvar: { type: Number, default: null },
  },
  { _id: false }
);

const InductorSchema = new mongoose.Schema(
  {
    high: { type: LevelSchema, default: () => ({}) },
    intermediate: { type: LevelSchema, default: () => ({}) },
  },
  { _id: false }
);

// 1. PRODUCTION AND DROSS SCHEMA
const ProductionAndDrossSchema = new mongoose.Schema(
  {
    productionMT: { type: Number, default: 0 },
    metalChargedMT: { type: Number, default: 0 },
    totalDrossMT: { type: Number, default: 0 },
    drossPercent: { type: Number, default: 0 },
    drossKgPerMT: { type: Number, default: 0 },
  },
  { _id: false }
);

// 2. BOTTOM DROSS REPORT SCHEMA
const BottomDrossSchema = new mongoose.Schema(
  {
    quantityMT: { type: Number, default: 0 },
    lineRemarks: { type: String, default: "" }, // e.g., "Line Down From 20-25 Feb"
  },
  { _id: false }
);

const DailyInductorDataSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, index: true },
    source: { type: String, enum: ["manual", "excel"], default: "manual" },
    uploadedFileName: { type: String, default: "" },
    uploadedTime: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String, default: "" },

    mainPot: {
      A: { type: InductorSchema, default: () => ({}) },
      B: { type: InductorSchema, default: () => ({}) },
      C: { type: InductorSchema, default: () => ({}) },
      D: { type: InductorSchema, default: () => ({}) },
    },
    pmPot: {
      A: { type: InductorSchema, default: () => ({}) },
      B: { type: InductorSchema, default: () => ({}) },
    },

    // PRODUCTION & DROSS REPORTS
    productionAndDross: {
      type: ProductionAndDrossSchema,
      default: () => ({}),
    },
    bottomDrossReport: {
      type: BottomDrossSchema,
      default: () => ({}),
    },

    remarks: { type: String, default: "" },
    status: { type: String, enum: ["Excellent", "Normal", "Needs Attention"], default: "Normal" },
    lastUpdated: { type: Date, default: Date.now },
  },
  { 
    timestamps: true, 
    collection: "daily_inductor_data" // 👈 1. Schema Level Collection Lock
  }
);

// 👈 2. Model Level Collection Lock (3rd parameter "daily_inductor_data")
module.exports =
  mongoose.models.DailyInductorData ||
  mongoose.model("DailyInductorData", DailyInductorDataSchema, "daily_inductor_data");