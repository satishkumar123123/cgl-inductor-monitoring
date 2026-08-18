import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  Tag,
  MessageSquare,
  Sparkles,
  Layers,
  Table,
  BarChart2,
  RefreshCw,
  History,
  Calendar,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fetchHistory, fetchDataByDate } from "../services/dataService.js";
import api from "../services/api.js";

// प्रत्येक बार के लिए वाइब्रेंट कलर पैलेट
const BAR_COLORS = [
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple / Violet
  "#3b82f6", // Blue
  "#ec4899", // Pink
  "#f59e0b", // Amber / Orange
  "#10b981", // Emerald Green
  "#6366f1", // Indigo
  "#f43f5e", // Rose Red
  "#14b8a6", // Teal
  "#84cc16", // Lime
];

// रिमार्क कैटेगरीज के लिए वाइब्रेंट कलर स्टाइलिंग
const CATEGORY_STYLES = {
  Maintenance: {
    badge: "bg-rose-100 text-rose-700 border-rose-300",
    cardBg: "bg-gradient-to-r from-rose-50/90 via-pink-50/50 to-white",
    cardBorder: "border-rose-200 hover:border-rose-400",
    dot: "bg-rose-500 ring-rose-200",
    textHighlight: "text-rose-900",
  },
  Greasing: {
    badge: "bg-amber-100 text-amber-700 border-amber-300",
    cardBg: "bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white",
    cardBorder: "border-amber-200 hover:border-amber-400",
    dot: "bg-amber-500 ring-amber-200",
    textHighlight: "text-amber-900",
  },
  Inspection: {
    badge: "bg-purple-100 text-purple-700 border-purple-300",
    cardBg: "bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-white",
    cardBorder: "border-purple-200 hover:border-purple-400",
    dot: "bg-purple-500 ring-purple-200",
    textHighlight: "text-purple-900",
  },
  General: {
    badge: "bg-cyan-100 text-cyan-700 border-cyan-300",
    cardBg: "bg-gradient-to-r from-cyan-50/90 via-sky-50/50 to-white",
    cardBorder: "border-cyan-200 hover:border-cyan-400",
    dot: "bg-cyan-500 ring-cyan-200",
    textHighlight: "text-cyan-900",
  },
};

export default function InductorDetailPage() {
  const { inductorKey } = useParams();
  const navigate = useNavigate();

  // Remark States
  const [remarkText, setRemarkText] = useState("");
  const [category, setCategory] = useState("General");
  const [remarksList, setRemarksList] = useState([]);
  const [savingRemark, setSavingRemark] = useState(false);

  // Chart & Telemetry States - डिफ़ॉल्ट 'bar'
  const [metric, setMetric] = useState("conductanceRatio");
  const [timeRange, setTimeRange] = useState("5d");
  const [chartType, setChartType] = useState("bar");
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  // Y-Axis Ticks and Domain according to selected metric
  const yAxisDomain = metric === "conductanceRatio" ? [0, 120] : [0, 1800];
  const yAxisTicks =
    metric === "conductanceRatio"
      ? [0, 30, 60, 90, 120]
      : [0, 450, 900, 1350, 1800];

  // Load telemetry data on load or when time range / inductor changes
  useEffect(() => {
    if (inductorKey) {
      loadTelemetryFromHistory();
      fetchRemarks();
    }
  }, [inductorKey, timeRange]);

  // Telemetry Fetcher using verified dataService functions
  const loadTelemetryFromHistory = async () => {
    setLoadingChart(true);
    try {
      const historyList = await fetchHistory();
      if (!historyList || historyList.length === 0) {
        setChartData([]);
        return;
      }

      // Determine target history according to selected range
      let targetHistory = [];
      const now = new Date();

      if (timeRange === "5d") {
        targetHistory = historyList.slice(0, 5);
      } else if (timeRange === "20d") {
        targetHistory = historyList.slice(0, 20);
      } else if (timeRange === "30d") {
        targetHistory = historyList.slice(0, 30);
      } else if (timeRange === "1y") {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        targetHistory = historyList.filter((item) => new Date(item.date) >= oneYearAgo);
      } else if (timeRange === "2y") {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(now.getFullYear() - 2);
        targetHistory = historyList.filter((item) => new Date(item.date) >= twoYearsAgo);
      }

      const rawKey = String(inductorKey || "MAIN_A").toUpperCase();
      const isPm = rawKey.includes("PM");
      const potKey = isPm ? "pmPot" : "mainPot";

      let letter = "A";
      if (rawKey.includes("B")) letter = "B";
      else if (rawKey.includes("C")) letter = "C";
      else if (rawKey.includes("D")) letter = "D";

      const detailedDocs = await Promise.all(
        targetHistory.map(async (item) => {
          try {
            const fullDoc = await fetchDataByDate(item.date);
            return fullDoc || item;
          } catch (e) {
            return item;
          }
        })
      );

      const parseNum = (val) => {
        if (val === undefined || val === null || val === "" || val === "-" || val === "—") return null;
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
      };

      // Universal Deep Matcher (Supports conductanceCurrentRatio, conductanceRatio, Root & Nested)
      const parsedPoints = detailedDocs
        .filter(Boolean)
        .map((doc) => {
          // 1. Pot wrapper or Root fallback
          const pot = doc[potKey] || doc[potKey.toLowerCase()] || doc;

          // 2. Inductor level (A, B, C, D)
          const ind =
            pot[letter] ||
            pot[letter.toLowerCase()] ||
            pot[`inductor${letter}`] ||
            doc[letter] ||
            doc[letter.toLowerCase()] ||
            {};

          // 3. High & Intermediate levels
          const high = ind.high || ind.High || ind.HIGH || ind;
          const inter = ind.intermediate || ind.Intermediate || ind.INTERMEDIATE || {};

          // 4. Safely extract Conductance Ratio
          let cr =
            parseNum(high.conductanceRatio) ??
            parseNum(high.condRatio) ??
            parseNum(high.conductance_ratio) ??
            parseNum(high.cr) ??
            parseNum(high.ratio) ??
            parseNum(high.conductanceCurrentRatio) ??
            parseNum(high.conductanceCurrentRation) ??
            parseNum(high.conductance_current_ratio) ??
            parseNum(high.conductanceInitialValue) ??
            parseNum(inter.conductanceRatio) ??
            parseNum(inter.conductanceCurrentRatio) ??
            parseNum(inter.condRatio) ??
            parseNum(ind.conductanceRatio) ??
            parseNum(ind.conductanceCurrentRatio) ??
            parseNum(ind.conductanceCurrentRation) ??
            parseNum(ind.cr) ??
            parseNum(doc.conductanceRatio) ??
            parseNum(doc.conductanceCurrentRatio) ??
            0;

          // 5. Safely extract Inductor Current
          let cur =
            parseNum(high.inductorCurrent) ??
            parseNum(high.current) ??
            parseNum(high.lineCurrent) ??
            parseNum(high.indCurrent) ??
            parseNum(inter.inductorCurrent) ??
            parseNum(inter.current) ??
            parseNum(ind.inductorCurrent) ??
            parseNum(ind.current) ??
            parseNum(ind.lineCurrent) ??
            parseNum(doc.inductorCurrent) ??
            0;

          // Date formatting
          let rawDate = doc.date || (doc.createdAt ? new Date(doc.createdAt).toISOString().split("T")[0] : "N/A");
          let displayDate = rawDate;

          if (rawDate.includes("-")) {
            const parts = rawDate.split("-");
            if (parts.length === 3) displayDate = `${parts[1]}/${parts[2]}`;
          } else if (rawDate.includes("/")) {
            const parts = rawDate.split("/");
            if (parts.length >= 2) displayDate = `${parts[0]}/${parts[1]}`;
          }

          return {
            date: displayDate,
            fullDate: rawDate,
            conductanceRatio: Number(Number(cr).toFixed(2)),
            current: Number(Number(cur).toFixed(2)),
          };
        })
        .reverse();

      setChartData(parsedPoints);
    } catch (err) {
      console.error("Telemetry Extraction Error:", err);
      setChartData([]);
    } finally {
      setLoadingChart(false);
    }
  };

  // Fetch Remarks
  const fetchRemarks = async () => {
    try {
      const { data } = await api.get(`/api/inductors/remarks/${inductorKey}`);
      if (data?.success) setRemarksList(data.data || []);
    } catch (err) {
      console.warn("Remarks fetch skipped or not configured:", err);
    }
  };

  // Save Remark
  const handleSaveRemark = async (e) => {
    e.preventDefault();
    if (!remarkText.trim()) return alert("Please enter remark");

    setSavingRemark(true);
    try {
      const { data } = await api.post("/api/inductors/remarks", {
        inductorKey,
        inductorName: inductorKey ? inductorKey.replace("_", " ") : "Inductor",
        remark: remarkText,
        category,
      });
      if (data?.success) {
        setRemarkText("");
        await fetchRemarks();
      }
    } catch (err) {
      alert("Error saving remark");
    } finally {
      setSavingRemark(false);
    }
  };

  const formattedTitle = inductorKey ? inductorKey.replace("_", " ").toUpperCase() : "INDUCTOR";

  return (
    <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen max-w-[1600px] mx-auto font-sans">
      {/* 0. TOP HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-cyan-900 p-5 rounded-2xl border border-indigo-200 shadow-md text-white">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-cyan-200 hover:text-white transition-all cursor-pointer shadow-xs"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              <Sparkles size={20} className="text-amber-400 animate-pulse" />
              <span>{formattedTitle}</span>
              <span className="text-cyan-300 font-extrabold">ANALYTICAL DASHBOARD</span>
            </h1>
            <p className="text-xs text-cyan-100 font-medium mt-0.5">
              Live Colourful Bar Telemetry, Operational Logger &amp; Log Timelines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTelemetryFromHistory}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-cyan-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
          >
            <RefreshCw size={14} className={loadingChart ? "animate-spin" : ""} /> Refresh Data
          </button>
          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-cyan-200">
            <Layers size={14} className="text-cyan-300" />
            <span>Active Inductor:</span>
            <span className="bg-cyan-500/30 text-cyan-100 px-2 py-0.5 rounded-md uppercase border border-cyan-400/30">
              {inductorKey || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* 1. TOP: GRAPHICAL PERFORMANCE ANALYTICS SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-cyan-700 uppercase tracking-wide flex items-center gap-2">
              <BarChart2 size={18} className="text-cyan-600" />
              <span className="text-blue-700">Graphical</span>
              <span className="text-cyan-600">Performance</span>
              <span className="text-indigo-600">Analytics</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {chartData.length} records from database
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Selector */}
            <div className="flex items-center gap-1.5 bg-cyan-50/80 px-3 py-1.5 rounded-xl border border-cyan-200 shadow-xs">
              <Tag size={13} className="text-cyan-600" />
              <span className="text-[11px] font-bold text-cyan-900 uppercase">Metric:</span>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="bg-white border border-cyan-300 rounded-lg px-2.5 py-1 text-xs font-bold text-cyan-800 outline-none cursor-pointer"
              >
                <option value="conductanceRatio">Conductance Ratio</option>
                <option value="current">Inductor Current (A)</option>
              </select>
            </div>

            {/* Time Range Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs flex-wrap gap-1">
              {[
                { key: "5d", label: "Recent 5 Days" },
                { key: "20d", label: "Recent 20 Days" },
                { key: "30d", label: "Recent 30 Days" },
                { key: "1y", label: "Last 1 Year" },
                { key: "2y", label: "Last 2 Years" },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setTimeRange(r.key)}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg uppercase transition-all cursor-pointer ${
                    timeRange === r.key
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Chart Type Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setChartType("bar")}
                title="Bar Chart View"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  chartType === "bar" ? "bg-white text-cyan-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <BarChart2 size={16} />
              </button>
              <button
                onClick={() => setChartType("line")}
                title="Line Chart View"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  chartType === "line" ? "bg-white text-cyan-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <TrendingUp size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Chart Container */}
        <div className="w-full h-[360px] pt-4">
          {loadingChart ? (
            <div className="h-full flex flex-col items-center justify-center text-xs font-bold text-cyan-600 animate-pulse gap-2">
              <Sparkles size={20} /> Loading telemetry records from database...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={330}>
              {chartType === "bar" ? (
                <BarChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} fontWeight={700} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    fontWeight={700}
                    domain={yAxisDomain}
                    ticks={yAxisTicks}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                      color: "#0f172a",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />
                  <Bar
                    dataKey={metric}
                    name={metric === "conductanceRatio" ? "Conductance Ratio" : "Inductor Current (A)"}
                    radius={[8, 8, 2, 2]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} fontWeight={700} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    fontWeight={700}
                    domain={yAxisDomain}
                    ticks={yAxisTicks}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                      color: "#0f172a",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    name={metric === "conductanceRatio" ? "Conductance Ratio" : "Inductor Current (A)"}
                    stroke={metric === "conductanceRatio" ? "#0891b2" : "#9333ea"}
                    strokeWidth={3}
                    dot={{ r: 5, strokeWidth: 2, fill: "#ffffff" }}
                    activeDot={{ r: 7, fill: metric === "conductanceRatio" ? "#0891b2" : "#9333ea" }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              No telemetry data found for this inductor in the database.
            </div>
          )}
        </div>

        {/* SUMMARY DATA TABLE */}
        {chartData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-600 uppercase mb-2 flex items-center gap-1.5">
              <Table size={14} className="text-blue-600" /> Stored Telemetry Values ({chartData.length} entries)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] text-slate-700 border border-slate-200 rounded-xl border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-black uppercase">
                  <tr>
                    <th className="p-2 border-b">Date</th>
                    <th className="p-2 border-b text-cyan-700">Conductance Ratio</th>
                    <th className="p-2 border-b text-purple-700">Inductor Current (A)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {chartData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-900">{row.fullDate || row.date}</td>
                      <td className="p-2 font-black text-cyan-700">{row.conductanceRatio}</td>
                      <td className="p-2 font-black text-purple-700">{row.current} A</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 2. MIDDLE: ADD OPERATIONAL REMARK FORM */}
      <div className="bg-white border border-purple-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSaveRemark} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-4">
            <div>
              <h2 className="text-base font-black text-purple-800 uppercase tracking-wide flex items-center gap-2">
                <MessageSquare size={18} className="text-purple-600" />
                <span className="text-purple-700">Add</span>
                <span className="text-indigo-600">Operational</span>
                <span className="text-rose-600">Remark &amp; Log</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Record new maintenance, inspection, or general shift notes for this inductor
              </p>
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200 shadow-xs">
              <Tag size={14} className="text-purple-600" />
              <label className="text-xs font-extrabold text-purple-900 uppercase">
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white border border-purple-300 rounded-lg px-3 py-1 text-xs font-extrabold text-purple-800 outline-none focus:border-purple-500 shadow-xs cursor-pointer"
              >
                <option value="General">🔵 General Log</option>
                <option value="Maintenance">🔴 Maintenance Issue</option>
                <option value="Greasing">🟡 Greasing Activity</option>
                <option value="Inspection">🟣 Inspection Checklist</option>
              </select>
            </div>
          </div>

          {/* Textarea Box */}
          <div className="relative">
            <textarea
              rows="3"
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder={`Write your detailed shift log, inspection observation, or maintenance notes for ${formattedTitle}...`}
              className="w-full bg-slate-50 border border-purple-200 rounded-xl p-4 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400 resize-none shadow-xs"
            ></textarea>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>
                Selected Category:{" "}
                <span className={`px-2 py-0.5 rounded-full border font-bold ${CATEGORY_STYLES[category]?.badge}`}>
                  {category}
                </span>
              </span>
            </div>

            <button
              type="submit"
              disabled={savingRemark}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Send size={14} />
              <span>{savingRemark ? "Saving Remark..." : "Save Remark to History"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. BOTTOM: SAVED REMARK HISTORY LOGS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg border border-cyan-200 shadow-2xs">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-blue-700">Remark</span>
                <span className="text-purple-700">History</span>
                <span className="text-cyan-600">Logs</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Complete chronological timeline of saved operator observations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-indigo-900 shadow-xs">
            <span>Total Logs:</span>
            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md text-[11px] font-black">
              {remarksList.length} Entries
            </span>
          </div>
        </div>

        {/* History Cards Container */}
        {remarksList.length > 0 ? (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {remarksList.map((item, idx) => {
              const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.General;
              return (
                <div
                  key={item._id || idx}
                  className={`p-4 rounded-xl border transition-all duration-200 shadow-xs ${style.cardBg} ${style.cardBorder}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${style.dot} ring-4`}></span>
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${style.badge}`}>
                        {item.category || "General"}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        • Log #{remarksList.length - idx}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                      <span className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-lg border border-slate-200">
                        <Calendar size={12} className="text-blue-500" />
                        <span className="text-slate-700">
                          {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-lg border border-slate-200">
                        <Clock size={12} className="text-indigo-500" />
                        <span className="text-slate-700">
                          {new Date(item.createdAt || Date.now()).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Remark Message Text */}
                  <p className="text-xs font-bold text-slate-800 leading-relaxed bg-white/80 p-3 rounded-lg border border-slate-200/70 mt-1 shadow-2xs">
                    {item.remark}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
            <History size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-500">No operational remarks logged yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enter a note in the form above and click &quot;Save Remark&quot; to start the history timeline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}