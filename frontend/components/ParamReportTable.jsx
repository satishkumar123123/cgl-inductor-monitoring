import React from "react";
import { ROWS } from "../utils/rowsConfig.js";
import { cellTone, toneClasses } from "../utils/conditionalFormat.js";

/**
 * Read-only, print-friendly table: rows = the 17 parameters, columns = each
 * flattened inductor+level entry (e.g. "PM-A (High)", "B (Intermediate)").
 * Used by both the PM Pot and Main Pot analysis reports.
 */
export default function ParamReportTable({ entries }) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse w-full min-w-[560px] text-[11.5px]">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 text-slate-400 border-b border-slate-700 min-w-[190px]">Parameter</th>
            {entries.map((e) => (
              <th key={e.label} className="px-2.5 py-2 text-center border-b border-l border-slate-700 text-blue-400 font-bold whitespace-nowrap">
                {e.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr key={row.id} className={i % 2 ? "bg-white/[0.02]" : ""}>
              <td className="px-3 py-1.5 text-slate-300 whitespace-nowrap">
                {row.label} {row.unit && <span className="text-slate-500">({row.unit})</span>}
              </td>
              {entries.map((e) => {
                const val = e[row.id];
                const tone = cellTone(row.type, val);
                return (
                  <td key={e.label + row.id} className={`px-2.5 py-1.5 text-center border-l border-slate-800 tabular-nums ${tone ? toneClasses[tone] : "text-slate-200"}`}>
                    {val || val === 0 ? Number(val).toFixed(2) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
