const XLSX = require("xlsx");

/**
 * Row definitions with fuzzy match keyword groups: AND across groups,
 * OR within a group. Extra tokens in the source label (units, brackets,
 * casing, spacing) are ignored, which is what lets an Excel sheet from the
 * plant floor map onto these fields without manual configuration.
 */
const ROW_DEFS = [
  { id: "rPhase", label: "R Phase Current", match: [["R"], ["PHASE"], ["CURRENT"]] },
  { id: "yPhase", label: "Y Phase Current", match: [["Y"], ["PHASE"], ["CURRENT"]] },
  { id: "bPhase", label: "B Phase Current", match: [["B"], ["PHASE"], ["CURRENT"]] },
  { id: "inductorVoltage", label: "Inductor Voltage", match: [["VOLTAGE"]] },
  { id: "lineCurrent", label: "Line Load Current", match: [["LINE", "LOAD"], ["CURRENT"]] },
  { id: "linePF", label: "Line PF", match: [["LINE", "LOAD"], ["PF"]] },
  { id: "power", label: "Power", match: [["POWER"]] },
  { id: "inductorCurrent", label: "Inductor Current", match: [["INDUCTOR"], ["CURRENT"]] },
  { id: "impedanceZ", label: "Impedance", match: [["IMPEDANCE"]] },
  { id: "resistanceR", label: "Resistance", match: [["RESISTANCE"]] },
  { id: "reactanceX", label: "Reactance", match: [["REACTANCE"]] },
  { id: "inductorPF", label: "Inductor PF", match: [["INDUCTOR"], ["PF"]] },
  { id: "inductorKVA", label: "Inductor KVA", match: [["INDUCTOR"], ["KVA"]] },
  { id: "conductanceInitial", label: "Conductance Initial Value", match: [["CONDUCTANCE"], ["INITIAL"]] },
  { id: "conductanceRatio", label: "Conductance Current Ratio", match: [["CONDUCTANCE"], ["RATIO"]] },
  { id: "kvarConnected", label: "KVAR Connected", match: [["KVAR"], ["CONNECTED"]] },
  { id: "balancingKvar", label: "Balancing KVAR", match: [["BALANCING"], ["KVAR"]] },
];

const POTS = { mainPot: ["A", "B", "C", "D"], pmPot: ["A", "B"] };

function normalizeTokens(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[()[\]{}]/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function matchRowId(label) {
  const tokens = new Set(normalizeTokens(label));
  let best = null;
  let bestScore = 0;
  for (const row of ROW_DEFS) {
    const ok = row.match.every((group) => group.some((tok) => tokens.has(tok)));
    if (ok && row.match.length > bestScore) {
      bestScore = row.match.length;
      best = row.id;
    }
  }
  return best;
}

function parseColumnHeader(header) {
  const tokens = normalizeTokens(header);
  const inductor = tokens.find((t) => /^[A-D]$/.test(t));
  const level = tokens.some((t) => t.startsWith("INT")) ? "intermediate" : tokens.includes("HIGH") ? "high" : null;
  return { inductor, level };
}

function classifySheetName(name) {
  const n = name.toUpperCase();
  if (n.includes("PM")) return "pmPot";
  if (n.includes("MAIN")) return "mainPot";
  return null;
}

function emptyPot(inductors) {
  const out = {};
  inductors.forEach((i) => (out[i] = { high: {}, intermediate: {} }));
  return out;
}

/**
 * Parses a workbook buffer into { mainPot, pmPot, rowsImported, unmatched, errors }.
 * `unmatched` lists row labels found in the sheet that didn't map to any known
 * parameter. `errors` lists cells that contained non-numeric text (left blank).
 */
function parseWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const potUpdates = {};
  const unmatched = [];
  const errors = [];
  let rowsImported = 0;

  wb.SheetNames.forEach((sheetName) => {
    let potKey = classifySheetName(sheetName);
    if (!potKey) potKey = Object.keys(potUpdates).length === 0 ? "mainPot" : "pmPot";

    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "" });
    if (!rows.length) return;

    const cols = rows[0].slice(1).map(parseColumnHeader);
    const potData = emptyPot(POTS[potKey]);

    for (let r = 1; r < rows.length; r++) {
      const label = rows[r][0];
      if (!label || !String(label).trim()) continue;
      const rowId = matchRowId(label);
      if (!rowId) {
        unmatched.push(String(label));
        continue;
      }
      let rowHadValue = false;
      cols.forEach((col, ci) => {
        if (!col.inductor || !col.level || !POTS[potKey].includes(col.inductor)) return;
        const raw = rows[r][ci + 1];
        if (raw === "" || raw === undefined || raw === null) return;
        const num = parseFloat(String(raw).replace(/,/g, ""));
        if (isNaN(num)) {
          errors.push(`${sheetName} · Inductor ${col.inductor} (${col.level}) · ${label} = "${raw}"`);
        } else {
          potData[col.inductor][col.level][rowId] = num;
          rowHadValue = true;
        }
      });
      if (rowHadValue) rowsImported++;
    }
    potUpdates[potKey] = potData;
  });

  return { potUpdates, rowsImported, unmatched, errors };
}

module.exports = { parseWorkbook, ROW_DEFS, POTS, matchRowId, parseColumnHeader };
