import { latestInductorReadings } from './inductorTelemetry.js';
export const PARAMETERS = [
  { key: 'inductorVoltage', label: 'Voltage', unit: 'V' },
  { key: 'inductorCurrent', label: 'Current', unit: 'A' },
  { key: 'inductorPF', label: 'Power factor', unit: '' },
  { key: 'conductanceRatio', label: 'Conductance', unit: '%' },
];
export function reading(record, key, parameter) {
  if (!record) return null;
  if (parameter !== 'inductorPF') return latestInductorReadings([record], key)[0]?.[parameter] ?? null;
  const [pot, letter] = key.split('_');
  const item = record[pot === 'PM' ? 'pmPot' : 'mainPot']?.[letter];
  const value = (item?.high || item)?.inductorPF;
  if (value == null || String(value).trim() === '') return null;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}
export function change(a, b) {
  if (a === null || b === null) return { delta: null, percent: null };
  return { delta: b - a, percent: a === 0 ? null : (b - a) / Math.abs(a) * 100 };
}
export function referenceStatus(value, key, parameter) {
  if (value === null) return 'No Data';
  const limit = { inductorVoltage: key.startsWith('PM') ? 600 : 570, inductorPF: .9, conductanceRatio: 70 }[parameter];
  return limit === undefined ? 'Informational' : value >= limit ? 'Meets reference' : 'Below reference';
}
export const formatValue = (value) => value === null ? 'No Data' : value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
