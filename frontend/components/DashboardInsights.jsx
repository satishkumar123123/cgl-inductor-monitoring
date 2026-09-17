import '../styles/dashboardInsights.css';
import React, { useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { INDUCTORS, latestInductorReadings } from '../utils/inductorTelemetry.js';
import { PARAMETERS, reading, change, referenceStatus, formatValue as fmt } from '../utils/dashboardInsights.js';

const chartColors = { MAIN_A: '#4d7c0f', MAIN_B: '#dc2626', MAIN_C: '#2563eb', MAIN_D: '#b45309', PM_A: '#059669', PM_B: '#9333ea' };
const wordColors = ['#4338ca', '#be185d', '#0369a1', '#047857', '#92400e', '#7e22ce'];
function ColourWords({ children }) {
  return String(children).split(' ').map((word, index) => <React.Fragment key={index}><span style={{ color: wordColors[index % wordColors.length] }}>{word}</span>{' '}</React.Fragment>);
}

export function InductorMiniTrend({ history, inductorKey, selectedDate }) {
  const color = chartColors[inductorKey] || '#4338ca';
  const data = useMemo(() => latestInductorReadings(history.records.filter(r => r.date <= selectedDate), inductorKey).slice(-10), [history.records, inductorKey, selectedDate]);
  return <div style={{ borderTop: `3px solid ${color}` }} className="mt-3 bg-white rounded-xl p-2 text-slate-700">
    <p style={{ color }} className="text-[10px] font-bold">CONDUCTANCE · LAST {data.length || 10} READINGS</p>
    {history.status !== 'ready' ? <p className="text-xs py-4">{history.status === 'error' ? 'History unavailable' : 'Loading trends…'}</p> : !data.some(r => r.conductanceRatio !== null) ? <p className="text-xs py-4">No Data</p> : <>
      <div style={{ height: 65 }} aria-label="Saved high-tap conductance trend">
        <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, bottom: 8, left: 5, right: 5 }}><XAxis dataKey="date" hide/><YAxis hide domain={['auto', 'auto']}/><Tooltip formatter={v => [`${fmt(v)} %`, 'Conductance']} contentStyle={{ fontSize: 11 }}/><Line type="linear" dataKey="conductanceRatio" stroke={color} strokeWidth={2.5} dot={{ r: 2, fill: color, stroke: color }} connectNulls={false} isAnimationActive={false}/></LineChart></ResponsiveContainer>
      </div><p className="text-[9px] text-slate-500">{data[0]?.date} → {data.at(-1)?.date}</p>
    </>}
    <p className="text-[9px] text-slate-500 mt-1">Saved high-tap readings only</p>
  </div>;
}
const tones = { 'No Data': 'bg-slate-100 text-slate-500', Informational: 'bg-sky-100 text-sky-900', 'Meets reference': 'bg-emerald-100 text-emerald-900', 'Below reference': 'bg-amber-100 text-amber-900' };
export default function DashboardInsights({ history, selectedDate, comparisonOnly = false }) {
  const [chosenA, setA] = useState('');
  const [chosenB, setB] = useState('');
  const [parameter, setParameter] = useState('conductanceRatio');
  const dates = useMemo(() => [...new Set(history.records.map(r => r.date))].sort(), [history.records]);
  const dateB = chosenB || selectedDate;
  const dateA = chosenA || dates.filter(d => d < dateB).at(-1) || '';
  const byDate = useMemo(() => new Map(history.records.map(r => [r.date, r])), [history.records]);
  const metric = PARAMETERS.find(m => m.key === parameter);
  return <section className={`${comparisonOnly ? 'dashboard-comparison' : ''} rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 sm:p-6 space-y-6 shadow-sm`}>
    <div className="flex flex-wrap justify-between items-center gap-3"><div><h2 className="text-xl font-black text-indigo-950"><ColourWords>{comparisonOnly ? 'Two Date Comparison' : 'Dashboard Insights'}</ColourWords></h2><p className="text-xs text-slate-600 mt-1"><ColourWords>Saved high-tap readings • Unsaved edits are excluded</ColourWords></p></div><button type="button" onClick={history.refresh} disabled={history.status === 'loading'} className="rounded-xl bg-indigo-700 px-4 py-2 text-white text-sm font-bold disabled:opacity-50">Refresh insights</button></div>
    {history.status !== 'ready' ? <p role={history.status === 'error' ? 'alert' : 'status'} className="p-5 bg-white rounded-xl">{history.status === 'error' ? 'Could not load saved readings. Please refresh insights.' : 'Loading saved readings…'}</p> : <>
      {!comparisonOnly && <div className="bg-white border border-indigo-100 rounded-2xl p-4">
        <h3 className="font-extrabold text-indigo-900">Parameter Heatmap · {selectedDate}</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Green: meets reference • Amber: below reference • Blue: informational • Grey: no data</p>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th className="p-3">Inductor</th>{PARAMETERS.map(m => <th key={m.key} className="p-3 whitespace-nowrap">{m.label} {m.unit && `(${m.unit})`}</th>)}</tr></thead><tbody>{INDUCTORS.map(i => <tr key={i.key}><th className="p-3 whitespace-nowrap text-slate-700">{i.title}</th>{PARAMETERS.map(m => { const value = reading(byDate.get(selectedDate), i.key, m.key); const status = referenceStatus(value, i.key, m.key); return <td key={m.key} className="p-1"><div className={`rounded-xl p-3 min-w-[115px] ${tones[status]}`}><span className="font-extrabold">{fmt(value)}</span><span className="block text-[10px] mt-1">{status}</span></div></td>; })}</tr>)}</tbody></table></div>
        <p className="text-xs text-slate-500 mt-4">Existing report references, not plant-approved operating limits: Main voltage ≥570 V; PM ≥600 V; PF ≥0.90; conductance ≥70%. Current has no configured limit. PF reference is applied per inductor here; reports use an average.</p>
      </div>}
      {comparisonOnly && <div className="comparison-panel bg-white border border-purple-100 rounded-2xl p-4">
        <h3 className="font-extrabold text-purple-900"><ColourWords>Compare Readings Across Two Dates</ColourWords></h3>
        <div className="flex flex-wrap gap-4 my-4">{[['Baseline date', dateA, setA], ['Comparison date', dateB, setB]].map(([label, value, setter]) => <label key={label} className="text-xs font-bold text-slate-600"><ColourWords>{label}</ColourWords><input type="date" value={value} onChange={e => setter(e.target.value)} className="block mt-1 rounded-lg border border-purple-200 p-2 bg-white"/></label>)}<label className="text-xs font-bold text-slate-600"><ColourWords>Choose Parameter</ColourWords><select value={parameter} onChange={e => setParameter(e.target.value)} className="block mt-1 rounded-lg border border-purple-200 p-2 bg-white">{PARAMETERS.map(m => <option key={m.key} value={m.key}>{m.label}{m.unit ? ` (${m.unit})` : ''}</option>)}</select></label></div>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-purple-50 text-purple-900"><tr>{['Inductor', dateA || 'Choose baseline', dateB, `Change (${metric.unit || 'PF'})`, 'Change (%)'].map((h, index) => <th key={index} className="p-3 whitespace-nowrap"><ColourWords>{h}</ColourWords></th>)}</tr></thead><tbody>{INDUCTORS.map(i => { const a = reading(byDate.get(dateA), i.key, parameter), b = reading(byDate.get(dateB), i.key, parameter), diff = change(a, b); return <tr key={i.key} className="border-t border-slate-100"><th className="p-3 whitespace-nowrap"><ColourWords>{i.title}</ColourWords></th><td className="p-3">{fmt(a)}</td><td className="p-3">{fmt(b)}</td><td className="p-3 font-bold text-indigo-700">{diff.delta > 0 ? '+' : ''}{fmt(diff.delta)}</td><td className="p-3">{diff.percent === null ? 'N/A' : `${diff.percent > 0 ? '+' : ''}${fmt(diff.percent)}%`}</td></tr>; })}</tbody></table></div>
        <p className="text-xs text-slate-500 mt-3"><ColourWords>Change = comparison − baseline. Percentage is unavailable for missing readings or a zero baseline. Increase/decrease does not indicate equipment health.</ColourWords></p>
      </div>}
    </>}
  </section>;
}
