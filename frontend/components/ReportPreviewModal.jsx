import React, { useEffect, useState } from "react";
import { X, Sparkles, Zap, Gauge, Activity } from "lucide-react";
import HealthScoreCard from "./HealthScoreCard.jsx";
import ObservationsPanel from "./ObservationsPanel.jsx";
import RecommendationsPanel from "./RecommendationsPanel.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import StatCard from "./StatCard.jsx";
import { fetchReportPreview } from "../services/reportService.js";
import { fmtDateLong } from "../utils/rowsConfig.js";
import useToast from "../hooks/useToast.js";

const TITLE_WORD_COLORS = [
  "text-blue-700",
  "text-rose-700",
  "text-amber-600",
  "text-emerald-700",
  "text-purple-700",
  "text-cyan-700",
  "text-indigo-700",
];

/**
 * Quick read-only preview of a report from the Report History page —
 * Clean Light & Vibrant UI modal layout.
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

  // Title string ko multi-color bold format me dikhane ka function
  const renderColoredTitle = () => {
    if (typeof title !== "string") return title;
    const words = title.trim().split(/\s+/);
    return words.map((word, index) => {
      const colorClass = TITLE_WORD_COLORS[index % TITLE_WORD_COLORS.length];
      return (
        <span key={index} className={`${colorClass} font-black inline-block mr-1.5`}>
          {word}
        </span>
      );
    });
  };

  return (
    <div 
      className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all" 
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-white border-2 border-slate-300 rounded-3xl p-6 md:p-8 shadow-2xl transition-all font-sans text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 mb-5 border-b-2 border-slate-200 gap-4">
          <div>
            <div className="text-base md:text-lg font-black tracking-tight uppercase flex flex-wrap items-center">
              <Sparkles className="w-5 h-5 text-cyan-600 animate-pulse mr-2" />
              {renderColoredTitle()}
            </div>
            <div className="text-xs font-bold text-slate-600 mt-1 flex items-center gap-2">
              <span>Report Date:</span>
              <span className="text-cyan-800 font-black">{fmtDateLong(date)}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 transition-colors cursor-pointer border border-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner label="Loading preview analytics…" />
          </div>
        ) : !report ? (
          <div className="text-xs font-bold text-slate-600 text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
            Preview unavailable for this date.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Health Score Overview */}
            <div>
              <HealthScoreCard 
                score={report.healthScore} 
                status={report.equipmentStatus} 
                statusColor={report.statusColor} 
              />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <StatCard 
                icon={Zap} 
                label="Total Power" 
                value={(report.stats?.totalPower || 0).toFixed(1) + " kW"} 
                accent="text-orange-700" 
              />
              <StatCard 
                icon={Gauge} 
                label="Average PF" 
                value={(report.stats?.avgPF || 0).toFixed(3)} 
                accent="text-cyan-800" 
              />
              <StatCard 
                icon={Activity} 
                label="Average Current" 
                value={(report.stats?.avgCurrent || 0).toFixed(1) + " A"} 
                accent="text-blue-800" 
              />
            </div>

            {/* Diagnostics Panels */}
            <div className="space-y-4 pt-2">
              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200 shadow-xs">
                <ObservationsPanel observations={report.observations} />
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200 shadow-xs">
                <RecommendationsPanel recommendations={report.recommendations} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}