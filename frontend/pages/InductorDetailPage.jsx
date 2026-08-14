import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  History,
  Clock,
  BarChart2,
  TrendingUp,
  Tag,
  MessageSquare,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import axios from "axios";

// हर कैटेगरी के लिए वाइब्रेंट व कलरफुल थीम स्टाइल
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

  // Chart States
  const [metric, setMetric] = useState("conductanceRatio");
  const [timeRange, setTimeRange] = useState("30d");
  const [chartType, setChartType] = useState("line");
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    if (inductorKey) {
      fetchRemarks();
      fetchChartData();
    }
  }, [inductorKey, timeRange]);

  const fetchRemarks = async () => {
    try {
      const res = await axios.get(`/api/inductors/remarks/${inductorKey}`);
      if (res.data.success) setRemarksList(res.data.data || []);
    } catch (err) {
      console.error("Remarks Fetch Error:", err);
    }
  };

  const fetchChartData = async () => {
    setLoadingChart(true);
    try {
      const res = await axios.get(
        `/api/inductors/analytics/${inductorKey}?range=${timeRange}`
      );
      if (res.data.success) setChartData(res.data.data || []);
    } catch (err) {
      console.error("Chart Fetch Error:", err);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleSaveRemark = async (e) => {
    e.preventDefault();
    if (!remarkText.trim()) {
      alert("Please enter a remark before saving.");
      return;
    }

    setSavingRemark(true);
    try {
      const res = await axios.post("/api/inductors/remarks", {
        inductorKey,
        inductorName: inductorKey ? inductorKey.replace("_", " ") : "Inductor",
        remark: remarkText,
        category,
      });
      if (res.data.success) {
        setRemarkText("");
        await fetchRemarks();
      }
    } catch (err) {
      console.error("Save Remark Error:", err);
      alert("Error saving remark");
    } finally {
      setSavingRemark(false);
    }
  };

  const formattedTitle = inductorKey
    ? inductorKey.replace("_", " ").toUpperCase()
    : "INDUCTOR";

  return (
    <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen max-w-[1600px] mx-auto font-sans">
      {/* ========================================================================= */}
      {/* 0. COLOURFUL TOP HEADER SECTION                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-cyan-900 p-5 rounded-2xl border border-indigo-200 shadow-md text-white">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-cyan-200 hover:text-white transition-all shadow-xs"
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
              Live Graphical Performance, Wide Operational Logger &amp; Log Timelines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-cyan-200">
          <Layers size={14} className="text-cyan-300" />
          <span>Active Inductor:</span>
          <span className="bg-cyan-500/30 text-cyan-100 px-2 py-0.5 rounded-md uppercase border border-cyan-400/30">
            {inductorKey || "N/A"}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP: GRAPHICAL PERFORMANCE ANALYTICS SECTION                           */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-cyan-700 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp size={18} className="text-cyan-600" />
              <span className="text-blue-700">Graphical</span>
              <span className="text-cyan-600">Performance</span>
              <span className="text-indigo-600">Analytics</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Switch metrics and time periods to analyze long-term telemetry trends
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-cyan-50/80 px-3 py-1.5 rounded-xl border border-cyan-200 shadow-xs">
              <Tag size={13} className="text-cyan-600" />
              <span className="text-[11px] font-bold text-cyan-900 uppercase">Metric:</span>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="bg-white border border-cyan-300 rounded-lg px-2.5 py-1 text-xs font-bold text-cyan-800 outline-none focus:border-cyan-500 shadow-xs cursor-pointer"
              >
                <option value="conductanceRatio">Conductance Ratio</option>
                <option value="current">Inductor Current (A)</option>
              </select>
            </div>

            {/* Time Range Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs flex-wrap gap-1">
              {[
                { key: "20d", label: "Recent 20 Data" },
                { key: "30d", label: "Recent 30 Data" },
                { key: "1y", label: "Recent 1 Year" },
                { key: "2y", label: "Recent 2 Years" },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setTimeRange(r.key)}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg uppercase transition-all ${
                    timeRange === r.key
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Chart Type Toggles */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setChartType("line")}
                title="Line Chart View"
                className={`p-2 rounded-lg transition-all ${
                  chartType === "line"
                    ? "bg-white text-cyan-700 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <TrendingUp size={16} />
              </button>
              <button
                onClick={() => setChartType("bar")}
                title="Bar Chart View"
                className={`p-2 rounded-lg transition-all ${
                  chartType === "bar"
                    ? "bg-white text-cyan-700 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <BarChart2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Chart Container */}
        <div className="w-full h-[360px] min-h-[360px] pt-4 relative">
          {loadingChart ? (
            <div className="h-full flex flex-col items-center justify-center text-xs font-bold text-cyan-600 animate-pulse gap-2">
              <Sparkles size={20} />
              Loading chart analytics...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              {chartType === "line" ? (
                <LineChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} fontWeight={700} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={700} domain={["auto", "auto"]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #cbd5e1",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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
                    dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                    activeDot={{ r: 7, fill: metric === "conductanceRatio" ? "#0891b2" : "#9333ea" }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} fontWeight={700} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={700} domain={["auto", "auto"]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #cbd5e1",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      color: "#0f172a",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />
                  <Bar
                    dataKey={metric}
                    name={metric === "conductanceRatio" ? "Conductance Ratio" : "Inductor Current (A)"}
                    fill={metric === "conductanceRatio" ? "#0891b2" : "#9333ea"}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              No telemetry data found for this inductor in the database.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MIDDLE: ADD OPERATIONAL REMARK (FULL HORIZONTAL WIDTH)                 */}
      {/* ========================================================================= */}
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

            {/* Colourful Category Selector */}
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

          {/* Full-Width Textarea Box */}
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
                <span className={`px-2 py-0.5 rounded-full border ${CATEGORY_STYLES[category]?.badge}`}>
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

      {/* ========================================================================= */}
      {/* 3. BOTTOM: REMARK HISTORY LOGS (FULL WIDTH & COLOURFUL TIMELINE CARDS)    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg border border-cyan-200">
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
            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md text-[11px]">
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