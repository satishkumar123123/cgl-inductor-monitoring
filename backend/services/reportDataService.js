/**
 * ============================================================================
 * HIGH-PRECISION REPORT PAYLOAD BUILDER ENGINE
 * ============================================================================
 * Flattens nested MongoDB / Mongoose inductor documents into unified, high-contrast 
 * report arrays and executes the Industrial Analysis Engine.
 * ============================================================================
 */

const { runAnalysisEngine } = require("./analysisService");

const ROW_IDS = [
  "rPhase",
  "yPhase",
  "bPhase",
  "inductorVoltage",
  "lineCurrent",
  "linePF",
  "power",
  "inductorCurrent",
  "impedanceZ",
  "resistanceR",
  "reactanceX",
  "inductorPF",
  "inductorKVA",
  "conductanceInitial",
  "conductanceRatio",
  "kvarConnected",
  "balancingKvar",
];

/**
 * Safely parses nested data into clean numbers with zero fallbacks.
 */
function parseNumeric(val) {
  if (val === null || val === undefined || val === "") return 0;
  const num = Number(val);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Flattens nested pot telemetry readings for specified inductors & operating levels.
 */
function flattenPot(potData, inductors, potLabelPrefix) {
  const entries = [];
  if (!potData || typeof potData !== "object") return entries;

  // Convert Mongoose document to plain JS object if needed
  const rawData = typeof potData.toObject === "function" ? potData.toObject() : potData;

  inductors.forEach((ind) => {
    ["high", "intermediate"].forEach((level) => {
      const levelData = rawData?.[ind]?.[level] || rawData?.[ind] || {};
      const levelLabel = level === "high" ? "High" : "Intermediate";

      const entry = {
        label: `${potLabelPrefix}${ind} (${levelLabel})`,
        inductor: ind,
        level: level,
      };

      ROW_IDS.forEach((id) => {
        entry[id] = parseNumeric(levelData[id]);
      });

      entries.push(entry);
    });
  });

  return entries;
}

/**
 * Builds the full PM Pot analysis report payload.
 */
function buildPmPotReport(record, previousRecord) {
  if (!record || typeof record !== "object") return { entries: [] };

  const currentPmPot = record.pmPot || {};
  const entries = flattenPot(currentPmPot, ["A", "B"], "PM-");

  let previousStats = null;
  if (previousRecord && previousRecord.pmPot) {
    const prevEntries = flattenPot(previousRecord.pmPot, ["A", "B"], "PM-");
    if (prevEntries.length > 0) {
      previousStats = runAnalysisEngine(prevEntries).stats;
    }
  }

  const analysisResult = runAnalysisEngine(entries, previousStats);

  return {
    date: record.date || "",
    generatedTime: new Date().toISOString(),
    createdByName: record.createdByName || record.createdBy || "System User",
    entries,
    ...analysisResult,
  };
}

/**
 * Builds the full Main Pot analysis report payload (Inductors A-D).
 */
function buildMainPotReport(record, previousRecord) {
  if (!record || typeof record !== "object") return { entries: [] };

  const currentMainPot = record.mainPot || {};
  const entries = flattenPot(currentMainPot, ["A", "B", "C", "D"], "");

  let previousStats = null;
  if (previousRecord && previousRecord.mainPot) {
    const prevEntries = flattenPot(previousRecord.mainPot, ["A", "B", "C", "D"], "");
    if (prevEntries.length > 0) {
      previousStats = runAnalysisEngine(prevEntries).stats;
    }
  }

  const analysisResult = runAnalysisEngine(entries, previousStats);

  return {
    date: record.date || "",
    generatedTime: new Date().toISOString(),
    createdByName: record.createdByName || record.createdBy || "System User",
    entries,
    ...analysisResult,
  };
}

module.exports = {
  buildPmPotReport,
  buildMainPotReport,
  flattenPot,
  ROW_IDS,
};