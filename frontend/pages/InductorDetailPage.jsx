import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react";
import { ArrowLeft, Send, History, Clock, User, BarChart2, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import axios from "axios";

const CATEGORY_COLORS = {
  Maintenance: "bg-red-500/20 text-red-400 border-red-500/30",
  Greasing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Inspection: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  General: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

export default function InductorDetailPage() {
  const { inductorKey } = useParams();
  const navigate = useNavigate();

  // Remark States
  const [remarkText, setRemarkText] = useState("");
  const [category, setCategory] = useState("General");
  const [remarksList, setRemarksList] = useState([]);

  // Chart States
  const [metric, setMetric] = useState("conductanceRatio"); // "conductanceRatio" | "current"
  const [timeRange, setTimeRange] = useState("30d"); // "30d" | "1y" | "2y"
  const [chartType, setChartType] = useState("line"); // "line" | "bar"
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    fetchRemarks();
    fetchChartData();
  }, [inductorKey, timeRange]);

  const fetchRemarks = async () => {
    try {
      const res = await axios.get(`/api/inductors/remarks/${inductorKey}`);
      if (res.data.success) setRemarksList(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChartData = async () => {
    setLoadingChart(true);
    try {
      const res = await axios.get(`/api/inductors/analytics/${inductorKey}?range=${timeRange}`);
      if (res.data.success) setChartData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleSaveRemark = async (e) => {
    e.preventDefault();
    if (!remarkText.trim()) return;

    try {
      const res = await axios.post("/api/inductors/remarks", {
        inductorKey,
        inductorName: inductorKey.replace("_", " "),
        remark: remarkText,
        category,
      });
      if (res.data.success) {
        setRemarkText("");
        fetchRemarks();
      }
    } catch (err) {
      alert("Error saving remark");
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 max-w-[1500px] mx-auto">
      {/* HEADER WITH BACK BUTTON */}
      <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-cyan-400 uppercase">
            {inductorKey.replace("_", " ")} ANALYTICAL DASHBOARD
          </h1>
          <p className="text-xs text-slate-400">Detailed logs, operational history &amp; graphical trend analytics</p>
        </div>
      </div>

      {/* SECTION 1: REMARK ENTRY & HISTORY TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REMARK ENTRY FORM */}
        <form onSubmit={handleSaveRemark} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-cyan-400">Add Operational Remark</h2>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="General">General</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Greasing">Greasing</option>
              <option value="Inspection">Inspection</option>
            </select>
          </div>

          <textarea
            rows="3"
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            placeholder={`Enter detailed log or remark for ${inductorKey}...`}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500 resize-none"
          ></textarea>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-all"
            >
              <Send size={14} /> Save Remark
            </button>
          </div>
        </form>

        {/* REMARK HISTORY TIMELINE */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 max-h-[300px] overflow-y-auto">
          <h2 className="text-sm font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
            <History size={16} className="text-cyan-400" /> Remark History Logs ({remarksList.length})
          </h2>

          {remarksList.length > 0 ? (
            <div className="space-y-3 relative border-l-2 border-slate-800 ml-3 pl-4">
              {remarksList.map((item) => (
                <div key={item._id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 relative">
                  <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-900"></div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category]}`}>
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock size={10} /> {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">{item.remark}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">No remarks logged yet.</div>
          )}
        </div>
      </div>

      {/* SECTION 2: GRAPHICAL ANALYTICS SECTION */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h2 className="text-sm font-extrabold text-cyan-400 uppercase tracking-wide">
            Graphical Performance Analytics
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* METRIC SELECTION */}
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none"
            >
              <option value="conductanceRatio">Conductance Ratio</option>
              <option value="current">Inductor Current (A)</option>
            </select>

            {/* TIME RANGE TOGGLE */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              {["30d", "1y", "2y"].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 text-xs font-bold rounded-md uppercase transition-all ${
                    timeRange === r ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {r === "30d" ? "30 Days" : r === "1y" ? "1 Year" : "2 Years"}
                </button>
              ))}
            </div>

            {/* CHART TYPE TOGGLE */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setChartType("line")}
                className={`p-1.5 rounded-md ${chartType === "line" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"}`}
              >
                <TrendingUp size={16} />
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`p-1.5 rounded-md ${chartType === "bar" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"}`}
              >
                <BarChart2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* CHART DISPLAY AREA */}
        <div className="h-[380px] w-full pt-4">
          {loadingChart ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">Loading chart analytics...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke={metric === "conductanceRatio" ? "#22d3ee" : "#a855f7"}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                  <Bar
                    dataKey={metric}
                    fill={metric === "conductanceRatio" ? "#22d3ee" : "#a855f7"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}