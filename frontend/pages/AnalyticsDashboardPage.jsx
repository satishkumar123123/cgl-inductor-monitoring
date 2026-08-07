import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Factory, Zap, Gauge, Percent, TrendingUp, TrendingDown,
} from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import FilterBar from "../components/FilterBar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { SkeletonCards, SkeletonChart } from "../components/Skeleton.jsx";
import useToast from "../hooks/useToast.js";
import { fetchAnalytics } from "../services/analyticsService.js";

const now = new Date();

// 8 Distinct Light & Modern Color Themes for Analytics Stat Cards (Pure White Compatible)
const STAT_CARD_STYLES = [
  // 1. Blue Theme
  {
    bg: "bg-blue-50 hover:bg-blue-100/80",
    border: "border-blue-200 hover:border-blue-300",
    accent: "text-blue-700",
  },
  // 2. Orange / Amber Theme
  {
    bg: "bg-amber-50 hover:bg-amber-100/80",
    border: "border-amber-200 hover:border-amber-300",
    accent: "text-amber-700",
  },
  // 3. Red Theme
  {
    bg: "bg-rose-50 hover:bg-rose-100/80",
    border: "border-rose-200 hover:border-rose-300",
    accent: "text-rose-700",
  },
  // 4. Cyan Theme
  {
    bg: "bg-cyan-50 hover:bg-cyan-100/80",
    border: "border-cyan-200 hover:border-cyan-300",
    accent: "text-cyan-700",
  },
  // 5. Emerald Theme
  {
    bg: "bg-emerald-50 hover:bg-emerald-100/80",
    border: "border-emerald-200 hover:border-emerald-300",
    accent: "text-emerald-700",
  },
  // 6. Pink Theme
  {
    bg: "bg-pink-50 hover:bg-pink-100/80",
    border: "border-pink-200 hover:border-pink-300",
    accent: "text-pink-700",
  },
  // 7. Purple Theme
  {
    bg: "bg-purple-50 hover:bg-purple-100/80",
    border: "border-purple-200 hover:border-purple-300",
    accent: "text-purple-700",
  },
  // 8. Indigo Theme
  {
    bg: "bg-indigo-50 hover:bg-indigo-100/80",
    border: "border-indigo-200 hover:border-indigo-300",
    accent: "text-indigo-700",
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

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (partial) => setFilters((f) => ({ ...f, ...partial }));

  const records = data?.records || [];
  const chartRecords = records.map((r) => ({ ...r, dateLabel: r.date.slice(5) }));
  const s = data?.summary;

  return (
    <div className="flex flex-col gap-6 p-6 bg-white min-h-screen text-slate-900 font-sans">
      <div>
        <h1 className="text-xl font-black text-slate-900">Analytics Dashboard</h1>
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
        <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
          No production/power data matches the selected filters.
        </div>
      ) : (
        <>
          {/* CARDS WITH 8 DISTINCT LIGHT COLORS */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <StatCard
              icon={Factory}
              label="Average Production"
              value={s.avgProduction.toFixed(1) + " Ton"}
              accent={STAT_CARD_STYLES[0].accent}
              className={`${STAT_CARD_STYLES[0].bg} border ${STAT_CARD_STYLES[0].border} shadow-sm`}
            />
            <StatCard
              icon={Zap}
              label="Average Power"
              value={s.avgPower.toFixed(1) + " kW"}
              accent={STAT_CARD_STYLES[1].accent}
              className={`${STAT_CARD_STYLES[1].bg} border ${STAT_CARD_STYLES[1].border} shadow-sm`}
            />
            <StatCard
              icon={Percent}
              label="Average Dross"
              value={s.avgDross.toFixed(1) + " kg"}
              accent={STAT_CARD_STYLES[2].accent}
              className={`${STAT_CARD_STYLES[2].bg} border ${STAT_CARD_STYLES[2].border} shadow-sm`}
            />
            <StatCard
              icon={Gauge}
              label="Average PF"
              value={s.avgPF ? s.avgPF.toFixed(3) : "—"}
              accent={STAT_CARD_STYLES[3].accent}
              className={`${STAT_CARD_STYLES[3].bg} border ${STAT_CARD_STYLES[3].border} shadow-sm`}
            />
            <StatCard
              icon={TrendingUp}
              label="Highest Production"
              value={s.highestProduction ? s.highestProduction.metalCharging.toFixed(1) + " Ton" : "—"}
              sub={s.highestProduction?.date}
              accent={STAT_CARD_STYLES[4].accent}
              className={`${STAT_CARD_STYLES[4].bg} border ${STAT_CARD_STYLES[4].border} shadow-sm`}
            />
            <StatCard
              icon={TrendingDown}
              label="Lowest Production"
              value={s.lowestProduction ? s.lowestProduction.metalCharging.toFixed(1) + " Ton" : "—"}
              sub={s.lowestProduction?.date}
              accent={STAT_CARD_STYLES[5].accent}
              className={`${STAT_CARD_STYLES[5].bg} border ${STAT_CARD_STYLES[5].border} shadow-sm`}
            />
            <StatCard
              icon={TrendingUp}
              label="Highest Power"
              value={s.highestPower ? s.highestPower.overallPower.toFixed(1) + " kW" : "—"}
              sub={s.highestPower?.date}
              accent={STAT_CARD_STYLES[6].accent}
              className={`${STAT_CARD_STYLES[6].bg} border ${STAT_CARD_STYLES[6].border} shadow-sm`}
            />
            <StatCard
              icon={TrendingDown}
              label="Lowest Power"
              value={s.lowestPower ? s.lowestPower.overallPower.toFixed(1) + " kW" : "—"}
              sub={s.lowestPower?.date}
              accent={STAT_CARD_STYLES[7].accent}
              className={`${STAT_CARD_STYLES[7].bg} border ${STAT_CARD_STYLES[7].border} shadow-sm`}
            />
          </div>

          {/* CHARTS */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
            <ChartCard title="Daily Power Trend">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartRecords}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                  <Line type="monotone" dataKey="overallPower" name="Overall Power (kW)" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Production Trend">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartRecords}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                  <Line type="monotone" dataKey="metalCharging" name="Production (Ton)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Power/Ton Trend">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartRecords}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                  <Line type="monotone" dataKey="powerPerTon" name="kW / Ton" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Dross Trend">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartRecords}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                  <Bar dataKey="drossGeneration" name="Dross (kg)" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Power vs Production">
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={chartRecords}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="metalCharging" name="Production (Ton)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="overallPower" name="Power (kW)" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Main Pot Power">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartRecords}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                  <Bar dataKey="mainPotPower" name="Main Pot Power (kW)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="PM Pot Power">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartRecords}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                  <Bar dataKey="pmPotPower" name="PM Pot Power (kW)" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Monthly Comparison">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.monthlyComparison}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="power" name="Total Power (kW)" fill="#ea580c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="production" name="Total Production (Ton)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Yearly Comparison">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.yearlyComparison}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="power" name="Total Power (kW)" fill="#ea580c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="production" name="Total Production (Ton)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}