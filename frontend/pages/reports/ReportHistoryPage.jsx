import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, FileSpreadsheet, Printer, Trash2, Eye, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchReportHistory, deleteReportHistory } from "../../services/reportService.js";
import { fmtDateLong } from "../../utils/rowsConfig.js";
import { SkeletonTable } from "../../components/Skeleton.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import ReportPreviewModal from "../../components/ReportPreviewModal.jsx";
import useAuth from "../../hooks/useAuth.js";
import useToast from "../../hooks/useToast.js";

const formatIcon = { pdf: FileText, excel: FileSpreadsheet, print: Printer };
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Maps a stored reportType to the route + preview-endpoint slug it corresponds to.
const REPORT_ROUTES = {
  "PM Pot Analysis": { path: "/reports/pm-pot", slug: "pm-pot" },
  "Main Pot Analysis": { path: "/reports/main-pot", slug: "main-pot" },
  "Monthly Analysis": { path: "/power/monthly", slug: null },
  "Yearly Analysis": { path: "/power/yearly", slug: null },
};

export default function ReportHistoryPage() {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("all");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [preview, setPreview] = useState(null); // { reportTypeSlug, date, title } | null
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const pageSize = 15;

  const load = async (targetPage = page) => {
    setLoading(true);
    try {
      const data = await fetchReportHistory({
        reportType: reportType === "all" ? undefined : reportType,
        page: targetPage,
        pageSize,
      });
      setHistory(data.history);
      setTotal(data.total);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err) {
      notify(err.response?.data?.message || "Failed to load report history", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const openPreview = (entry) => {
    const route = REPORT_ROUTES[entry.reportType];
    if (!route?.slug || !entry.date) {
      notify("Preview isn't available for this report type — use Download Again instead.", "error");
      return;
    }
    setPreview({ reportTypeSlug: route.slug, date: entry.date, title: entry.reportType });
  };

  const downloadAgain = (entry) => {
    const route = REPORT_ROUTES[entry.reportType];
    if (!route) {
      notify("Unknown report type", "error");
      return;
    }
    if (entry.reportType === "Monthly Analysis" && entry.periodLabel) {
      const [monthName, yearStr] = entry.periodLabel.split(" ");
      const monthIndex = MONTH_NAMES.indexOf(monthName);
      navigate(route.path, { state: { year: Number(yearStr), month: monthIndex + 1, autoDownload: entry.format } });
      return;
    }
    if (entry.reportType === "Yearly Analysis" && entry.periodLabel) {
      navigate(route.path, { state: { year: Number(entry.periodLabel), autoDownload: entry.format } });
      return;
    }
    // Passing autoDownload + the original format lets the target report page
    // generate and immediately trigger the same download again, one click.
    navigate(route.path, { state: { date: entry.date, autoDownload: entry.format } });
  };

  const remove = (entry) => {
    setConfirmDialog({
      title: "Delete this history entry?",
      message: `Removes the log entry for "${entry.reportType}" (${entry.date || entry.periodLabel}). The underlying saved data is not affected.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await deleteReportHistory(entry._id);
          notify("History entry deleted");
          load(page);
        } catch (err) {
          notify(err.response?.data?.message || "Delete failed (Admin role required)", "error");
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-extrabold text-white">Report History</h1>
        <p className="text-xs text-slate-500 mt-1">Every report generated from this dashboard — preview, download again, or delete (Admin).</p>
      </div>

      <div className="flex items-center gap-2.5">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="select-input">
          <option value="all">All Report Types</option>
          <option value="PM Pot Analysis">PM Pot Analysis</option>
          <option value="Main Pot Analysis">Main Pot Analysis</option>
          <option value="Monthly Analysis">Monthly Analysis</option>
          <option value="Yearly Analysis">Yearly Analysis</option>
        </select>
        <span className="text-[11px] text-slate-500">{total} total record{total === 1 ? "" : "s"}</span>
      </div>

      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : history.length === 0 ? (
        <div className="text-sm text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
          No reports generated yet.
        </div>
      ) : (
        <>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-800">
                  <th className="px-4 py-3">Report Type</th>
                  <th className="px-4 py-3">Date / Period</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Generated By</th>
                  <th className="px-4 py-3">Generated Date</th>
                  <th className="px-4 py-3">Generated Time</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const Icon = formatIcon[h.format] || FileText;
                  const gen = new Date(h.generatedTime);
                  return (
                    <tr key={h._id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-sm font-semibold text-white">{h.reportType}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{h.date ? fmtDateLong(h.date) : h.periodLabel || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-400"><span className="inline-flex items-center gap-1.5"><Icon size={13} className="text-cyan-400" /> {h.format?.toUpperCase()}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-400">{h.generatedByName || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{gen.toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{gen.toLocaleTimeString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => openPreview(h)} className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white">
                            <Eye size={12} /> Preview
                          </button>
                          <button onClick={() => downloadAgain(h)} className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                            <Download size={12} /> Download Again
                          </button>
                          {user?.role === "Admin" && (
                            <button onClick={() => remove(h)} className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {preview && (
        <ReportPreviewModal
          reportTypeSlug={preview.reportTypeSlug}
          date={preview.date}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}

      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={async () => { const d = confirmDialog; setConfirmDialog(null); if (d?.onConfirm) await d.onConfirm(); }}
      />
    </div>
  );
}
