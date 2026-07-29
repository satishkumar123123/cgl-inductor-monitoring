import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import * as XLSX from "xlsx";
import { FileText, FileSpreadsheet, Printer, TrendingUp, TrendingDown, Zap, Factory, Gauge, Percent } from "lucide-react";
import StatCard from "../../components/StatCard.jsx";
import ChartCard, { chartTheme } from "../../components/ChartCard.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { SkeletonCards, SkeletonChart } from "../../components/Skeleton.jsx";
import useToast from "../../hooks/useToast.js";
import { fetchMonthlyAnalysis } from "../../services/powerService.js";
import { logReport } from "../../services/reportService.js";
import { exportElementToPdf } from "../../utils/pdfExport.js";
import { fmtDateLong } from "../../utils/rowsConfig.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function MonthlyAnalysisPage() {
  const now = new Date();
  const location = useLocation();
  const [year, setYear] = useState(location.state?.year || now.getFullYear());
  const [month, setMonth] = useState(location.state?.month || now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAutoDownload, setPendingAutoDownload] = useState(location.state?.autoDownload || null);
  const { notify } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const result = await fetchMonthlyAnalysis(year, month);
      setData(result);
    } catch (err) {
      notify(err.response?.data?.message || "Failed to load monthly report", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data?.summary || !pendingAutoDownload) return;
    if (pendingAutoDownload === "pdf") downloadPdf();
    else if (pendingAutoDownload === "excel") downloadExcel();
    else if (pendingAutoDownload === "print") printReport();
    setPendingAutoDownload(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const periodLabel = `${MONTHS[month - 1]} ${year}`;

  const log = (format) => logReport({ reportType: "Monthly Analysis", periodLabel, format }).catch(() => {});

  const downloadPdf = async () => {
    await exportElementToPdf("monthly-report-content", `Monthly_Report_${year}_${month}.pdf`);
    await log("pdf");
    notify("PDF downloaded");
  };

  const downloadExcel = () => {
    if (!data?.records?.length) return;
    const wb = XLSX.utils.book_new();
    const header = ["Date", "Main Pot Power", "PM Pot Power", "Overall Power", "Production (Ton)", "Dross (kg)", "Power/Ton", "Dross %", "Shift", "Operator"];
    const body = data.records.map((r) => [r.date, r.mainPotPower, r.pmPotPower, r.overallPower, r.metalCharging, r.drossGeneration, r.powerPerTon, r.drossPercent, r.shift, r.operatorName]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header, ...body]), "Daily Records");

    const s = data.summary;
    const summarySheet = [
      ["Period", periodLabel],
      ["Total Production (Ton)", s.totalProduction],
      ["Total Power (kW)", s.totalPower],
      ["Average Power (kW)", s.avgPower],
      ["Average Production (Ton)", s.avgProduction],
      ["Average Dross (kg)", s.avgDross],
      ["Power/Ton (kW/T)", s.powerPerTon],
      ["Dross %", s.drossPercent],
      ["Highest Consumption Day", s.highestConsumptionDay.date, s.highestConsumptionDay.overallPower + " kW"],
      ["Lowest Consumption Day", s.lowestConsumptionDay.date, s.lowestConsumptionDay.overallPower + " kW"],
      ["Best Efficiency Day", s.bestEfficiencyDay.date, s.bestEfficiencyDay.powerPerTon + " kW/T"],
      ["Worst Efficiency Day", s.worstEfficiencyDay.date, s.worstEfficiencyDay.powerPerTon + " kW/T"],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheet), "Summary");
    XLSX.writeFile(wb, `Monthly_Report_${year}_${month}.xlsx`);
    log("excel");
    notify("Excel downloaded");
  };

  const printReport = async () => {
    window.print();
    await log("print");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-extrabold text-white">Monthly Report</h1>
        <p className="text-xs text-slate-500 mt-1">Aggregated power, production, and dross performance for the selected month, straight from MongoDB Atlas.</p>
      </div>

      <div className="no-print flex flex-wrap items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="select-input">
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="select-input w-24" />
        <button onClick={downloadPdf} disabled={!data?.summary} className="toolbar-btn"><FileText size={14} /> Download PDF</button>
        <button onClick={downloadExcel} disabled={!data?.summary} className="toolbar-btn"><FileSpreadsheet size={14} /> Download Excel</button>
        <button onClick={printReport} disabled={!data?.summary} className="toolbar-btn"><Printer size={14} /> Print</button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <LoadingSpinner label="Loading monthly report…" />
          <SkeletonCards count={7} />
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
            <SkeletonChart /><SkeletonChart />
          </div>
        </div>
      ) : !data?.summary ? (
        <div className="text-sm text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
          No power consumption data saved in MongoDB for {periodLabel}.
        </div>
      ) : (
        <div id="monthly-report-content" className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-center text-cyan-300 font-extrabold tracking-wide">MONTHLY REPORT — {periodLabel.toUpperCase()}</h2>

          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <StatCard icon={Factory} label="Total Production" value={data.summary.totalProduction.toFixed(1) + " Ton"} accent="text-blue-400" />
            <StatCard icon={Zap} label="Total Power" value={data.summary.totalPower.toFixed(1) + " kW"} accent="text-orange-400" />
            <StatCard icon={Zap} label="Average Power" value={data.summary.avgPower.toFixed(1) + " kW"} accent="text-orange-400" />
            <StatCard icon={Factory} label="Average Production" value={data.summary.avgProduction.toFixed(1) + " Ton"} accent="text-blue-400" />
            <StatCard icon={Zap} label="Average Dross" value={data.summary.avgDross.toFixed(1) + " kg"} accent="text-red-400" />
            <StatCard icon={Gauge} label="Power/Ton" value={data.summary.powerPerTon.toFixed(2) + " kW/T"} accent="text-cyan-400" />
            <StatCard icon={Percent} label="Dross %" value={data.summary.drossPercent.toFixed(2) + "%"} accent="text-orange-400" />
            <StatCard icon={TrendingUp} label="Highest Consumption Day" value={fmtDateLong(data.summary.highestConsumptionDay.date)} sub={data.summary.highestConsumptionDay.overallPower.toFixed(1) + " kW"} accent="text-orange-400" />
            <StatCard icon={TrendingDown} label="Lowest Consumption Day" value={fmtDateLong(data.summary.lowestConsumptionDay.date)} sub={data.summary.lowestConsumptionDay.overallPower.toFixed(1) + " kW"} accent="text-cyan-400" />
            <StatCard icon={TrendingUp} label="Best Efficiency Day" value={fmtDateLong(data.summary.bestEfficiencyDay.date)} sub={data.summary.bestEfficiencyDay.powerPerTon.toFixed(2) + " kW/T"} accent="text-emerald-400" />
            <StatCard icon={TrendingDown} label="Worst Efficiency Day" value={fmtDateLong(data.summary.worstEfficiencyDay.date)} sub={data.summary.worstEfficiencyDay.powerPerTon.toFixed(2) + " kW/T"} accent="text-red-400" />
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
            <ChartCard title="Daily Power (Bar)">
              <BarChart data={data.records.map((r) => ({ date: r.date.slice(8), power: r.overallPower }))}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="date" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="power" name="Power (kW)" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
            <ChartCard title="Daily Trend (Line)">
              <LineChart data={data.records.map((r) => ({ date: r.date.slice(8), power: r.overallPower, production: r.metalCharging }))}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="date" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="power" name="Power (kW)" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="production" name="Production (Ton)" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ChartCard>
            <ChartCard title="Power/Ton Trend">
              <LineChart data={data.records.map((r) => ({ date: r.date.slice(8), powerPerTon: r.powerPerTon }))}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="date" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Line type="monotone" dataKey="powerPerTon" name="kW / Ton" stroke="#22D3EE" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ChartCard>
            <ChartCard title="Dross % Trend">
              <BarChart data={data.records.map((r) => ({ date: r.date.slice(8), drossPercent: r.drossPercent }))}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="date" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="drossPercent" name="Dross %" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>

          <div className="text-center text-[10.5px] text-slate-600 mt-2 pt-3 border-t border-slate-800">
            Generated automatically from CGL Dashboard — data sourced live from MongoDB Atlas.
          </div>
        </div>
      )}
    </div>
  );
}
