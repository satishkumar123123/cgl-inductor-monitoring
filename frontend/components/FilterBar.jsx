import React from "react";
import { CalendarRange, CalendarDays, Calendar, Filter } from "lucide-react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Generic Date Range / Month / Year / Shift filter bar, reusable across any
 * page that needs to slice time-series data the same way (Analytics
 * Dashboard, and any future trend page).
 *
 * `value`: { mode: "range" | "month" | "year", from, to, month, year, shift }
 * `onChange(partial)` merges partial updates into the parent's filter state.
 * `onApply()` is called when the Apply button is pressed.
 */
export default function FilterBar({ value, onChange, onApply }) {
  const { mode, from, to, month, year, shift } = value;

  const modeBtn = (key, label, Icon) => (
    <button
      onClick={() => onChange({ mode: key })}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        mode === key ? "bg-cyan-400 text-slate-950" : "border border-slate-700 text-slate-300 hover:bg-slate-800"
      }`}
    >
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <div className="no-print flex flex-wrap items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
      <Filter size={14} className="text-slate-500" />

      <div className="flex items-center gap-1.5">
        {modeBtn("range", "Date Range", CalendarRange)}
        {modeBtn("month", "Month", CalendarDays)}
        {modeBtn("year", "Year", Calendar)}
      </div>

      {mode === "range" && (
        <>
          <input type="date" value={from || ""} onChange={(e) => onChange({ from: e.target.value })} className="select-input" />
          <span className="text-slate-500 text-xs">to</span>
          <input type="date" value={to || ""} onChange={(e) => onChange({ to: e.target.value })} className="select-input" />
        </>
      )}

      {mode === "month" && (
        <>
          <select value={month} onChange={(e) => onChange({ month: Number(e.target.value) })} className="select-input">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={(e) => onChange({ year: Number(e.target.value) })} className="select-input w-24" />
        </>
      )}

      {mode === "year" && (
        <input type="number" value={year} onChange={(e) => onChange({ year: Number(e.target.value) })} className="select-input w-28" />
      )}

      <select value={shift || ""} onChange={(e) => onChange({ shift: e.target.value })} className="select-input">
        <option value="">All Shifts</option>
        <option value="A">Shift A</option>
        <option value="B">Shift B</option>
        <option value="C">Shift C</option>
      </select>

      <button onClick={onApply} className="toolbar-btn-primary">Apply</button>
    </div>
  );
}
