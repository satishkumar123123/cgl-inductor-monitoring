import React from "react";
import { Wrench } from "lucide-react";

/**
 * Displays the Industrial Analysis Engine's plain-English recommendations.
 * Reusable alongside ObservationsPanel and HealthScoreCard on any report.
 */
export default function RecommendationsPanel({ recommendations = [] }) {
  if (!recommendations.length) return null;
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 my-4">
      <div className="flex items-center gap-2 text-sm font-bold text-white mb-2.5">
        <Wrench size={16} className="text-orange-400" /> Recommendations
      </div>
      <ul className="flex flex-col gap-1.5">
        {recommendations.map((r, i) => (
          <li key={i} className="text-[12.5px] text-slate-300 flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">→</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
