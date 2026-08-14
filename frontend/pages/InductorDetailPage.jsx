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

export default function InductorDetailPage() {
  const { inductorKey } = useParams();
  const navigate = useNavigate();

  // Remark States
  const [remarkText, setRemarkText] = useState("");
  const [category, setCategory] = useState("General");
  const [remarksList, setRemarksList] = useState([]);
  const [savingRemark, setSavingRemark] = useState(false);

  // Chart & Telemetry States - डिफ़ॉल्ट 'bar' सेट किया गया
  const [metric, setMetric] = useState("conductanceRatio");
  const [timeRange, setTimeRange] = useState("5d");
  const [chartType, setChartType] = useState("bar");
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

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

      let limit = 5;
      if (timeRange === "20d") limit = 20;
      else if (timeRange === "30d") limit = 30;
      else if (timeRange === "1y") limit = 12;
      else if (timeRange === "2y") limit = 24;

      const targetHistory = historyList.slice(0, limit);

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

      const parsedPoints = detailedDocs
        .filter(Boolean)
        .map((doc) => {
          const pot = doc[potKey] || doc[potKey.toLowerCase()] || {};
          const ind = pot[letter] || pot[letter.toLowerCase()] || pot[`inductor${letter}`] || {};
          const high = ind.high || ind.High || ind.HIGH || ind;
          const inter = ind.intermediate || ind.Intermediate || ind.INTERMEDIATE || {};

          let cr =
            parseNum(high.conductanceRatio) ??
            parseNum(high.condRatio) ??
            parseNum(high.conductance_ratio) ??
            parseNum(high.ratio) ??
            parseNum(inter.conductanceRatio) ??
            parseNum(inter.condRatio) ??
            parseNum(ind.conductanceRatio) ??
            0;

          let cur =
            parseNum(high.inductorCurrent) ??
            parseNum(high.current) ??
            parseNum(high.lineCurrent) ??
            parseNum(high.indCurrent) ??
            parseNum(inter.inductorCurrent) ??
            parseNum(inter.current) ??
            parseNum(ind.inductorCurrent) ??
            0;

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
            conductanceRatio: Number(Number(cr).toFixed(4)),
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
      {/* TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-cyan-900 p-5 rounded-2xl border border-indigo-200 shadow-md text-white">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-cyan-200 hover:text-white transition-all cursor-pointer"
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
              Live Colourful Bar Telemetry &amp; Historical Operational Logger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTelemetryFromHistory}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-cyan-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
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

      {/* GRAPHICAL PERFORMANCE SECTION */}
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
                { key: "5d", label: "Recent 5 Data" },
                { key: "20d", label: "Recent 20 Data" },
                { key: "30d", label: "Recent 30 Data" },
                { key: "1y", label: "Recent 1 Year" },
                { key: "2y", label: "Recent 2 Years" },
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
                  chartType === "bar" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <BarChart2 size={16} />
              </button>
              <button
                onClick={() => setChartType("line")}
                title="Line Chart View"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  chartType === "line" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <TrendingUp size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Colourful Dynamic Chart Container */}
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
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={700} domain={["auto", "auto"]} tickLine={false} />
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
                    {/* हर बार को अलग-अलग कलर देने के लिए Cell मैपिंग */}
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
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={700} domain={["auto", "auto"]} tickLine={false} />
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
              <table className="w-full text-left text-[11px] text-slate-700 border border-slate-200 rounded-xl overflow-hidden">
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

      {/* OPERATIONAL REMARK FORM */}
      <div className="bg-white border border-purple-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSaveRemark} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-4">
            <h2 className="text-base font-black text-purple-800 uppercase tracking-wide flex items-center gap-2">
              <MessageSquare size={18} className="text-purple-600" />
              <span>Add Operational Remark &amp; Log</span>
            </h2>
            <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
              <Tag size={14} className="text-purple-600" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white border border-purple-300 rounded-lg px-3 py-1 text-xs font-extrabold text-purple-800 outline-none cursor-pointer"
              >
                <option value="General">🔵 General Log</option>
                <option value="Maintenance">🔴 Maintenance Issue</option>
                <option value="Greasing">🟡 Greasing Activity</option>
                <option value="Inspection">🟣 Inspection Checklist</option>
              </select>
            </div>
          </div>

          <textarea
            rows="3"
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            placeholder={`Write notes for ${formattedTitle}...`}
            className="w-full bg-slate-50 border border-purple-200 rounded-xl p-4 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-purple-500 transition-all resize-none"
          ></textarea>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingRemark}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              <MessageSquare size={14} />
              <span>{savingRemark ? "Saving..." : "Save Remark"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}