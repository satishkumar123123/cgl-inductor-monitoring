import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import { FileText, FileSpreadsheet, Printer, PlayCircle, Loader2, Sparkles } from "lucide-react";
import ReportHeader from "./ReportHeader.jsx";
import ReportSignatureBlock from "./ReportSignatureBlock.jsx";
import ObservationsPanel from "./ObservationsPanel.jsx";
import RecommendationsPanel from "./RecommendationsPanel.jsx";
import ParamReportTable from "./ParamReportTable.jsx";
import ChartCard, { chartTheme } from "./ChartCard.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { SkeletonCards, SkeletonChart } from "./Skeleton.jsx";
import useAuth from "../hooks/useAuth.js";
import useToast from "../hooks/useToast.js";
import { todayStr, fmtDateLong } from "../utils/rowsConfig.js";
import { exportElementToPdf } from "../utils/pdfExport.js";
import { logReport } from "../services/reportService.js";

/**
 * Shared implementation behind both the PM Pot and Main Pot Analysis Report
 * pages (Modules 1 & 2) — updated for enhanced UI & tailored metric display.
 */
export default function AnalysisReportView({ title, reportType, elementId, fetchReport }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [date, setDate] = useState(location.state?.date || todayStr());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [operatorRemarks, setOperatorRemarks] = useState("");
  const [engineerRemarks, setEngineerRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingAutoDownload, setPendingAutoDownload] = useState(location.state?.autoDownload || null);

  const generate = async () => {
    setLoading(true);
    setReport(null);
    try {
      const data = await fetchReport(date);
      setReport(data);
    } catch (err) {
      notify(err.response?.data?.message || "No saved data found for this date", "error");
    } finally {
      setLoading(false);
    }
  };

  const log = async (format) => {
    try {
      await logReport({
        reportType, date, format,
        stats: report?.stats,
        observations: report?.observations,
        healthScore: report?.healthScore,
        equipmentStatus: report?.equipmentStatus,
        recommendations: report?.recommendations,
      });
    } catch {
      /* non-blocking */
    }
  };

  const downloadPdf = async () => {
    if (!report) return;
    setBusy(true);
    try {
      await exportElementToPdf(elementId, `${reportType.replace(/\s+/g, "_")}_${date}.pdf`);
      await log("pdf");
      notify("PDF downloaded successfully!");
    } catch (err) {
      notify("PDF export failed: " + err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const downloadExcel = async () => {
    if (!report) return;
    const wb = XLSX.utils.book_new();
    const header = ["Parameter", ...report.entries.map((e) => e.label)];
    const rowIds = ["rPhase", "yPhase", "bPhase", "inductorVoltage", "lineCurrent", "linePF", "power", "inductorCurrent", "impedanceZ", "resistanceR", "reactanceX", "inductorPF", "inductorKVA", "conductanceInitial", "conductanceRatio", "kvarConnected", "balancingKvar"];
    const rowLabels = ["R Phase Current", "Y Phase Current", "B Phase Current", "Inductor Voltage", "Line Load Current", "Line PF", "Power", "Inductor Current", "Impedance", "Resistance", "Reactance", "Inductor PF", "Inductor KVA", "Conductance Initial", "Conductance Ratio", "KVAR Connected", "Balancing KVAR"];
    const body = rowIds.map((id, i) => [rowLabels[i], ...report.entries.map((e) => e[id])]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header, ...body]), "Readings");

    // Excel summary Sheet without removed metrics
    const summarySheet = [
      ["Report", reportType],
      ["Date", fmtDateLong(date)],
      ["Equipment Status", report.equipmentStatus],
      [],
      ["Observations", "Severity"],
      ...report.observations.map((o) => [o.message, o.severity]),
      [],
      ["Recommendations"],
      ...report.recommendations.map((r) => [r]),
      [],
      ["Operator Remarks", operatorRemarks],
      ["Engineer Remarks", engineerRemarks],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheet), "Summary");
    XLSX.writeFile(wb, `${reportType.replace(/\s+/g, "_")}_${date}.xlsx`);
    await log("excel");
    notify("Excel downloaded successfully!");
  };

  const printReport = async () => {
    window.print();
    await log("print");
  };

  useEffect(() => {
    if (location.state?.autoDownload) {
      generate();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!report || !pendingAutoDownload) return;
    if (pendingAutoDownload === "pdf") downloadPdf();
    else if (pendingAutoDownload === "excel") downloadExcel();
    else if (pendingAutoDownload === "print") printReport();
    setPendingAutoDownload(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report]);

  return (
    <div className="flex flex-col gap-6 p-2 md:p-4 max-w-[1600px] mx-auto text-slate-100 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
            {title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Select a date to generate, analyze, or export industrial telemetry reports.</p>
        </div>
      </div>

      {/* Control Action Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl transition-all">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Select Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-white outline-none shadow-inner transition-colors" 
            />
          </div>
          <button 
            onClick={generate} 
            disabled={loading} 
            className="mt-4 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <PlayCircle size={15} />} Generate
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button 
            onClick={downloadPdf} 
            disabled={!report || busy} 
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer shadow-sm"
          >
            <FileText size={14} className="text-red-400" /> PDF
          </button>
          <button 
            onClick={downloadExcel} 
            disabled={!report} 
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer shadow-sm"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" /> Excel
          </button>
          <button 
            onClick={printReport} 
            disabled={!report} 
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer shadow-sm"
          >
            <Printer size={14} className="text-sky-400" /> Print
          </button>
        </div>
      </div>

      {/* Loading Skeleton View */}
      {loading && (
        <div className="flex flex-col gap-6 my-4">
          <LoadingSpinner label="Compiling report analytics…" />
          <SkeletonCards count={6} />
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <SkeletonChart /><SkeletonChart />
          </div>
        </div>
      )}

      {/* Main Report Container */}
      {!loading && report && (
        <div id={elementId} className="bg-slate-950/90 border border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md transition-all">
          
          <ReportHeader title={title.toUpperCase()} date={report.date} generatedTime={report.generatedTime} generatedBy={report.generatedByName || user?.name} />

          {/* Data Table */}
          <div className="my-6 rounded-2xl overflow-hidden border border-slate-800/80 shadow-lg bg-slate-900/40">
            <ParamReportTable entries={report.entries} />
          </div>

          {/* Diagnostics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <ObservationsPanel observations={report.observations} />
            <RecommendationsPanel recommendations={report.recommendations} />
          </div>

          {/* Graphical Analysis */}
          <div className="grid gap-5 my-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <ChartCard title="Power Comparison">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={report.entries}>
                  <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ ...chartTheme.tick, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={45} />
                  <YAxis tick={chartTheme.tick} />
                  <Tooltip {...chartTheme.tooltip} />
                  <Bar dataKey="power" name="Power (kW)" fill="#F97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Voltage Comparison">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={report.entries}>
                  <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ ...chartTheme.tick, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={45} />
                  <YAxis tick={chartTheme.tick} />
                  <Tooltip {...chartTheme.tooltip} />
                  <Bar dataKey="inductorVoltage" name="Voltage (V)" fill="#22D3EE" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Phase Current Comparison">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={report.entries}>
                  <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ ...chartTheme.tick, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={45} />
                  <YAxis tick={chartTheme.tick} />
                  <Tooltip {...chartTheme.tooltip} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="rPhase" name="R Phase" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="yPhase" name="Y Phase" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bPhase" name="B Phase" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Power Factor (PF)">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={report.entries}>
                  <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ ...chartTheme.tick, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={45} />
                  <YAxis tick={chartTheme.tick} domain={[0, 1]} />
                  <Tooltip {...chartTheme.tooltip} />
                  <Bar dataKey="inductorPF" name="Inductor PF" fill="#14B8A6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Inductor Apparent Power (KVA)">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={report.entries}>
                  <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ ...chartTheme.tick, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={45} />
                  <YAxis tick={chartTheme.tick} />
                  <Tooltip {...chartTheme.tooltip} />
                  <Bar dataKey="inductorKVA" name="Inductor KVA" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Remarks Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Operator Remarks</label>
              <textarea 
                value={operatorRemarks} 
                onChange={(e) => setOperatorRemarks(e.target.value)} 
                rows={3} 
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors resize-none" 
                placeholder="Shift observations and operator notes…" 
              />
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Engineer Remarks</label>
              <textarea 
                value={engineerRemarks} 
                onChange={(e) => setEngineerRemarks(e.target.value)} 
                rows={3} 
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors resize-none" 
                placeholder="Technical evaluations and maintenance review notes…" 
              />
            </div>
          </div>

          {/* Signatures & Footer */}
          <ReportSignatureBlock />

          <div className="text-center text-[11px] font-medium text-slate-500 mt-8 pt-4 border-t border-slate-800/80">
            Generated automatically via <span className="text-slate-300 font-bold">CGL Dashboard System</span>
          </div>
        </div>
      )}
    </div>
  );
}