const { runAnalysisEngine } = require("./analysisService");

const ROW_IDS = [
  "rPhase", "yPhase", "bPhase", "inductorVoltage", "lineCurrent", "linePF", "power",
  "inductorCurrent", "impedanceZ", "resistanceR", "reactanceX", "inductorPF", "inductorKVA",
  "conductanceInitial", "conductanceRatio", "kvarConnected", "balancingKvar",
];

function flattenPot(potData, inductors, potLabelPrefix) {
  const entries = [];
  inductors.forEach((ind) => {
    ["high", "intermediate"].forEach((level) => {
      const levelData = potData?.[ind]?.[level] || {};
      const entry = { label: `${potLabelPrefix}${ind} (${level === "high" ? "High" : "Intermediate"})`, inductor: ind, level };
      ROW_IDS.forEach((id) => (entry[id] = Number(levelData[id]) || 0));
      entries.push(entry);
    });
  });
  return entries;
}

/**
 * Builds the full PM Pot report payload from a DailyInductorData document,
 * running it through the Industrial Analysis Engine. `previousRecord` (the
 * prior saved day, if any) is used only to detect a power increase/decrease
 * trend — everything else is computed from `record` alone.
 */
function buildPmPotReport(record, previousRecord) {
  const entries = flattenPot(record.pmPot?.toObject ? record.pmPot.toObject() : record.pmPot, ["A", "B"], "PM-");
  const previousStats = previousRecord
    ? runAnalysisEngine(flattenPot(previousRecord.pmPot?.toObject ? previousRecord.pmPot.toObject() : previousRecord.pmPot, ["A", "B"], "PM-")).stats
    : null;
  return { entries, ...runAnalysisEngine(entries, previousStats) };
}

/**
 * Builds the full Main Pot report payload (Inductors A-D), same pattern as
 * the PM Pot report above.
 */
function buildMainPotReport(record, previousRecord) {
  const entries = flattenPot(record.mainPot?.toObject ? record.mainPot.toObject() : record.mainPot, ["A", "B", "C", "D"], "");
  const previousStats = previousRecord
    ? runAnalysisEngine(flattenPot(previousRecord.mainPot?.toObject ? previousRecord.mainPot.toObject() : previousRecord.mainPot, ["A", "B", "C", "D"], "")).stats
    : null;
  return { entries, ...runAnalysisEngine(entries, previousStats) };
}

module.exports = { buildPmPotReport, buildMainPotReport, ROW_IDS };
