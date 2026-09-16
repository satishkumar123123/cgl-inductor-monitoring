export const INDUCTORS = [
  { key: 'MAIN_A', title: 'Main Pot · Inductor A', color: '#6B8E23' },
  { key: 'MAIN_B', title: 'Main Pot · Inductor B', color: '#E2725B' },
  { key: 'MAIN_C', title: 'Main Pot · Inductor C', color: '#1E315A' },
  { key: 'MAIN_D', title: 'Main Pot · Inductor D', color: '#a16207' },
  { key: 'PM_A', title: 'PM Pot · Inductor A', color: '#168653' },
  { key: 'PM_B', title: 'PM Pot · Inductor B', color: '#B5651D' },
];

export const METRICS = [
  { key: 'conductanceRatio', label: 'Conductance Ratio', unit: '%', color: '#7c3aed' },
  { key: 'inductorCurrent', label: 'Inductor Current', unit: 'A', color: '#0284c7' },
  { key: 'inductorVoltage', label: 'Inductor Voltage', unit: 'V', color: '#059669' },
  { key: 'rPhase', label: 'R Phase Current', unit: 'A', color: '#e11d48' },
  { key: 'yPhase', label: 'Y Phase Current', unit: 'A', color: '#ca8a04' },
  { key: 'bPhase', label: 'B Phase Current', unit: 'A', color: '#2563eb' },
  { key: 'power', label: 'Power', unit: 'kW', color: '#ea580c' },
];

const aliases = {
  conductanceRatio: ['conductanceRatio', 'condRatio', 'conductance_ratio', 'conductanceCurrentRatio'],
  inductorCurrent: ['inductorCurrent', 'indCurrent', 'current'],
  inductorVoltage: ['inductorVoltage', 'indVoltage', 'voltage'],
  rPhase: ['rPhase', 'rCurrent', 'r_phase', 'rPhaseCurrent'],
  yPhase: ['yPhase', 'yCurrent', 'y_phase', 'yPhaseCurrent'],
  bPhase: ['bPhase', 'bCurrent', 'b_phase', 'bPhaseCurrent'],
  power: ['power'],
};

function numeric(source, names) {
  for (const name of names) {
    const value = source[name];
    if (value === null || value === undefined || String(value).trim() === '') continue;
    const n = Number(String(value).replace(/,/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

// The last 20 saved dates containing readings for this inductor, oldest first.
// Keep missing values null: an absent measurement is not a zero reading.
export function latestInductorReadings(records, key, level = 'high') {
  if (!INDUCTORS.some((item) => item.key === key)) return [];
  const [pot, letter] = key.split('_');
  const potKey = pot === 'PM' ? 'pmPot' : 'mainPot';
  const dates = new Set();
  return [...records].sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .flatMap((record) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date || '') || dates.has(record.date)) return [];
      const inductor = record[potKey]?.[letter];
      const values = inductor?.[level] || (level === 'high' ? inductor : null) || {};
      const point = { date: record.date };
      for (const metric of METRICS) point[metric.key] = numeric(values, aliases[metric.key]);
      if (METRICS.every(({ key }) => point[key] === null)) return [];
      if (point.conductanceRatio > 0 && point.conductanceRatio <= 1.5) point.conductanceRatio *= 100;
      dates.add(record.date);
      return [point];
    }).slice(0, 20).reverse();
}
