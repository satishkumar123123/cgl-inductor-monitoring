import React from "react";
import { HeartPulse } from "lucide-react";

const STATUS_STYLE = {
  green: { ring: "#10B981", badge: "bg-emerald-500/10 border-emerald-500/40 text-emerald-300" },
  cyan: { ring: "#22D3EE", badge: "bg-cyan-500/10 border-cyan-500/40 text-cyan-300" },
  blue: { ring: "#3B82F6", badge: "bg-blue-500/10 border-blue-500/40 text-blue-300" },
  orange: { ring: "#F97316", badge: "bg-orange-500/10 border-orange-500/40 text-orange-300" },
  red: { ring: "#EF4444", badge: "bg-red-500/10 border-red-500/40 text-red-300" },
};

/**
 * Displays the Industrial Analysis Engine's 0-100 Health Score as a circular
 * gauge plus a colored Equipment Status badge. Reusable wherever a report or
 * dashboard needs a quick at-a-glance equipment health indicator.
 */
export default function HealthScoreCard({ score, status, statusColor }) {
  const style = STATUS_STYLE[statusColor] || STATUS_STYLE.blue;
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
      <div className="relative w-20 h-20 shrink-0">
        <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="34" fill="none" stroke={style.ring} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset .6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-lg font-extrabold text-white leading-none">{score}</span>
          <span className="text-[9px] text-slate-500">/ 100</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-500 mb-1.5">
          <HeartPulse size={13} className="text-cyan-400" /> Equipment Health Score
        </div>
        <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full border ${style.badge}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
