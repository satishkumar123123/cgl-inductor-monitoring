import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import { ArrowLeft, Send, History, Clock, User, BarChart2, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import axios from "axios";

const CATEGORY_COLORS = {
  Maintenance: "bg-red-100 text-red-700 border-red-200",
  Greasing: "bg-amber-100 text-amber-700 border-amber-200",
  Inspection: "bg-purple-100 text-purple-700 border-purple-200",
  General: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

export default function InductorDetailPage() {
  const { inductorKey } = useParams();
  const navigate = useNavigate();

  // Remark States
  const [remarkText, setRemarkText] = useState("");
  const [category, setCategory] = useState("General");
  const [remarksList, setRemarksList] = useState([]);

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
      if (res.data.success) setRemarksList(res.data.data);
    } catch (err) {
      console.error("Remarks Fetch Error:", err);
    }
  };

  const fetchChartData = async () => {
    setLoadingChart(true);
    try {
      const res = await axios.get(`/api/inductors/analytics/${inductorKey}?range=${timeRange}`);
      if (res.data.success) setChartData(res.data.data);
    } catch (err) {
      console.error("Chart Fetch Error:", err);
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
        inductorName: inductorKey ? inductorKey.replace("_", " ") : "Inductor",
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

  const formattedTitle = inductorKey ? inductorKey.replace("_", " ") : "INDUCTOR";

  return (
    <div className="p-6 space-y-6 text-slate-900 bg-white min-h-screen max-w-[1500px] mx-auto font-sans">
      {/* HEADER WITH BACK BUTTON */}
      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-cyan-700 uppercase">
            {formattedTitle} ANALYTICAL DASHBOARD
          </h1>
          <p className="text-xs text-slate-500">Detailed logs, operational history &amp; graphical trend analytics</p>
        </div>
      </div>

      {/* SECTION 1: REMARK ENTRY & HISTORY TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSaveRemark} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-cyan-700">Add Operational Remark</h2>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1 text-xs text-slate-800 outline-none focus:border-cyan-600"
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
            placeholder={`Enter detailed log or remark for ${formattedTitle}...`}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-cyan-600 resize-none"
          ></textarea>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm"
            >
              <Send size={14} /> Save Remark
            </button>
          </div>
        </form>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-h-[300px] overflow-y-auto shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
            <History size={16} className="text-cyan-600" /> Remark History Logs ({remarksList.length})
          </h2>

          {remarksList.length > 0 ? (
            <div className="space-y-3 relative border-l-2 border-slate-200 ml-3 pl-4">
              {remarksList.map((item) => (
                <div key={item._id} className="bg-white border border-slate-200 rounded-xl p-3 relative shadow-sm">
                  <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-cyan-600 border-2 border-white"></div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.General}`}>
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock size={10} /> {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 mt-1">{item.remark}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">No remarks logged yet.</div>
          )}
        </div>
      </div>

      {/* SECTION 2: GRAPHICAL ANALYTICS SECTION */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <h2 className="text-sm font-extrabold text-cyan-700 uppercase tracking-wide">
            Graphical Performance Analytics
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-cyan-600"
            >
              <option value="conductanceRatio">Conductance Ratio</option>
              <option value="current">Inductor Current (A)</option>
            </select>

            <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              {["30d", "1y", "2y"].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 text-xs font-bold rounded-md uppercase transition-all ${
                    timeRange === r ? "bg-cyan-600 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r === "30d" ? "30 Days" : r === "1y" ? "1 Year" : "2 Years"}
                </button>
              ))}
            </div>

            <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <button
                onClick={() => setChartType("line")}
                className={`p-1.5 rounded-md ${chartType === "line" ? "bg-cyan-100 text-cyan-700" : "text-slate-500"}`}
              >
                <TrendingUp size={16} />
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`p-1.5 rounded-md ${chartType === "bar" ? "bg-cyan-100 text-cyan-700" : "text-slate-500"}`}
              >
                <BarChart2 size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="h-[380px] w-full pt-4">
          {loadingChart ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">Loading chart analytics...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }} />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke={metric === "conductanceRatio" ? "#0891b2" : "#9333ea"}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }} />
                  <Bar
                    dataKey={metric}
                    fill={metric === "conductanceRatio" ? "#0891b2" : "#9333ea"}
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