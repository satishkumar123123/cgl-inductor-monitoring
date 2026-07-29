import React from "react";
import { ClipboardList, AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const SEVERITY_STYLE = {
  critical: { icon: AlertOctagon, color: "text-red-400", badge: "bg-red-500/10 border-red-500/40 text-red-300" },
  warning: { icon: AlertTriangle, color: "text-orange-400", badge: "bg-orange-500/10 border-orange-500/40 text-orange-300" },
  good: { icon: CheckCircle2, color: "text-emerald-400", badge: "bg-emerald-500/10 border-emerald-500/40 text-emerald-300" },
  info: { icon: Info, color: "text-cyan-400", badge: "bg-cyan-500/10 border-cyan-500/40 text-cyan-300" },
};

/**
 * Renders the Industrial Analysis Engine's structured observations
 * ({ id, message, severity }) as colored warning badges — reusable
 * anywhere a report or dashboard needs to surface automatic findings.
 */
export default function ObservationsPanel({ observations = [] }) {
  if (!observations.length) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 my-4">
      <div className="flex items-center gap-2 text-sm font-bold text-white mb-2.5">
        <ClipboardList size={16} className="text-cyan-400" /> Automatic Industrial Analysis
      </div>
      <ul className="flex flex-col gap-1.5">
        {observations.map((o, i) => {
          const s = SEVERITY_STYLE[o.severity] || SEVERITY_STYLE.info;
          const Icon = s.icon;
          return (
            <li key={o.id || i} className={`text-[12.5px] flex items-start gap-2 rounded-lg border px-2.5 py-1.5 ${s.badge}`}>
              <Icon size={13} className={`mt-0.5 shrink-0 ${s.color}`} />
              <span>{o.message}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
