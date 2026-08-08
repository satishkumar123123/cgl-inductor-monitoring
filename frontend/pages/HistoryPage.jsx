import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, FileSpreadsheet, PenLine, ExternalLink, RefreshCw, Filter, User, Sparkles } from "lucide-react";
import { fetchHistory } from "../services/dataService.js";
import { fmtDateLong } from "../utils/rowsConfig.js";
import { SkeletonTable } from "../components/Skeleton.jsx";
import useToast from "../hooks/useToast.js";

const statusColor = {
  Excellent: "text-emerald-700 bg-emerald-100/80 border-emerald-300 font-extrabold shadow-sm",
  Normal: "text-cyan-700 bg-cyan-100/80 border-cyan-300 font-extrabold shadow-sm",
  "Needs Attention": "text-rose-700 bg-rose-100/80 border-rose-300 font-extrabold shadow-sm",
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
    <div className="flex flex-col gap-6 p-6 bg-white min-h-screen text-slate-900 font-sans">
      
      {/* PAGE HEADER WITH MULTI-COLOR ACCENTS */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-wide flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
            <span className="text-cyan-600">Saved</span>{" "}
            <span className="text-amber-600">Readings</span> —{" "}
            <span className="text-emerald-600">History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Search and manage historical log entries by date, source, status, or remarks.
          </p>
        </div>
        <button 
          onClick={load} 
          className="px-4 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 border border-cyan-300 text-cyan-800 rounded-xl transition-all flex items-center gap-2 text-xs font-bold shadow-sm active:scale-95 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-cyan-600" : "text-cyan-600"} /> 
          Refresh Data
        </button>
      </div>

      {/* MULTI-COLOR ATTRACTIVE FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-white border border-slate-300 focus-within:border-indigo-500 rounded-xl px-3 py-2 shadow-inner transition-colors">
            <Search size={14} className="text-indigo-500" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search date, status, remarks…" 
              className="bg-transparent outline-none text-xs w-60 text-slate-800 font-semibold placeholder:text-slate-400" 
            />
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-inner">
            <Calendar size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-500 uppercase text-[10px]">From</span>
            <input 
              type="date" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
              className="bg-transparent outline-none text-xs text-slate-800 font-bold cursor-pointer" 
            />
            <span className="text-slate-400 font-bold text-xs">to</span>
            <input 
              type="date" 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              className="bg-transparent outline-none text-xs text-slate-800 font-bold cursor-pointer" 
            />
          </div>
        </div>

        {/* Apply Filters Button */}
        <button 
          onClick={load} 
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Filter size={14} /> Apply Filters
        </button>
      </div>

      {/* TABLE / LOADING / EMPTY STATE */}
      {loading ? (
        SkeletonTable ? (
          <SkeletonTable rows={7} cols={7} />
        ) : (
          <div className="p-8 text-slate-500 text-sm text-center">Loading history data...</div>
        )
      ) : records.length === 0 ? (
        <div className="text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          No saved records found matching your query.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase bg-slate-100/80 border-b border-slate-200 font-black tracking-wider">
                <th className="px-4 py-3 text-cyan-800">Date</th>
                <th className="px-4 py-3 text-purple-800">Source</th>
                <th className="px-4 py-3 text-blue-800">Created By</th>
                <th className="px-4 py-3 text-emerald-800">Status</th>
                <th className="px-4 py-3 text-amber-800">Remarks</th>
                <th className="px-4 py-3 text-slate-600">Last Updated</th>
                <th className="px-4 py-3 text-right text-rose-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {records.map((r, index) => {
                const currentStatus = r?.status || "Normal";
                const badgeStyle = statusColor[currentStatus] || statusColor.Normal;

                return (
                  <tr key={r?.date || r?._id || index} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Date Field (Cyan Highlight) */}
                    <td className="px-4 py-3.5 text-sm font-black text-cyan-700 whitespace-nowrap">
                      {safeFormatDate(r?.date)}
                    </td>

                    {/* Source Field (Excel = Emerald Badge, Manual = Purple Badge) */}
                    <td className="px-4 py-3.5 text-xs font-semibold">
                      {r?.source === "excel" ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <FileSpreadsheet size={13} className="text-emerald-600" />
                          <span className="truncate max-w-[140px]">{r?.uploadedFileName || "Excel Import"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg">
                          <PenLine size={13} className="text-purple-600" />
                          Manual Entry
                        </span>
                      )}
                    </td>

                    {/* Created By (Blue Badge) */}
                    <td className="px-4 py-3.5 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                        <User size={12} className="text-blue-500" />
                        {r?.createdByName || "System Admin"}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      <span className={`text-[10.5px] px-3 py-1 rounded-full border ${badgeStyle}`}>
                        {currentStatus}
                      </span>
                    </td>

                    {/* Remarks Field (Amber Highlight) */}
                    <td className="px-4 py-3.5 text-xs text-amber-900 font-semibold max-w-[240px] truncate">
                      {r?.remarks ? (
                        <span className="bg-amber-50/80 border border-amber-200/80 px-2.5 py-1 rounded-lg block truncate">
                          {r.remarks}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No remarks</span>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td className="px-4 py-3.5 text-xs font-medium text-slate-500 whitespace-nowrap">
                      {r?.lastUpdated ? new Date(r.lastUpdated).toLocaleString() : "—"}
                    </td>

                    {/* Actions Button (Rose / Pink Highlight) */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => navigate("/dashboard", { state: { date: r?.date } })}
                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
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