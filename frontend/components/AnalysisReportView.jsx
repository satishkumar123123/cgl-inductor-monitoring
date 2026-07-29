import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import * as XLSX from "xlsx";
import { FileText, FileSpreadsheet, Printer, PlayCircle, Loader2 } from "lucide-react";
import ReportHeader from "./ReportHeader.jsx";
import ReportSignatureBlock from "./ReportSignatureBlock.jsx";
import HealthScoreCard from "./HealthScoreCard.jsx";
import ObservationsPanel from "./ObservationsPanel.jsx";
import RecommendationsPanel from "./RecommendationsPanel.jsx";
import ParamReportTable from "./ParamReportTable.jsx";
import ChartCard, { chartTheme } from "./ChartCard.jsx";
import StatCard from "./StatCard.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { SkeletonCards, SkeletonChart } from "./Skeleton.jsx";
import useAuth from "../hooks/useAuth.js";
import useToast from "../hooks/useToast.js";
import { todayStr, fmtDateLong } from "../utils/rowsConfig.js";
import { exportElementToPdf } from "../utils/pdfExport.js";
import { logReport } from "../services/reportService.js";
import { Gauge, Zap, Activity, TrendingUp, TrendingDown } from "lucide-react";

/**
 * Shared implementation behind both the PM Pot and Main Pot Analysis Report
 * pages (Modules 1 & 2) — same functionality, different data source.
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
      notify("PDF downloaded");
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
      ["Equipment Health Score", report.healthScore + " / 100"],
      ["Equipment Status", report.equipmentStatus],
      ["Average Current", report.stats.avgCurrent.toFixed(2)],
      ["Average Voltage", report.stats.avgVoltage.toFixed(2)],
      ["Average Power", report.stats.avgPower.toFixed(2)],
      ["Average PF", report.stats.avgPF.toFixed(3)],
      ["Total Power", report.stats.totalPower.toFixed(2)],
      ["Maximum Current", report.stats.maxCurrent ? `${report.stats.maxCurrent.value.toFixed(2)} (${report.stats.maxCurrent.label})` : "—"],
      ["Minimum Current", report.stats.minCurrent ? `${report.stats.minCurrent.value.toFixed(2)} (${report.stats.minCurrent.label})` : "—"],
      ["Highest Power Inductor", report.stats.highestPowerInductor ? `${report.stats.highestPowerInductor.label} (${report.stats.highestPowerInductor.value.toFixed(2)} kW)` : "—"],
      ["Lowest Power Inductor", report.stats.lowestPowerInductor ? `${report.stats.lowestPowerInductor.label} (${report.stats.lowestPowerInductor.value.toFixed(2)} kW)` : "—"],
      ["Current Balance %", report.stats.currentBalancePercent],
      ["Voltage Balance %", report.stats.voltageBalancePercent],
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
    notify("Excel downloaded");
  };

  const printReport = async () => {
    window.print();
    await log("print");
  };

  // "Download Again" from Report History arrives with { date, autoDownload }
  // in navigation state — generate immediately, then fire the matching
  // download once the report data is in.
  useEffect(() => {
    if (location.state?.autoDownload) {
      generate();
      navigate(location.pathname, { replace: true, state: {} }); // don't re-trigger on refresh/back
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
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-extrabold text-white">{title}</h1>
        <p className="text-xs text-slate-500 mt-1">Select a saved date, generate the report, then preview, print, or download.</p>
      </div>

      <div className="no-print flex flex-wrap items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-slate-500">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-950/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white" />
        </div>
        <button onClick={generate} disabled={loading} className="toolbar-btn-primary">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />} Generate Report
        </button>
        <button onClick={downloadPdf} disabled={!report || busy} className="toolbar-btn"><FileText size={14} /> Download PDF</button>
        <button onClick={downloadExcel} disabled={!report} className="toolbar-btn"><FileSpreadsheet size={14} /> Download Excel</button>
        <button onClick={printReport} disabled={!report} className="toolbar-btn"><Printer size={14} /> Print</button>
      </div>

      {loading && (
        <div className="flex flex-col gap-4">
          <LoadingSpinner label="Building report…" />
          <SkeletonCards count={6} />
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
            <SkeletonChart /><SkeletonChart />
          </div>
        </div>
      )}

      {!loading && report && (
        <div id={elementId} className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <ReportHeader title={title.toUpperCase()} date={report.date} generatedTime={report.generatedTime} generatedBy={report.generatedByName || user?.name} />

          <div className="mb-5">
            <HealthScoreCard score={report.healthScore} status={report.equipmentStatus} statusColor={report.statusColor} />
          </div>

          <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            <StatCard icon={Activity} label="Average Current" value={report.stats.avgCurrent.toFixed(1) + " A"} accent="text-blue-400" />
            <StatCard icon={Activity} label="Average Voltage" value={report.stats.avgVoltage.toFixed(0) + " V"} accent="text-blue-400" />
            <StatCard icon={Zap} label="Average Power" value={report.stats.avgPower.toFixed(1) + " kW"} accent="text-orange-400" />
            <StatCard icon={Gauge} label="Average PF" value={report.stats.avgPF.toFixed(3)} accent="text-cyan-400" />
            <StatCard icon={Zap} label="Power Consumption" value={report.stats.totalPower.toFixed(1) + " kW"} accent="text-orange-400" />
            <StatCard icon={TrendingUp} label="Max Current" value={report.stats.maxCurrent ? report.stats.maxCurrent.value.toFixed(1) + " A" : "—"} sub={report.stats.maxCurrent?.label} accent="text-red-400" />
            <StatCard icon={TrendingDown} label="Min Current" value={report.stats.minCurrent ? report.stats.minCurrent.value.toFixed(1) + " A" : "—"} sub={report.stats.minCurrent?.label} accent="text-emerald-400" />
            <StatCard icon={TrendingUp} label="Highest Power Inductor" value={report.stats.highestPowerInductor ? report.stats.highestPowerInductor.label : "—"} sub={report.stats.highestPowerInductor ? report.stats.highestPowerInductor.value.toFixed(1) + " kW" : ""} accent="text-orange-400" />
            <StatCard icon={TrendingDown} label="Lowest Power Inductor" value={report.stats.lowestPowerInductor ? report.stats.lowestPowerInductor.label : "—"} sub={report.stats.lowestPowerInductor ? report.stats.lowestPowerInductor.value.toFixed(1) + " kW" : ""} accent="text-cyan-400" />
            <StatCard icon={Gauge} label="Current Balance %" value={report.stats.currentBalancePercent + "%"} accent="text-cyan-400" />
            <StatCard icon={Gauge} label="Voltage Balance %" value={report.stats.voltageBalancePercent + "%"} accent="text-cyan-400" />
          </div>

          <ParamReportTable entries={report.entries} />

          <ObservationsPanel observations={report.observations} />

          <RecommendationsPanel recommendations={report.recommendations} />

          <div className="grid gap-4 my-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
            <ChartCard title="Power Comparison">
              <BarChart data={report.entries}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ ...chartTheme.tick, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="power" name="Power (kW)" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
            <ChartCard title="Voltage Comparison">
              <BarChart data={report.entries}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ ...chartTheme.tick, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="inductorVoltage" name="Voltage (V)" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
            <ChartCard title="Current Comparison">
              <BarChart data={report.entries}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ ...chartTheme.tick, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="rPhase" name="R Phase" fill="#EF4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="yPhase" name="Y Phase" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="bPhase" name="B Phase" fill="#3B82F6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartCard>
            <ChartCard title="PF Comparison">
              <BarChart data={report.entries}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ ...chartTheme.tick, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={chartTheme.tick} domain={[0, 1]} /><Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="inductorPF" name="Inductor PF" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
            <ChartCard title="KVA Comparison">
              <BarChart data={report.entries}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ ...chartTheme.tick, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="inductorKVA" name="Inductor KVA" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <div className="text-[10.5px] uppercase text-slate-500 mb-1">Operator Remarks</div>
              <textarea value={operatorRemarks} onChange={(e) => setOperatorRemarks(e.target.value)} rows={2} className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" placeholder="Shift observations from the operator…" />
            </div>
            <div>
              <div className="text-[10.5px] uppercase text-slate-500 mb-1">Engineer Remarks</div>
              <textarea value={engineerRemarks} onChange={(e) => setEngineerRemarks(e.target.value)} rows={2} className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" placeholder="Engineering review notes…" />
            </div>
          </div>

          <ReportSignatureBlock />

          <div className="text-center text-[10.5px] text-slate-600 mt-6 pt-3 border-t border-slate-800">
            Generated automatically from CGL Dashboard
          </div>
        </div>
      )}
    </div>
  );
}
