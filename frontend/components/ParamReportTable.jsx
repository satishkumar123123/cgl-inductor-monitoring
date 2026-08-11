import React from "react";
import { ROWS } from "../utils/rowsConfig.js";
import { cellTone, toneClasses } from "../utils/conditionalFormat.js";

// White background report page ke liye high-contrast, bold aur vivid colors map
const PARAM_TEXT_COLORS = {
  rPhase: "text-red-700 font-bold",
  yPhase: "text-amber-700 font-bold",
  bPhase: "text-blue-700 font-bold",
  inductorVoltage: "text-cyan-800 font-bold",
  lineCurrent: "text-emerald-700 font-bold",
  linePF: "text-teal-800 font-bold",
  power: "text-orange-700 font-bold",
  inductorCurrent: "text-indigo-800 font-bold",
  impedanceZ: "text-purple-800 font-bold",
  resistanceR: "text-pink-800 font-bold",
  reactanceX: "text-fuchsia-800 font-bold",
  inductorPF: "text-sky-800 font-bold",
  inductorKVA: "text-violet-800 font-bold",
  conductanceInitial: "text-lime-800 font-bold",
  conductanceRatio: "text-amber-800 font-bold",
};

/**
 * Read-only, print-friendly table: rows = the 17 parameters, columns = each
 * flattened inductor+level entry (e.g. "PM-A (High)", "B (Intermediate)").
 * Used by both the PM Pot and Main Pot analysis reports.
 */
export default function ParamReportTable({ entries }) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl">
      <table className="border-collapse w-full min-w-[560px] text-xs font-bold">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-slate-300">
            <th className="text-left px-3.5 py-2.5 text-slate-900 font-black border-r border-slate-300 min-w-[190px] uppercase tracking-wider">
              Parameter
            </th>
            {entries.map((e) => (
              <th 
                key={e.label} 
                className="px-3 py-2.5 text-center border-r border-slate-300 text-cyan-900 font-black text-xs whitespace-nowrap uppercase tracking-wider"
              >
                {e.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {ROWS.map((row, i) => {
            // पैरामीटर आईडी के हिसाब से कस्टम बोल्ड कलर चुनें
            const customTextColor = PARAM_TEXT_COLORS[row.id] || "text-slate-900 font-bold";

            return (
              <tr key={row.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                <td className={`px-3.5 py-2 whitespace-nowrap border-r border-slate-300 ${customTextColor}`}>
                  {row.label} {row.unit && <span className="text-slate-600 font-medium">({row.unit})</span>}
                </td>
                {entries.map((e) => {
                  const val = e[row.id];
                  const tone = cellTone(row.type, val);
                  return (
                    <td 
                      key={e.label + row.id} 
                      className={`px-3 py-2 text-center border-r border-slate-300 tabular-nums font-black text-xs ${tone ? toneClasses[tone] : customTextColor}`}
                    >
                      {val || val === 0 ? Number(val).toFixed(2) : "—"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}