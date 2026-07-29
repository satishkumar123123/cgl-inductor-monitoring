import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Factory, Zap, Gauge, Percent, TrendingUp, TrendingDown,
} from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import ChartCard, { chartTheme } from "../components/ChartCard.jsx";
import FilterBar from "../components/FilterBar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { SkeletonCards, SkeletonChart } from "../components/Skeleton.jsx";
import useToast from "../hooks/useToast.js";
import { fetchAnalytics } from "../services/analyticsService.js";

const now = new Date();

// Unique attractive styles for each Analytics Stat Card
const STAT_CARD_STYLES = [
  {
    bg: "bg-gradient-to-br from-blue-950/80 via-slate-900/90 to-cyan-950/80",
    border: "border-blue-500/40 hover:border-blue-400",
    accent: "text-blue-400",
  },
  {
    bg: "bg-gradient-to-br from-amber-950/80 via-slate-900/90 to-orange-950/80",
    border: "border-amber-500/40 hover:border-amber-400",
    accent: "text-orange-400",
  },
  {
    bg: "bg-gradient-to-br from-rose-950/80 via-slate-900/90 to-red-950/80",
    border: "border-rose-500/40 hover:border-rose-400",
    accent: "text-red-400",
  },
  {
    bg: "bg-gradient-to-br from-cyan-950/80 via-slate-900/90 to-teal-950/80",
    border: "border-cyan-500/40 hover:border-cyan-400",
    accent: "text-cyan-400",
  },
  {
    bg: "bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-teal-950/80",
    border: "border-emerald-500/40 hover:border-emerald-400",
    accent: "text-emerald-400",
  },
  {
    bg: "bg-gradient-to-br from-pink-950/80 via-slate-900/90 to-rose-950/80",
    border: "border-pink-500/40 hover:border-pink-400",
    accent: "text-pink-400",
  },
  {
    bg: "bg-gradient-to-br from-purple-950/80 via-slate-900/90 to-violet-950/80",
    border: "border-purple-500/40 hover:border-purple-400",
    accent: "text-purple-400",
  },
  {
    bg: "bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-blue-950/80",
    border: "border-indigo-500/40 hover:border-indigo-400",
    accent: "text-indigo-400",
  },
];

export default function AnalyticsDashboardPage() {
  const { notify } = useToast();
  const [filters, setFilters] = useState({
    mode: "range", from: "", to: "", month: now.getMonth() + 1, year: now.getFullYear(), shift: "",
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { shift: filters.shift || undefined };
      if (filters.mode === "range") {
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
      } else if (filters.mode === "month") {
        params.month = filters.month;
        params.year = filters.year;
      } else if (filters.mode === "year") {
        params.year = filters.year;
      }
      const result = await fetchAnalytics(params);
      setData(result);
    } catch (err) {
      notify(err.response?.data?.message || "Failed to load analytics", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charts update automatically whenever the filters change and Apply is pressed,
  // and also on first mount.
  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (partial) => setFilters((f) => ({ ...f, ...partial }));

  const records = data?.records || [];
  const chartRecords = records.map((r) => ({ ...r, dateLabel: r.date.slice(5) }));
  const s = data?.summary;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-extrabold text-white">Analytics Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">Combined production, power, and power-factor performance across any date range, month, year, or shift.</p>
      </div>

      <FilterBar value={filters} onChange={handleFilterChange} onApply={load} />

      {loading ? (
        <div className="flex flex-col gap-4">
          <LoadingSpinner label="Crunching the numbers…" />
          <SkeletonCards count={8} />
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
            <SkeletonChart /><SkeletonChart /><SkeletonChart />
          </div>
        </div>
      ) : !s || records.length === 0 ? (
        <div className="text-sm text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
          No production/power data matches the selected filters.
        </div>
      ) : (
        <>
          {/* CARDS WITH DIFFERENT COLORS & GRADIENTS */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <StatCard
              icon={Factory}
              label="Average Production"
              value={s.avgProduction.toFixed(1) + " Ton"}
              accent={STAT_CARD_STYLES[0].accent}
              className={`${STAT_CARD_STYLES[0].bg} border ${STAT_CARD_STYLES[0].border}`}
            />
            <StatCard
              icon={Zap}
              label="Average Power"
              value={s.avgPower.toFixed(1) + " kW"}
              accent={STAT_CARD_STYLES[1].accent}
              className={`${STAT_CARD_STYLES[1].bg} border ${STAT_CARD_STYLES[1].border}`}
            />
            <StatCard
              icon={Percent}
              label="Average Dross"
              value={s.avgDross.toFixed(1) + " kg"}
              accent={STAT_CARD_STYLES[2].accent}
              className={`${STAT_CARD_STYLES[2].bg} border ${STAT_CARD_STYLES[2].border}`}
            />
            <StatCard
              icon={Gauge}
              label="Average PF"
              value={s.avgPF ? s.avgPF.toFixed(3) : "—"}
              accent={STAT_CARD_STYLES[3].accent}
              className={`${STAT_CARD_STYLES[3].bg} border ${STAT_CARD_STYLES[3].border}`}
            />
            <StatCard
              icon={TrendingUp}
              label="Highest Production"
              value={s.highestProduction ? s.highestProduction.metalCharging.toFixed(1) + " Ton" : "—"}
              sub={s.highestProduction?.date}
              accent={STAT_CARD_STYLES[4].accent}
              className={`${STAT_CARD_STYLES[4].bg} border ${STAT_CARD_STYLES[4].border}`}
            />
            <StatCard
              icon={TrendingDown}
              label="Lowest Production"
              value={s.lowestProduction ? s.lowestProduction.metalCharging.toFixed(1) + " Ton" : "—"}
              sub={s.lowestProduction?.date}
              accent={STAT_CARD_STYLES[5].accent}
              className={`${STAT_CARD_STYLES[5].bg} border ${STAT_CARD_STYLES[5].border}`}
            />
            <StatCard
              icon={TrendingUp}
              label="Highest Power"
              value={s.highestPower ? s.highestPower.overallPower.toFixed(1) + " kW" : "—"}
              sub={s.highestPower?.date}
              accent={STAT_CARD_STYLES[6].accent}
              className={`${STAT_CARD_STYLES[6].bg} border ${STAT_CARD_STYLES[6].border}`}
            />
            <StatCard
              icon={TrendingDown}
              label="Lowest Power"
              value={s.lowestPower ? s.lowestPower.overallPower.toFixed(1) + " kW" : "—"}
              sub={s.lowestPower?.date}
              accent={STAT_CARD_STYLES[7].accent}
              className={`${STAT_CARD_STYLES[7].bg} border ${STAT_CARD_STYLES[7].border}`}
            />
          </div>

          {/* CHARTS */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
            <ChartCard title="Daily Power Trend">
              <LineChart data={chartRecords}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="dateLabel" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Line type="monotone" dataKey="overallPower" name="Overall Power (kW)" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ChartCard>

            <ChartCard title="Production Trend">
              <LineChart data={chartRecords}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="dateLabel" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Line type="monotone" dataKey="metalCharging" name="Production (Ton)" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ChartCard>

            <ChartCard title="Power/Ton Trend">
              <LineChart data={chartRecords}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="dateLabel" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Line type="monotone" dataKey="powerPerTon" name="kW / Ton" stroke="#22D3EE" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ChartCard>

            <ChartCard title="Dross Trend">
              <BarChart data={chartRecords}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="dateLabel" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="drossGeneration" name="Dross (kg)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard title="Power vs Production">
              <ComposedChart data={chartRecords}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="dateLabel" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="metalCharging" name="Production (Ton)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="overallPower" name="Power (kW)" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ChartCard>

            <ChartCard title="Main Pot Power">
              <BarChart data={chartRecords}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="dateLabel" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="mainPotPower" name="Main Pot Power (kW)" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard title="PM Pot Power">
              <BarChart data={chartRecords}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="dateLabel" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="pmPotPower" name="PM Pot Power (kW)" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard title="Monthly Comparison">
              <BarChart data={data.monthlyComparison}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="month" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="power" name="Total Power (kW)" fill="#F97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="production" name="Total Production (Ton)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard title="Yearly Comparison">
              <BarChart data={data.yearlyComparison}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="year" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="power" name="Total Power (kW)" fill="#F97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="production" name="Total Production (Ton)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}