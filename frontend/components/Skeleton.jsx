import React from "react";

/**
 * Generic shimmering placeholder block. Reusable anywhere a page needs a
 * loading skeleton instead of (or alongside) a spinner — pass a Tailwind
 * height/width via className.
 */
export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gradient-to-r from-slate-800/60 via-slate-700/40 to-slate-800/60 bg-[length:200%_100%] ${className}`}
      style={{ animation: "shimmer 1.6s ease-in-out infinite" }}
    />
  );
}

/** A row of skeleton cards, e.g. for summary-card grids while data loads. */
export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** A skeleton table, e.g. for History / Report History while data loads. */
export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((__, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A skeleton chart card placeholder, matching ChartCard's footprint. */
export function SkeletonChart() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <Skeleton className="h-3 w-1/3 mb-3" />
      <Skeleton className="h-[220px] w-full" />
    </div>
  );
}

export default Skeleton;
