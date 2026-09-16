import React, { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlyProductionTrends } from '../utils/productionTrends.js';

const metrics = [
  { key: 'production', title: 'Production', unit: 'MT', color: '#2563eb' },
  { key: 'metal', title: 'Metal Charged', unit: 'MT', color: '#7c3aed' },
  { key: 'dross', title: 'Total Dross', unit: 'MT', color: '#ea580c' },
  { key: 'drossPercent', title: 'Dross Percentage', unit: '%', color: '#e11d48' },
  { key: 'drossKgMT', title: 'Dross per Production', unit: 'kg/MT', color: '#059669' },
];
export default function ProductionMonthlyCharts({ history, selectedMonth }) {
  const [months, setMonths] = useState(6);
  const [mode, setMode] = useState('both');
  const data = useMemo(() => monthlyProductionTrends(history, selectedMonth, months), [history, selectedMonth, months]);
  const types = mode === 'both' ? ['bar', 'line'] : [mode];
  const hasData = data.some((row) => metrics.some((metric) => row[metric.key] !== null));
  return <section className="rounded-3xl border border-indigo-200 bg-slate-50 p-4 sm:p-6 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-lg font-black text-indigo-900">Monthly Production &amp; Dross Trends</h2><p className="text-xs text-slate-600 mt-1">{months} calendar months ending {selectedMonth}. Change the entry month above to move this period.</p></div>
      <div className="flex flex-wrap gap-3">
        <label className="text-xs font-bold text-indigo-900">Period <select aria-label="Chart period" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="ml-2 p-2 rounded-lg border border-indigo-200 bg-white"><option value={6}>6 months</option><option value={12}>12 months</option></select></label>
        <label className="text-xs font-bold text-indigo-900">View <select aria-label="Chart view" value={mode} onChange={(e) => setMode(e.target.value)} className="ml-2 p-2 rounded-lg border border-indigo-200 bg-white"><option value="both">Bar + Line</option><option value="bar">Bar charts</option><option value="line">Line charts</option></select></label>
      </div>
    </div>
    <p className="text-xs text-slate-500">Missing months stay blank. Dross % = dross / metal charged × 100; kg/MT = dross × 1,000 / production. Ratios with zero or missing denominators show N/A.</p>
    {!hasData ? <p className="bg-white rounded-xl p-8 text-center text-slate-500">No monthly readings saved in this period. Select another entry month or save monthly data.</p> : metrics.map((metric) => <div key={metric.key} className="space-y-3">
      <h3 className="font-extrabold text-sm" style={{ color: metric.color }}>{metric.title} ({metric.unit})</h3>
      <div className={`grid gap-4 ${mode === 'both' ? 'lg:grid-cols-2' : ''}`}>
        {types.map((type) => {
          const Chart = type === 'bar' ? BarChart : LineChart;
          return <div key={type} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-600 mb-3">{type === 'bar' ? 'Monthly comparison' : 'Monthly trend'}</p>
            {!data.some((r) => r[metric.key] !== null) ? <p className="h-64 flex items-center justify-center text-sm text-slate-500">No valid values available for this parameter.</p> : <div className="overflow-x-auto" tabIndex={0} aria-label={`${metric.title} ${type} chart`}>
              <div style={{ height: 270, minWidth: months === 12 ? 560 : 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <Chart data={data} margin={{ top: 16, right: 15, left: 8, bottom: 12 }} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="label" interval={0} tick={{ fontSize: 10, fill: '#475569' }} />
                    <YAxis width={65} tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(v) => Math.abs(v) >= 10000 ? `${(v / 1000).toFixed(1)}k` : v} />
                    <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.month || ''} formatter={(value) => [`${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${metric.unit}`, metric.title]} contentStyle={{ borderRadius: 12, color: '#0f172a' }} />
                    {type === 'bar' ? <Bar dataKey={metric.key} fill={metric.color} radius={[5, 5, 0, 0]} maxBarSize={42} /> : <Line type="linear" dataKey={metric.key} stroke={metric.color} strokeWidth={3} dot={{ r: 4, fill: metric.color }} activeDot={{ r: 6 }} connectNulls={false} />}
                  </Chart>
                </ResponsiveContainer>
              </div>
            </div>}
          </div>;
        })}
      </div>
    </div>)}
  </section>;
}
