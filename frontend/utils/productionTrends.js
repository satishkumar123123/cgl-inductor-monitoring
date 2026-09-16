const number = (value) => value === null || value === undefined || String(value).trim() === '' || !Number.isFinite(Number(value)) ? null : Number(value);
export function monthlyProductionTrends(history, endMonth, count) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(endMonth)) return [];
  const [year, month] = endMonth.split('-').map(Number);
  const byMonth = new Map(history.map((row) => [row.monthYear, row]));
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(Date.UTC(year, month - count + index, 1));
    const key = d.toISOString().slice(0, 7), row = byMonth.get(key);
    const production = number(row?.productionMT), metal = number(row?.metalChargedMT), dross = number(row?.totalDrossMT);
    return { month: key, label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' }), production, metal, dross,
      drossPercent: metal > 0 && dross !== null ? dross / metal * 100 : null,
      drossKgMT: production > 0 && dross !== null ? dross * 1000 / production : null };
  });
}
