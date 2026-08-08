import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, FileSpreadsheet, PenLine, ExternalLink, RefreshCw } from "lucide-react";
import { fetchHistory } from "../services/dataService.js";
import { fmtDateLong } from "../utils/rowsConfig.js";
import { SkeletonTable } from "../components/Skeleton.jsx";
import useToast from "../hooks/useToast.js";

const statusColor = {
  Excellent: "text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold",
  Normal: "text-cyan-700 bg-cyan-50 border-cyan-200 font-semibold",
  "Needs Attention": "text-red-700 bg-red-50 border-red-200 font-semibold",
};

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const toast = useToast();
  const navigate = useNavigate();

  // SAFE FETCH FUNCTION WITH FLEXIBLE RESPONSE PARSING
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchHistory({ 
        search: search || undefined, 
        from: from || undefined, 
        to: to || undefined 
      });

      // Handle direct array OR nested data array
      let historyList = [];
      if (Array.isArray(response)) {
        historyList = response;
      } else if (response && Array.isArray(response.data)) {
        historyList = response.data;
      } else if (response && Array.isArray(response.history)) {
        historyList = response.history;
      }

      setRecords(historyList);
    } catch (err) {
      console.error("Failed to load history:", err);
      if (toast?.notify) {
        toast.notify(err.response?.data?.message || "Failed to load history", "error");
      }
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [search, from, to, toast]);

  useEffect(() => {
    load();
  }, [load]);

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
    <div className="flex flex-col gap-5 p-6 bg-white min-h-screen text-slate-900 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900">Saved Readings — History</h1>
          <p className="text-xs text-slate-500 mt-1">Search by date, source, status, or remarks.</p>
        </div>
        <button 
          onClick={load} 
          className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-cyan-600" : "text-slate-500"} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5">
          <Search size={13} className="text-slate-400" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search date, status, remarks…" 
            className="bg-transparent outline-none text-xs w-56 text-slate-800 placeholder:text-slate-400" 
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-500" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="select-input bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800" />
          <span className="text-slate-500 text-xs">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="select-input bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800" />
        </div>
        <button onClick={load} className="toolbar-btn-primary bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm">Apply Filters</button>
      </div>

      {loading ? (
        SkeletonTable ? (
          <SkeletonTable rows={7} cols={7} />
        ) : (
          <div className="p-8 text-slate-500 text-sm text-center">Loading history data...</div>
        )
      ) : records.length === 0 ? (
        <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          No saved records found in database.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase text-slate-500 bg-slate-50 border-b border-slate-200 font-bold">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.map((r, index) => {
                const currentStatus = r?.status || "Normal";
                const badgeStyle = statusColor[currentStatus] || statusColor.Normal;

                return (
                  <tr key={r?.date || r?._id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {safeFormatDate(r?.date)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        {r?.source === "excel" ? (
                          <FileSpreadsheet size={13} className="text-cyan-600" />
                        ) : (
                          <PenLine size={13} className="text-blue-600" />
                        )}
                        {r?.source === "excel" ? r?.uploadedFileName || "Excel" : "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{r?.createdByName || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10.5px] px-2 py-1 rounded-full border ${badgeStyle}`}>
                        {currentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[240px] truncate">{r?.remarks || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {r?.lastUpdated ? new Date(r.lastUpdated).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate("/dashboard", { state: { date: r?.date } })}
                        className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-bold transition-colors"
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