/**
 * ============================================================================
 * INDUSTRIAL ANALYSIS ENGINE
 * ============================================================================
 * A single, reusable module that turns a flat array of inductor readings
 * into: summary statistics, structured observations (with severity), a
 * 0-100 Health Score, an Equipment Status label, and plain-English
 * recommendations. Used by every report (PM Pot, Main Pot) and can be reused
 * by any future report type — just call `runAnalysisEngine(entries, previousStats)`.
 *
 * Assumptions (tune these to your plant's actual limits):
 *  - Current: overload flag at >115% of the average, underload at <85%.
 *  - Impedance: flagged "high" above 1.5 Ω (typical CGL inductor range).
 *  - Resistance variation: flagged when spread exceeds 20% of the average.
 *  - Power trend: "increasing"/"decreasing" needs a previous period's total
 *    power to compare against — pass it in as `previousStats.totalPower`.
 * ============================================================================
 */

const SEVERITY = { CRITICAL: "critical", WARNING: "warning", GOOD: "good", INFO: "info" };

/* ------------------------------- statistics ------------------------------- */
function computeStats(entries) {
  const withCurrent = entries.filter((e) => e.inductorCurrent);
  const withVoltage = entries.filter((e) => e.inductorVoltage);
  const withPower = entries.filter((e) => e.power);
  const withPF = entries.filter((e) => e.inductorPF);

  const avg = (arr, key) => (arr.length ? arr.reduce((a, e) => a + e[key], 0) / arr.length : 0);
  const max = (arr, key) => (arr.length ? arr.reduce((a, b) => (b[key] > a[key] ? b : a)) : null);
  const min = (arr, key) => (arr.length ? arr.reduce((a, b) => (b[key] < a[key] ? b : a)) : null);

  const avgCurrent = avg(withCurrent, "inductorCurrent");
  const avgVoltage = avg(withVoltage, "inductorVoltage");
  const avgPower = avg(withPower, "power");
  const avgPF = avg(withPF, "inductorPF");
  const totalPower = withPower.reduce((a, e) => a + e.power, 0);
  const maxCurrentEntry = max(withCurrent, "inductorCurrent");
  const minCurrentEntry = min(withCurrent, "inductorCurrent");
  const maxPowerEntry = max(withPower, "power");
  const minPowerEntry = min(withPower, "power");

  const currentSpread = maxCurrentEntry && minCurrentEntry ? maxCurrentEntry.inductorCurrent - minCurrentEntry.inductorCurrent : 0;
  const currentBalancePercent = avgCurrent > 0 ? Math.max(0, 100 - (currentSpread / avgCurrent) * 100) : 100;

  const voltages = withVoltage.map((e) => e.inductorVoltage);
  const maxV = voltages.length ? Math.max(...voltages) : 0;
  const minV = voltages.length ? Math.min(...voltages) : 0;
  const voltageSpread = maxV - minV;
  const voltageBalancePercent = avgVoltage > 0 ? Math.max(0, 100 - (voltageSpread / avgVoltage) * 100) : 100;

  return {
    avgCurrent, avgVoltage, avgPower, avgPF, totalPower,
    maxCurrent: maxCurrentEntry ? { value: maxCurrentEntry.inductorCurrent, label: maxCurrentEntry.label } : null,
    minCurrent: minCurrentEntry ? { value: minCurrentEntry.inductorCurrent, label: minCurrentEntry.label } : null,
    highestPowerInductor: maxPowerEntry ? { value: maxPowerEntry.power, label: maxPowerEntry.label } : null,
    lowestPowerInductor: minPowerEntry ? { value: minPowerEntry.power, label: minPowerEntry.label } : null,
    currentBalancePercent: Number(currentBalancePercent.toFixed(1)),
    voltageBalancePercent: Number(voltageBalancePercent.toFixed(1)),
  };
}

/* ----------------------------- observations -------------------------------- */
const IMPEDANCE_HIGH_THRESHOLD = 1.5;      // Ω
const RESISTANCE_VARIATION_THRESHOLD = 0.2; // 20% spread/avg
const OVERLOAD_RATIO = 1.15;                // >115% of avg current
const UNDERLOAD_RATIO = 0.85;               // <85% of avg current
const POWER_TREND_THRESHOLD = 0.05;         // ±5% vs previous period

function generateObservations(entries, stats, previousStats) {
  const obs = [];
  const push = (id, message, severity) => obs.push({ id, message, severity });

  // --- Power ---
  if (stats.avgPower > 0) push("powerNormal", `Power consumption normal — average ${stats.avgPower.toFixed(1)} kW across all readings.`, SEVERITY.GOOD);

  if (previousStats && previousStats.totalPower > 0 && stats.totalPower > 0) {
    const change = (stats.totalPower - previousStats.totalPower) / previousStats.totalPower;
    if (change > POWER_TREND_THRESHOLD) push("powerIncreasing", `Power increasing — total power up ${(change * 100).toFixed(1)}% vs the previous saved reading.`, SEVERITY.WARNING);
    else if (change < -POWER_TREND_THRESHOLD) push("powerDecreasing", `Power decreasing — total power down ${(Math.abs(change) * 100).toFixed(1)}% vs the previous saved reading.`, SEVERITY.INFO);
  }

  // --- Current imbalance ---
  if (stats.currentBalancePercent < 80) push("currentImbalanceCritical", `Critical current imbalance — balance at only ${stats.currentBalancePercent}%.`, SEVERITY.CRITICAL);
  else if (stats.currentBalancePercent < 90) push("currentImbalance", `Current imbalance observed — balance at ${stats.currentBalancePercent}%.`, SEVERITY.WARNING);
  else push("currentBalanced", `Current well balanced across inductors (${stats.currentBalancePercent}%).`, SEVERITY.GOOD);

  // --- Voltage imbalance ---
  if (stats.voltageBalancePercent < 90) push("voltageImbalance", `Voltage imbalance observed — balance at ${stats.voltageBalancePercent}%.`, SEVERITY.WARNING);
  else push("voltageStable", `Voltage stable across all inductors (balance ${stats.voltageBalancePercent}%).`, SEVERITY.GOOD);

  // --- Power Factor ---
  if (stats.avgPF >= 0.99) push("pfExcellent", `PF excellent (avg ${stats.avgPF.toFixed(3)}).`, SEVERITY.GOOD);
  else if (stats.avgPF >= 0.95) push("pfAcceptable", `PF acceptable but below optimal (avg ${stats.avgPF.toFixed(3)}).`, SEVERITY.INFO);
  else if (stats.avgPF > 0) push("pfLow", `PF low (avg ${stats.avgPF.toFixed(3)}) — corrective action recommended.`, SEVERITY.CRITICAL);

  // --- Highest current / power callouts ---
  if (stats.maxCurrent) push("highestCurrent", `Inductor ${stats.maxCurrent.label} drawing the highest current (${stats.maxCurrent.value.toFixed(1)} A).`, SEVERITY.INFO);
  if (stats.highestPowerInductor) push("highestPower", `Inductor ${stats.highestPowerInductor.label} consuming the most power (${stats.highestPowerInductor.value.toFixed(1)} kW).`, SEVERITY.INFO);

  // --- Per-inductor overload / underload (relative to the group average) ---
  if (stats.avgCurrent > 0) {
    entries.forEach((e) => {
      if (!e.inductorCurrent) return;
      const ratio = e.inductorCurrent / stats.avgCurrent;
      if (ratio >= OVERLOAD_RATIO) push(`overload:${e.label}`, `Inductor ${e.label} overloaded — running at ${(ratio * 100).toFixed(0)}% of the average current.`, SEVERITY.CRITICAL);
      else if (ratio <= UNDERLOAD_RATIO) push(`underload:${e.label}`, `Inductor ${e.label} underloaded — running at ${(ratio * 100).toFixed(0)}% of the average current.`, SEVERITY.WARNING);
    });
  }

  // --- Impedance ---
  const highImpedance = entries.filter((e) => e.impedanceZ >= IMPEDANCE_HIGH_THRESHOLD);
  highImpedance.forEach((e) => push(`impedance:${e.label}`, `Impedance high on Inductor ${e.label} (${e.impedanceZ.toFixed(2)} Ω) — inspect winding/insulation.`, SEVERITY.WARNING));

  // --- Resistance variation ---
  const resistances = entries.filter((e) => e.resistanceR).map((e) => e.resistanceR);
  if (resistances.length > 1) {
    const avgR = resistances.reduce((a, b) => a + b, 0) / resistances.length;
    const spreadR = Math.max(...resistances) - Math.min(...resistances);
    if (avgR > 0 && spreadR / avgR > RESISTANCE_VARIATION_THRESHOLD) {
      push("resistanceVariation", `Resistance variation observed across inductors (spread ${((spreadR / avgR) * 100).toFixed(0)}% of average) — check for uneven winding wear.`, SEVERITY.WARNING);
    }
  }

  // --- KVAR / conductance ---
  const kvarEntries = entries.filter((e) => e.kvarConnected || e.balancingKvar);
  if (kvarEntries.length) {
    const totalConnected = kvarEntries.reduce((a, e) => a + (e.kvarConnected || 0), 0);
    const totalBalancing = kvarEntries.reduce((a, e) => a + (e.balancingKvar || 0), 0);
    if (totalConnected > 0 && totalBalancing / totalConnected < 0.1) push("kvarSufficient", "Balancing KVAR sufficient relative to connected KVAR.", SEVERITY.GOOD);
    else if (totalConnected > 0) push("kvarWatch", "Balancing KVAR is a notable proportion of connected KVAR — monitor capacitor bank health.", SEVERITY.WARNING);
  }

  const ratioEntries = entries.filter((e) => e.conductanceRatio);
  if (ratioEntries.length) {
    const avgRatio = ratioEntries.reduce((a, e) => a + e.conductanceRatio, 0) / ratioEntries.length;
    if (avgRatio >= 0.9 && avgRatio <= 1.1) push("conductanceNormal", `Conductance ratio within acceptable range (avg ${avgRatio.toFixed(2)}).`, SEVERITY.GOOD);
    else push("conductanceAbnormal", `Conductance abnormal (avg ratio ${avgRatio.toFixed(2)}) — inspect winding/insulation condition.`, SEVERITY.CRITICAL);
  }

  // --- Hard safety-limit flags ---
  entries.forEach((e) => {
    if (e.inductorCurrent >= 500) push(`currentLimit:${e.label}`, `Inductor ${e.label} current above safe limit (${e.inductorCurrent.toFixed(1)} A).`, SEVERITY.CRITICAL);
    if (e.inductorVoltage && (e.inductorVoltage > 450 || e.inductorVoltage < 350)) push(`voltageLimit:${e.label}`, `Inductor ${e.label} voltage out of normal band (${e.inductorVoltage.toFixed(0)} V).`, SEVERITY.CRITICAL);
  });

  return obs;
}

/* ------------------------------ health score ------------------------------- */
function computeHealthScore(stats, observations) {
  let score = 100;

  // PF component
  if (stats.avgPF >= 0.99) score -= 0;
  else if (stats.avgPF >= 0.95) score -= 6;
  else if (stats.avgPF >= 0.9) score -= 14;
  else if (stats.avgPF > 0) score -= 25;

  // Balance components
  score -= Math.max(0, (100 - stats.currentBalancePercent) * 0.4);
  score -= Math.max(0, (100 - stats.voltageBalancePercent) * 0.3);

  // Observation-driven penalties
  observations.forEach((o) => {
    if (o.severity === SEVERITY.CRITICAL) score -= 8;
    else if (o.severity === SEVERITY.WARNING) score -= 3;
  });

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status, statusColor;
  if (score >= 90) { status = "Excellent"; statusColor = "green"; }
  else if (score >= 75) { status = "Good"; statusColor = "cyan"; }
  else if (score >= 60) { status = "Normal"; statusColor = "blue"; }
  else if (score >= 40) { status = "Needs Attention"; statusColor = "orange"; }
  else { status = "Critical"; statusColor = "red"; }

  return { score, status, statusColor };
}

/* ---------------------------- recommendations ------------------------------- */
const RECOMMENDATION_MAP = {
  currentImbalanceCritical: "Investigate phase loading immediately — redistribute load across inductors to correct the severe current imbalance.",
  currentImbalance: "Review phase connections and load distribution to improve current balance.",
  voltageImbalance: "Check transformer taps and supply voltage stability; inspect for loose connections.",
  pfLow: "Inspect power-factor correction capacitors; consider adding or servicing capacitor banks.",
  resistanceVariation: "Schedule a winding insulation check on the inductors showing resistance drift.",
  kvarWatch: "Monitor the capacitor bank — a high balancing-to-connected KVAR ratio can indicate early degradation.",
  conductanceAbnormal: "Inspect winding and insulation condition; conductance ratio outside the normal band can precede failure.",
  powerIncreasing: "Confirm the production schedule matches the rise in power draw; rule out a developing fault if output hasn't changed.",
  powerDecreasing: "Verify this drop aligns with reduced production; if not, check for a supply or control issue.",
};

function generateRecommendations(observations) {
  const recs = new Set();
  observations.forEach((o) => {
    const baseId = o.id.split(":")[0];
    if (RECOMMENDATION_MAP[baseId]) recs.add(RECOMMENDATION_MAP[baseId]);
    if (baseId === "overload") recs.add(`Redistribute load away from the overloaded inductor(s), or inspect for coil damage: ${o.message.match(/Inductor (\S+)/)?.[1] || ""}`);
    if (baseId === "impedance") recs.add("High impedance readings can indicate winding or insulation degradation — schedule an inspection.");
    if (baseId === "currentLimit" || baseId === "voltageLimit") recs.add("A safety limit was exceeded — action this reading before the next shift.");
  });
  if (recs.size === 0) recs.add("No corrective action needed — all parameters within normal industrial operating range.");
  return Array.from(recs);
}

/* --------------------------------- engine ----------------------------------- */
/**
 * Single entry point: runs the full Industrial Analysis Engine over one
 * report's flattened entries, optionally comparing against a previous
 * period's stats for power trend detection.
 */
function runAnalysisEngine(entries, previousStats) {
  const stats = computeStats(entries);
  const observations = generateObservations(entries, stats, previousStats);
  const { score, status, statusColor } = computeHealthScore(stats, observations);
  const recommendations = generateRecommendations(observations);
  return { stats, observations, healthScore: score, equipmentStatus: status, statusColor, recommendations };
}

module.exports = {
  computeStats, generateObservations, computeHealthScore, generateRecommendations, runAnalysisEngine, SEVERITY,
};
