// src/utils/rowsConfig.js

export const todayStr = () => new Date().toISOString().split("T")[0];

export const fmtDateLong = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const POTS = {
  mainPot: {
    key: "mainPot",
    label: "Main Pot",
    inductors: ["A", "B", "C", "D"],
  },
  pmPot: {
    key: "pmPot",
    label: "PM Pot",
    inductors: ["A", "B"],
  },
};

export const ROWS = [
  { id: "rPhase", label: "R-Phase Current", unit: "A" },
  { id: "yPhase", label: "Y-Phase Current", unit: "A" },
  { id: "bPhase", label: "B-Phase Current", unit: "A" },
  { id: "lineCurrent", label: "Line Current", unit: "A" },
  { id: "linePF", label: "Line Power Factor", unit: "" },
  { id: "power", label: "Power", unit: "kW" },
  { id: "inductorVoltage", label: "Inductor Voltage", unit: "V" },
  { id: "inductorCurrent", label: "Inductor Current", unit: "A" },
  { id: "inductorPF", label: "Inductor Power Factor", unit: "" },
  { id: "kvarConnected", label: "Inductor KVA / KVAR Connected", unit: "kVAR" },
  { id: "balancingKvar", label: "Balancing KVAR", unit: "kVAR" },
  { id: "impedanceZ", label: "Impedance (Z)", unit: "Ω" },
  { id: "resistanceR", label: "Resistance (R)", unit: "Ω" },
  { id: "reactanceX", label: "Reactance (X)", unit: "Ω" },
  { id: "initialValue", label: "Conductance Initial Value", unit: "" },
  { id: "conductanceRatio", label: "Conductance Ratio", unit: "" },
];

export const emptyRecord = (date = todayStr()) => {
  const createEmptyInductor = () => ({
    high: {
      rPhase: "", yPhase: "", bPhase: "", lineCurrent: "", linePF: "",
      power: "", inductorVoltage: "", inductorCurrent: "", inductorPF: "",
      kvarConnected: "", balancingKvar: "", impedanceZ: "", resistanceR: "",
      reactanceX: "", initialValue: "", conductanceRatio: ""
    },
    intermediate: {
      rPhase: "", yPhase: "", bPhase: "", lineCurrent: "", linePF: "",
      power: "", inductorVoltage: "", inductorCurrent: "", inductorPF: "",
      kvarConnected: "", balancingKvar: "", impedanceZ: "", resistanceR: "",
      reactanceX: "", initialValue: "", conductanceRatio: ""
    }
  });

  return {
    date,
    source: "manual",
    uploadedFileName: "",
    status: "Normal",
    remarks: "",
    mainPot: {
      A: createEmptyInductor(),
      B: createEmptyInductor(),
      C: createEmptyInductor(),
      D: createEmptyInductor(),
    },
    pmPot: {
      A: createEmptyInductor(),
      B: createEmptyInductor(),
    },

    // Production & Dross Report Initial States
    productionAndDross: {
      productionMT: "",
      metalChargedMT: "",
      totalDrossMT: "",
      drossPercent: "",
      drossKgPerMT: "",
    },
    bottomDrossReport: {
      quantityMT: "",
      lineRemarks: "",
    },
  };
};