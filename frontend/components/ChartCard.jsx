import React from "react";
import { ResponsiveContainer } from "recharts";

export default function ChartCard({ title, right, children, height = 220 }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-xs font-bold text-white">{title}</div>
        {right}
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

export const chartTheme = {
  grid: "rgba(148,163,184,0.12)",
  tick: { fill: "#94A3B8", fontSize: 10.5 },
  tooltip: {
    contentStyle: {
      background: "#111C34",
      border: "1px solid rgba(148,163,184,0.18)",
      borderRadius: 10,
      fontSize: 11.5,
      color: "#E2E8F0",
    },
  },
};
