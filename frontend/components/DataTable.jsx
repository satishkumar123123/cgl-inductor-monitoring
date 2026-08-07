import React from "react";
import { ROWS } from "../utils/rowsConfig.js";

// Safe resolver to map MongoDB keys dynamically to UI inputs
const getCellValue = (lvlObj, rowId) => {
  if (!lvlObj || typeof lvlObj !== "object") return "";

  // 1. Direct key match check
  if (lvlObj[rowId] !== undefined && lvlObj[rowId] !== null && lvlObj[rowId] !== "") {
    return lvlObj[rowId];
  }

  // 2. Comprehensive Aliases Map for MongoDB Mismatched Keys
  const keyAliases = {
    rPhase: ["rCurrent", "r_phase", "rPhaseCurrent"],
    yPhase: ["yCurrent", "y_phase", "yPhaseCurrent"],
    bPhase: ["bCurrent", "b_phase", "bPhaseCurrent"],
    kvarConnected: [
      "kvarConnected",
      "inductorKva",
      "kvar_connected",
      "inductorKVAR",
      "kvar",
      "kva"
    ],
    initialValue: [
      "initialValue",
      "conductorInitialValue",
      "condInitialValue",
      "conductanceInitialValue",
      "initial_value",
      "conductance_initial_value"
    ],
    conductanceRatio: [
      "conductanceRatio",
      "conductanceCurrentRatio",
      "condRatio",
      "conductance_ratio"
    ],
    inductorVoltage: ["voltage", "v", "indVoltage"],
    inductorCurrent: ["current", "i", "indCurrent"],
  };

  const aliases = keyAliases[rowId] || [];
  for (const alias of aliases) {
    if (lvlObj[alias] !== undefined && lvlObj[alias] !== null && lvlObj[alias] !== "") {
      return lvlObj[alias];
    }
  }

  return "";
};

// R Phase Current से लेकर Conductance Ratio तक के अलग-अलग पैरामीटर कलर्स
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
  initialValue: "text-lime-400 font-semibold",
  conductanceRatio: "text-yellow-300 font-semibold",
};

export default function DataTable({
  potKey,
  potLabel,
  inductors = [],
  potData = {},
  onChange,
  search = "",
  paramFilter = "all",
  errorCells = new Set(),
}) {
  const levels = ["high", "intermediate"];

  const filteredRows = ROWS.filter((row) => {
    if (paramFilter !== "all" && row.id !== paramFilter) return false;
    if (search.trim() !== "") {
      const query = search.toLowerCase();
      return row.label.toLowerCase().includes(query) || row.id.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
          ▍ {potLabel}
        </h3>
        <span className="text-[11px] text-slate-500">
          Inductors: {inductors.join(", ")}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400 bg-slate-950/40">
              <th className="p-2.5 font-semibold min-w-[200px] sticky left-0 bg-slate-950/90 z-10">
                Parameters
              </th>
              {inductors.map((ind) => (
                <th key={ind} colSpan={2} className="p-2.5 text-center border-l border-slate-800">
                  Inductor {ind}
                </th>
              ))}
            </tr>
            <tr className="border-b border-slate-800 text-[10px] text-slate-500 bg-slate-950/20">
              <th className="p-2 sticky left-0 bg-slate-950/90 z-10"></th>
              {inductors.map((ind) => (
                <React.Fragment key={`${ind}-levels`}>
                  <th className="p-1.5 text-center border-l border-slate-800 text-cyan-400/80 font-normal">
                    High
                  </th>
                  <th className="p-1.5 text-center text-amber-400/80 font-normal">
                    Interm.
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              // पैरामीटर ID के अनुसार कस्टम कलर प्राप्त करें
              const customColorClass = PARAM_TEXT_COLORS[row.id] || "text-slate-200";

              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Parameter Label Column with Dynamic Color */}
                  <td className={`p-2.5 font-medium sticky left-0 bg-slate-900/90 z-10 border-r border-slate-800/60 whitespace-nowrap ${customColorClass}`}>
                    {row.label}{" "}
                    {row.unit && (
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({row.unit})
                      </span>
                    )}
                  </td>

                  {inductors.map((ind) =>
                    levels.map((lvl) => {
                      const lvlObj = potData?.[ind]?.[lvl] || {};
                      const cellValue = getCellValue(lvlObj, row.id);
                      const cellKey = `${potKey}:${ind}:${lvl}:${row.id}`;
                      const isError = errorCells.has(cellKey);

                      return (
                        <td
                          key={`${ind}-${lvl}`}
                          className={`p-1 text-center border-l border-slate-800/40 ${
                            lvl === "high" ? "bg-slate-950/10" : ""
                          }`}
                        >
                          {/* Input Cell with Dynamic Color */}
                          <input
                            type="text"
                            value={cellValue}
                            onChange={(e) =>
                              onChange &&
                              onChange(potKey, ind, lvl, row.id, e.target.value)
                            }
                            className={`w-16 sm:w-20 px-1.5 py-1 text-center bg-slate-950/60 border rounded text-xs outline-none transition-all focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 ${customColorClass} ${
                              isError
                                ? "border-red-500 text-red-300 bg-red-950/20"
                                : "border-slate-800/80 hover:border-slate-700"
                            }`}
                          />
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}