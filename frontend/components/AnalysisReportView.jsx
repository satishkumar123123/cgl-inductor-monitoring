import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import { FileText, FileSpreadsheet, Printer, PlayCircle, Loader2, Sparkles, Calendar } from "lucide-react";
import ReportHeader from "./ReportHeader.jsx";
import ReportSignatureBlock from "./ReportSignatureBlock.jsx";
import ObservationsPanel from "./ObservationsPanel.jsx";
import RecommendationsPanel from "./RecommendationsPanel.jsx";
import ParamReportTable from "./ParamReportTable.jsx";
import ChartCard from "./ChartCard.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { SkeletonCards, SkeletonChart } from "./Skeleton.jsx";
import useAuth from "../hooks/useAuth.js";
import useToast from "../hooks/useToast.js";
import { todayStr, fmtDateLong } from "../utils/rowsConfig.js";
import { exportElementToPdf } from "../utils/pdfExport.js";
import { logReport } from "../services/reportService.js";

/**
 * Shared implementation behind both the PM Pot and Main Pot Analysis Report
 * pages — High Contrast, Ultra-Bold Typography & Vivid Layout.
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
    <div className="flex flex-col gap-6 p-3 md:p-8 max-w-[1600px] mx-auto text-slate-900 bg-slate-100/60 min-h-screen font-sans">
      
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-cyan-600 animate-pulse" />
            <span>{title}</span>
          </h1>
          <p className="text-xs font-bold text-slate-700 mt-1">
            Select a date to generate, analyze, or export industrial telemetry reports with maximum contrast and clarity.
          </p>
        </div>
      </div>

      {/* Control Action Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase font-black tracking-wider text-cyan-950">Select Date</label>
            <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-400 focus-within:border-cyan-600 rounded-xl px-3 py-1.5 transition-all">
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="bg-transparent text-xs font-black text-slate-950 outline-none cursor-pointer" 
              />
              <Calendar size={15} className="text-cyan-800 flex-shrink-0" />
            </div>
          </div>
          <button 
            onClick={generate} 
            disabled={loading} 
            className="mt-5 flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md disabled:opacity-50 transition-all cursor-pointer tracking-wide"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />} GENERATE REPORT
          </button>
        </div>

        <div className="flex items-center gap-2.5 mt-2 md:mt-0">
          <button 
            onClick={downloadPdf} 
            disabled={!report || busy} 
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 active:scale-95 text-rose-950 px-4 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <FileText size={16} className="text-rose-700" /> DOWNLOAD PDF
          </button>
          <button 
            onClick={downloadExcel} 
            disabled={!report} 
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 active:scale-95 text-emerald-950 px-4 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet size={16} className="text-emerald-700" /> EXCEL
          </button>
          <button 
            onClick={printReport} 
            disabled={!report} 
            className="flex items-center gap-2 bg-sky-50 hover:bg-sky-100 border-2 border-sky-300 active:scale-95 text-sky-950 px-4 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <Printer size={16} className="text-sky-700" /> PRINT
          </button>
        </div>
      </div>

      {/* Loading Skeleton View */}
      {loading && (
        <div className="flex flex-col gap-6 my-4">
          <LoadingSpinner label="Compiling high-precision report analytics…" />
          <SkeletonCards count={6} />
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <SkeletonChart /><SkeletonChart />
          </div>
        </div>
      )}

      {/* Main Report Container - Strong High Contrast Bold View */}
      {!loading && report && (
        <div 
          id={elementId} 
          className="bg-white border-2 border-slate-400 rounded-3xl p-6 md:p-10 shadow-2xl transition-all print:border-none print:shadow-none font-bold text-slate-950"
          style={{ WebkitFontSmoothing: "antialiased", textRendering: "optimizeLegibility" }}
        >
          
          <ReportHeader title={title.toUpperCase()} date={report.date} generatedTime={report.generatedTime} generatedBy={report.generatedByName || user?.name} />

          {/* Data Table Container with Sharp High Contrast Borders */}
          <div className="my-8 rounded-2xl overflow-hidden border-2 border-slate-400 shadow-md bg-white text-slate-950 font-black">
            <ParamReportTable entries={report.entries} />
          </div>

          {/* Diagnostics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="bg-slate-50/90 rounded-2xl p-4 border-2 border-slate-300 shadow-xs">
              <ObservationsPanel observations={report.observations} />
            </div>
            <div className="bg-slate-50/90 rounded-2xl p-4 border-2 border-slate-300 shadow-xs">
              <RecommendationsPanel recommendations={report.recommendations} />
            </div>
          </div>

          {/* Telemetry Visual Trend Analysis */}
          <div className="my-8">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 mb-4 flex items-center gap-2 border-b-2 border-slate-300 pb-2">
              <span className="text-cyan-600">▍</span> TELEMETRY VISUAL TREND ANALYSIS
            </h3>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <ChartCard title={<span className="font-black text-slate-950 uppercase text-xs">Power Comparison (kW)</span>}>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={report.entries}>
                    <CartesianGrid stroke="#94a3b8" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#020617", fontSize: 11, fontWeight: 900 }} interval={0} angle={-15} textAnchor="end" height={45} />
                    <YAxis tick={{ fill: "#020617", fontSize: 11, fontWeight: 900 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", color: "#ffffff", borderRadius: "8px", fontWeight: "bold" }} />
                    <Bar dataKey="power" name="Power (kW)" fill="#ea580c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={<span className="font-black text-slate-950 uppercase text-xs">Voltage Comparison (V)</span>}>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={report.entries}>
                    <CartesianGrid stroke="#94a3b8" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#020617", fontSize: 11, fontWeight: 900 }} interval={0} angle={-15} textAnchor="end" height={45} />
                    <YAxis tick={{ fill: "#020617", fontSize: 11, fontWeight: 900 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", color: "#ffffff", borderRadius: "8px", fontWeight: "bold" }} />
                    <Bar dataKey="inductorVoltage" name="Voltage (V)" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={<span className="font-black text-slate-950 uppercase text-xs">Phase Current Comparison (A)</span>}>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={report.entries}>
                    <CartesianGrid stroke="#94a3b8" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#020617", fontSize: 11, fontWeight: 900 }} interval={0} angle={-15} textAnchor="end" height={45} />
                    <YAxis tick={{ fill: "#020617", fontSize: 11, fontWeight: 900 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", color: "#ffffff", borderRadius: "8px", fontWeight: "bold" }} />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: "bold" }} />
                    <Bar dataKey="rPhase" name="R Phase" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="yPhase" name="Y Phase" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bPhase" name="B Phase" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={<span className="font-black text-slate-950 uppercase text-xs">Power Factor (PF)</span>}>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={report.entries}>
                    <CartesianGrid stroke="#94a3b8" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#020617", fontSize: 11, fontWeight: 900 }} interval={0} angle={-15} textAnchor="end" height={45} />
                    <YAxis tick={{ fill: "#020617", fontSize: 11, fontWeight: 900 }} domain={[0, 1]} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", color: "#ffffff", borderRadius: "8px", fontWeight: "bold" }} />
                    <Bar dataKey="inductorPF" name="Inductor PF" fill="#0d9488" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={<span className="font-black text-slate-950 uppercase text-xs">Inductor Apparent Power (KVA)</span>}>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={report.entries}>
                    <CartesianGrid stroke="#94a3b8" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#020617", fontSize: 11, fontWeight: 900 }} interval={0} angle={-15} textAnchor="end" height={45} />
                    <YAxis tick={{ fill: "#020617", fontSize: 11, fontWeight: 900 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", color: "#ffffff", borderRadius: "8px", fontWeight: "bold" }} />
                    <Bar dataKey="inductorKVA" name="Inductor KVA" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>

          {/* Remarks Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-300">
              <label className="text-xs font-black uppercase tracking-wider text-slate-950 mb-2 block">Operator Remarks</label>
              <textarea 
                value={operatorRemarks} 
                onChange={(e) => setOperatorRemarks(e.target.value)} 
                rows={3} 
                className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-xs font-black text-slate-950 outline-none focus:border-cyan-600 transition-colors resize-none shadow-xs" 
                placeholder="Shift observations and operator notes…" 
              />
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-300">
              <label className="text-xs font-black uppercase tracking-wider text-slate-950 mb-2 block">Engineer Remarks</label>
              <textarea 
                value={engineerRemarks} 
                onChange={(e) => setEngineerRemarks(e.target.value)} 
                rows={3} 
                className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-xs font-black text-slate-950 outline-none focus:border-cyan-600 transition-colors resize-none shadow-xs" 
                placeholder="Technical evaluations and maintenance review notes…" 
              />
            </div>
          </div>

          {/* Signatures & Footer */}
          <ReportSignatureBlock />

          <div className="text-center text-xs font-black text-slate-800 mt-10 pt-4 border-t-2 border-slate-300">
            Generated automatically via <span className="text-slate-950 font-black">CGL Dashboard System</span>
          </div>
        </div>
      )}
    </div>
  );
}