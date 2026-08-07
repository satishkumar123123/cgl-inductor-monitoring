import React from "react";
import { ROWS } from "../utils/rowsConfig.js";
import { cellTone, toneClasses } from "../utils/conditionalFormat.js";

// R Phase Current से Conductance Ratio तक के लिए अलग-अलग कलर क्लासेस का मैप
const PARAM_TEXT_COLORS = {
  rPhase: "text-red-400 font-semibold",
  yPhase: "text-amber-400 font-semibold",
  bPhase: "text-blue-400 font-semibold",
  inductorVoltage: "text-cyan-300 font-semibold",
  lineCurrent: "text-emerald-400 font-semibold",
  linePF: "text-teal-300 font-semibold",
  power: "text-orange-400 font-semibold",
  inductorCurrent: "text-indigo-400 font-semibold",
  impedanceZ: "text-purple-400 font-semibold",
  resistanceR: "text-pink-400 font-semibold",
  reactanceX: "text-fuchsia-400 font-semibold",
  inductorPF: "text-sky-300 font-semibold",
  inductorKVA: "text-violet-400 font-semibold",
  conductanceInitial: "text-lime-400 font-semibold",
  conductanceRatio: "text-yellow-300 font-semibold",
};

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
          {ROWS.map((row, i) => {
            // पैरामीटर आईडी के हिसाब से कस्टम कलर चुनें, नहीं तो डिफ़ॉल्ट क्लास रखें
            const customTextColor = PARAM_TEXT_COLORS[row.id] || "text-slate-300";

            return (
              <tr key={row.id} className={i % 2 ? "bg-white/[0.02]" : ""}>
                <td className={`px-3 py-1.5 whitespace-nowrap ${customTextColor}`}>
                  {row.label} {row.unit && <span className="text-slate-500">({row.unit})</span>}
                </td>
                {entries.map((e) => {
                  const val = e[row.id];
                  const tone = cellTone(row.type, val);
                  return (
                    <td 
                      key={e.label + row.id} 
                      className={`px-2.5 py-1.5 text-center border-l border-slate-800 tabular-nums ${tone ? toneClasses[tone] : customTextColor}`}
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