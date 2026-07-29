import React, { useEffect, useState } from "react";
import { ShieldAlert, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { fetchAuditLogs } from "../services/auditService.js";
import { SkeletonTable } from "../components/Skeleton.jsx";
import useAuth from "../hooks/useAuth.js";
import useToast from "../hooks/useToast.js";

const METHOD_COLOR = {
  POST: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  PUT: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  PATCH: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  DELETE: "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function AuditLogPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const pageSize = 25;

  const load = async (targetPage = 1) => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs({
        user: userFilter || undefined,
        method: methodFilter || undefined,
        page: targetPage,
        pageSize,
      });
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err) {
      notify(err.response?.data?.message || "Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (user?.role !== "Admin") {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
        <ShieldAlert size={28} className="text-orange-400 mx-auto mb-3" />
        <div className="text-sm font-bold text-white mb-1">Admin access required</div>
        <div className="text-xs text-slate-500">Audit logs are only visible to Admin accounts.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-extrabold text-white">Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">Every create/update/delete action across the dashboard, logged automatically.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-700 rounded-lg px-2.5 py-1.5">
          <Search size={13} className="text-slate-500" />
          <input value={userFilter} onChange={(e) => setUserFilter(e.target.value)} placeholder="Filter by user…" className="bg-transparent outline-none text-xs w-40" />
        </div>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="select-input">
          <option value="">All Methods</option>
          <option value="POST">POST (Create)</option>
          <option value="PUT">PUT (Update)</option>
          <option value="DELETE">DELETE</option>
        </select>
        <button onClick={() => load(1)} className="toolbar-btn-primary">Apply</button>
        <span className="text-[11px] text-slate-500 ml-auto">{total} total entries</span>
      </div>

      {loading ? (
        <SkeletonTable rows={10} cols={6} />
      ) : logs.length === 0 ? (
        <div className="text-sm text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
          No audit log entries match the current filters.
        </div>
      ) : (
        <>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-800">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Path</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-xs font-semibold text-white">{l.userName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10.5px] px-2 py-1 rounded-full border ${METHOD_COLOR[l.method] || "text-slate-400 bg-slate-500/10 border-slate-500/30"}`}>{l.method}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{l.path}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{l.statusCode}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{l.ip}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => load(page - 1)} disabled={page <= 1} className="toolbar-btn disabled:opacity-40">
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
              <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="toolbar-btn disabled:opacity-40">
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
