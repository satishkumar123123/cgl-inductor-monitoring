import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import HealthScoreCard from "./HealthScoreCard.jsx";
import ObservationsPanel from "./ObservationsPanel.jsx";
import RecommendationsPanel from "./RecommendationsPanel.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import StatCard from "./StatCard.jsx";
import { fetchReportPreview } from "../services/reportService.js";
import { fmtDateLong } from "../utils/rowsConfig.js";
import { Zap, Gauge, Activity } from "lucide-react";
import useToast from "../hooks/useToast.js";

/**
 * Quick read-only preview of a report from the Report History page — no
 * navigation, no download, just the key figures. Reuses the same
 * HealthScoreCard / ObservationsPanel / RecommendationsPanel components the
 * full report pages use.
 */
export default function ReportPreviewModal({ reportTypeSlug, date, title, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReportPreview(reportTypeSlug, date)
      .then((data) => { if (!cancelled) setReport(data); })
      .catch((err) => notify(err.response?.data?.message || "Failed to load preview", "error"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportTypeSlug, date]);

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/70 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-white">{title}</div>
            <div className="text-xs text-slate-500">{fmtDateLong(date)}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading preview…" />
        ) : !report ? (
          <div className="text-sm text-slate-500 text-center py-8">Preview unavailable.</div>
        ) : (
          <>
            <div className="mb-4">
              <HealthScoreCard score={report.healthScore} status={report.equipmentStatus} statusColor={report.statusColor} />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatCard icon={Zap} label="Total Power" value={report.stats.totalPower.toFixed(1) + " kW"} accent="text-orange-400" />
              <StatCard icon={Gauge} label="Average PF" value={report.stats.avgPF.toFixed(3)} accent="text-cyan-400" />
              <StatCard icon={Activity} label="Average Current" value={report.stats.avgCurrent.toFixed(1) + " A"} accent="text-blue-400" />
            </div>
            <ObservationsPanel observations={report.observations} />
            <RecommendationsPanel recommendations={report.recommendations} />
          </>
        )}
      </div>
    </div>
  );
}
