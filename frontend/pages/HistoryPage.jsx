import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, FileSpreadsheet, PenLine, ExternalLink } from "lucide-react";
import { fetchHistory } from "../services/dataService.js";
import { fmtDateLong } from "../utils/rowsConfig.js";
import { SkeletonTable } from "../components/Skeleton.jsx";
import useToast from "../hooks/useToast.js";

const statusColor = {
  Excellent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Normal: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  "Needs Attention": "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Hook rules: Always call hooks at top level (never inside try-catch)
  const toast = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory({ 
        search: search || undefined, 
        from: from || undefined, 
        to: to || undefined 
      });
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      if (toast?.notify) {
        toast.notify(err.response?.data?.message || "Failed to load history", "error");
      }
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safe Date Formatting
  const safeFormatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return typeof fmtDateLong === "function" ? fmtDateLong(dateStr) : dateStr;
    } catch (e) {
      return String(dateStr);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-extrabold text-white">Saved Readings — History</h1>
        <p className="text-xs text-slate-500 mt-1">Search by date, source, status, or remarks.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-700 rounded-lg px-2.5 py-1.5">
          <Search size={13} className="text-slate-500" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search date, status, remarks…" 
            className="bg-transparent outline-none text-xs w-56 text-slate-200 placeholder:text-slate-500" 
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-500" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="select-input" />
          <span className="text-slate-500 text-xs">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="select-input" />
        </div>
        <button onClick={load} className="toolbar-btn-primary">Apply Filters</button>
      </div>

      {loading ? (
        SkeletonTable ? (
          <SkeletonTable rows={7} cols={7} />
        ) : (
          <div className="p-8 text-slate-400 text-sm">Loading history data...</div>
        )
      ) : records.length === 0 ? (
        <div className="text-sm text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
          No saved records match your filters.
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-800">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, index) => {
                const currentStatus = r?.status || "Normal";
                const badgeStyle = statusColor[currentStatus] || statusColor.Normal;

                return (
                  <tr key={r?.date || r?._id || index} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-sm font-semibold text-white whitespace-nowrap">
                      {safeFormatDate(r?.date)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-slate-400">
                        {r?.source === "excel" ? (
                          <FileSpreadsheet size={13} className="text-cyan-400" />
                        ) : (
                          <PenLine size={13} className="text-blue-400" />
                        )}
                        {r?.source === "excel" ? r?.uploadedFileName || "Excel" : "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{r?.createdByName || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10.5px] px-2 py-1 rounded-full border ${badgeStyle}`}>
                        {currentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[240px] truncate">{r?.remarks || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {r?.lastUpdated ? new Date(r.lastUpdated).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate("/dashboard", { state: { date: r?.date } })}
                        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Open <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}