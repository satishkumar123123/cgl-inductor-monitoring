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
  Table,
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

const CATEGORY_STYLES = {
  Maintenance: {
    badge: "bg-rose-100 text-rose-700 border-rose-300",
    cardBg: "bg-gradient-to-r from-rose-50/90 via-pink-50/50 to-white",
    cardBorder: "border-rose-200 hover:border-rose-400",
    dot: "bg-rose-500 ring-rose-200",
  },
  Greasing: {
    badge: "bg-amber-100 text-amber-700 border-amber-300",
    cardBg: "bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white",
    cardBorder: "border-amber-200 hover:border-amber-400",
    dot: "bg-amber-500 ring-amber-200",
  },
  Inspection: {
    badge: "bg-purple-100 text-purple-700 border-purple-300",
    cardBg: "bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-white",
    cardBorder: "border-purple-200 hover:border-purple-400",
    dot: "bg-purple-500 ring-purple-200",
  },
  General: {
    badge: "bg-cyan-100 text-cyan-700 border-cyan-300",
    cardBg: "bg-gradient-to-r from-cyan-50/90 via-sky-50/50 to-white",
    cardBorder: "border-cyan-200 hover:border-cyan-400",
    dot: "bg-cyan-500 ring-cyan-200",
  },
};

export default function InductorDetailPage() {
  const { inductorKey } = useParams();
  const navigate = useNavigate();

  // Remarks States
  const [remarkText, setRemarkText] = useState("");
  const [category, setCategory] = useState("General");
  const [remarksList, setRemarksList] = useState([]);
  const [savingRemark, setSavingRemark] = useState(false);

  // Chart States (Default range is now 5d)
  const [metric, setMetric] = useState("conductanceRatio");
  const [timeRange, setTimeRange] = useState("5d");
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
      if (res.data?.success) setRemarksList(res.data.data || []);
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
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setChartData(list);
    } catch (err) {
      console.error("Chart Fetch Error:", err);
      setChartData([]);
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
      if (res.data?.success) {
        setRemarkText("");
        await fetchRemarks();
      }
    } catch (err) {
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
      
      {/* 0. HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-cyan-900 p-5 rounded-2xl border border-indigo-200 shadow-md text-white">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-cyan-200 hover:text-white transition-all shadow-xs"
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

      {/* 1. GRAPHICAL ANALYTICS SECTION */}
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
                className="bg-white border border-cyan-300 rounded-lg px-2.5 py-1 text-xs font-bold text-cyan-800 outline-none focus:border-cyan-500 shadow-xs cursor-pointer"
              >
                <option value="conductanceRatio">Conductance Ratio</option>
                <option value="current">Inductor Current (A)</option>
              </select>
            </div>

            {/* Time Range Selector: Added 5 Data button */}
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
        <div className="w-full h-[360px] pt-4">
          {loadingChart ? (
            <div className="h-full flex flex-col items-center justify-center text-xs font-bold text-cyan-600 animate-pulse gap-2">
              <Sparkles size={20} /> Loading chart analytics...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={330}>
              {chartType === "line" ? (
                <LineChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} fontWeight={700} />
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={700} domain={["auto", "auto"]} />
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
                    dot={{ r: 5, strokeWidth: 2, fill: "#ffffff" }}
                    activeDot={{ r: 7, fill: metric === "conductanceRatio" ? "#0891b2" : "#9333ea" }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} fontWeight={700} />
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={700} domain={["auto", "auto"]} />
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

        {/* 1.1 READABLE DATA SUMMARY TABLE */}
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

      {/* 2. OPERATIONAL REMARK SECTION */}
      <div className="bg-white border border-purple-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSaveRemark} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-4">
            <div>
              <h2 className="text-base font-black text-purple-800 uppercase tracking-wide flex items-center gap-2">
                <MessageSquare size={18} className="text-purple-600" />
                <span>Add Operational Remark &amp; Log</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
              <Tag size={14} className="text-purple-600" />
              <label className="text-xs font-extrabold text-purple-900 uppercase">Category:</label>
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
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              <span>{savingRemark ? "Saving..." : "Save Remark"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. REMARK HISTORY */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <History size={18} className="text-blue-600" />
          <span>Remark History ({remarksList.length})</span>
        </h3>
        {remarksList.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {remarksList.map((item, idx) => {
              const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.General;
              return (
                <div key={item._id || idx} className={`p-4 rounded-xl border ${style.cardBg} ${style.cardBorder}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${style.badge}`}>
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold">
                      {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-1">{item.remark}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No remarks saved yet.</p>
        )}
      </div>

    </div>
  );
}