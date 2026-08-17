/**
 * ============================================================================
 * INDUSTRIAL ANALYSIS ENGINE (CUSTOM 5-POINT LOGIC)
 * ============================================================================
 * 1. Current Difference (R-Y / Spread): <= 80 A (Green) | > 80 A (Red)
 * 2. Power Factor: >= 0.90 (Green) | < 0.90 (Red)
 * 3. Inductor Voltage (PM Pot): >= 600 V (Green) | < 600 V (Red)
 * 4. Inductor Voltage (Main Pot): >= 570 V (Green) | < 570 V (Red)
 * 5. Conductance Ratio: >= 70 (Green) | < 70 (Red)
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

  const currentSpread =
    maxCurrentEntry && minCurrentEntry
      ? Number((maxCurrentEntry.inductorCurrent - minCurrentEntry.inductorCurrent).toFixed(2))
      : 0;

  return {
    avgCurrent,
    avgVoltage,
    avgPower,
    avgPF,
    totalPower,
    currentSpread,
    maxCurrent: maxCurrentEntry ? { value: maxCurrentEntry.inductorCurrent, label: maxCurrentEntry.label } : null,
    minCurrent: minCurrentEntry ? { value: minCurrentEntry.inductorCurrent, label: minCurrentEntry.label } : null,
  };
}

/* ----------------------------- observations -------------------------------- */
function generateObservations(entries, stats) {
  const obs = [];
  const push = (id, message, severity) => obs.push({ id, message, severity });

  // 1. Current R-Y Difference / Spread (Limit: <= 80 A)
  if (stats.currentSpread > 80) {
    push(
      "currentSpreadCritical",
      `Current difference is high (<b>${stats.currentSpread} A</b>) — limit exceeds 80 A.`,
      SEVERITY.CRITICAL
    );
  } else {
    push(
      "currentSpreadNormal",
      `Current difference is balanced (<b>${stats.currentSpread} A</b> <= 80 A).`,
      SEVERITY.GOOD
    );
  }

  // 2. Power Factor (Limit: >= 0.90)
  if (stats.avgPF > 0) {
    if (stats.avgPF < 0.90) {
      push(
        "pfLow",
        `Power Factor is low (avg <b>${stats.avgPF.toFixed(3)}</b>) — minimum threshold is 0.90.`,
        SEVERITY.CRITICAL
      );
    } else {
      push(
        "pfNormal",
        `Power Factor is optimal (avg <b>${stats.avgPF.toFixed(3)}</b> >= 0.90).`,
        SEVERITY.GOOD
      );
    }
  }

  // 3 & 4. Inductor Voltage Check (PM Pot >= 600V, Main Pot >= 570V)
  entries.forEach((e) => {
    if (!e.inductorVoltage) return;
    const label = (e.label || "").toUpperCase();
    const isPmPot = label.includes("PM") || (e.potType && e.potType.toUpperCase().includes("PM"));

    if (isPmPot) {
      if (e.inductorVoltage < 600) {
        push(
          `pmVoltageLow:${e.label || "PM"}`,
          `PM Pot Inductor <b>${e.label || ""}</b> Voltage is low (<b>${e.inductorVoltage.toFixed(0)} V</b> < 600 V).`,
          SEVERITY.CRITICAL
        );
      } else {
        push(
          `pmVoltageNormal:${e.label || "PM"}`,
          `PM Pot Inductor <b>${e.label || ""}</b> Voltage is healthy (<b>${e.inductorVoltage.toFixed(0)} V</b> >= 600 V).`,
          SEVERITY.GOOD
        );
      }
    } else {
      if (e.inductorVoltage < 570) {
        push(
          `mainVoltageLow:${e.label || "MAIN"}`,
          `Main Pot Inductor <b>${e.label || ""}</b> Voltage is low (<b>${e.inductorVoltage.toFixed(0)} V</b> < 570 V).`,
          SEVERITY.CRITICAL
        );
      } else {
        push(
          `mainVoltageNormal:${e.label || "MAIN"}`,
          `Main Pot Inductor <b>${e.label || ""}</b> Voltage is healthy (<b>${e.inductorVoltage.toFixed(0)} V</b> >= 570 V).`,
          SEVERITY.GOOD
        );
      }
    }
  });

  // 5. Conductance Ratio Check (Limit: >= 70)
  entries.forEach((e) => {
    let crVal = e.conductanceRatio ?? e.conductanceRatioPercent ?? e.condRatio ?? e.cr;
    if (crVal !== undefined && crVal !== null) {
      let numCR = parseFloat(crVal);
      // Agar value ratio format (0.75) me ho to percentage (75) me convert karein
      if (numCR > 0 && numCR <= 1.5) numCR = numCR * 100;

      if (numCR < 70) {
        push(
          `conductanceLow:${e.label || "IND"}`,
          `Inductor <b>${e.label || ""}</b> Conductance Ratio is low (<b>${numCR.toFixed(1)}%</b> < 70%).`,
          SEVERITY.CRITICAL
        );
      } else {
        push(
          `conductanceNormal:${e.label || "IND"}`,
          `Inductor <b>${e.label || ""}</b> Conductance Ratio is healthy (<b>${numCR.toFixed(1)}%</b> >= 70%).`,
          SEVERITY.GOOD
        );
      }
    }
  });

  return obs;
}

/* ------------------------------ health score ------------------------------- */
function computeHealthScore(stats, observations) {
  let score = 100;

  observations.forEach((o) => {
    if (o.severity === SEVERITY.CRITICAL) score -= 20;
  });

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status, statusColor;
  if (score >= 90) { status = "Excellent"; statusColor = "green"; }
  else if (score >= 70) { status = "Good"; statusColor = "cyan"; }
  else if (score >= 50) { status = "Needs Attention"; statusColor = "orange"; }
  else { status = "Critical"; statusColor = "red"; }

  return { score, status, statusColor };
}

/* ---------------------------- recommendations ------------------------------- */
function generateRecommendations(observations) {
  const recs = new Set();

  observations.forEach((o) => {
    if (o.id.startsWith("currentSpreadCritical")) {
      recs.add("Balance load across phases/inductors immediately to bring current difference <= 80 A.");
    }
    if (o.id.startsWith("pfLow")) {
      recs.add("Inspect capacitor bank and power-factor correction system to restore PF >= 0.90.");
    }
    if (o.id.startsWith("pmVoltageLow")) {
      recs.add("Check PM Pot input supply voltage and transformer tap settings (minimum 600 V required).");
    }
    if (o.id.startsWith("mainVoltageLow")) {
      recs.add("Check Main Pot supply lines and tap settings (minimum 570 V required).");
    }
    if (o.id.startsWith("conductanceLow")) {
      recs.add("Conductance ratio is below 70% — schedule coil insulation and winding inspection.");
    }
  });

  if (recs.size === 0) {
    recs.add("All 5 operational parameters are healthy and within industrial limits.");
  }

  return Array.from(recs);
}

/* --------------------------------- engine ----------------------------------- */
function runAnalysisEngine(entries, previousStats) {
  const stats = computeStats(entries);
  const observations = generateObservations(entries, stats);
  const { score, status, statusColor } = computeHealthScore(stats, observations);
  const recommendations = generateRecommendations(observations);
  return { stats, observations, healthScore: score, equipmentStatus: status, statusColor, recommendations };
}

module.exports = {
  computeStats,
  generateObservations,
  computeHealthScore,
  generateRecommendations,
  runAnalysisEngine,
  SEVERITY,
};