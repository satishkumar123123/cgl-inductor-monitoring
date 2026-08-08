import React from "react";
import { ResponsiveContainer } from "recharts";

export default function ChartCard({ title, right, children, height = 220 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">{title}</div>
        {right}
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

export const chartTheme = {
  grid: "#e2e8f0",
  tick: { fill: "#475569", fontSize: 10.5 },
  tooltip: {
    contentStyle: {
      background: "#ffffff",
      border: "1px solid #cbd5e1",
      borderRadius: 10,
      fontSize: 11.5,
      color: "#0f172a",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
  },
};