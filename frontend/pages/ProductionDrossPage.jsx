import React, { useEffect, useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Printer,
  Save,
  PlusCircle,
  History,
  TrendingUp,
  Flame,
  Award,
  Calendar,
  Layers,
  Zap,
  Tag,
  MessageSquare,
  Scale,
  Clock,
  FileBarChart2,
  ListOrdered
} from "lucide-react";
import * as XLSX from "xlsx";
import api from "../services/api.js";

export default function ProductionDrossPage() {
  // Toggle States for Tabs
  const [prodViewTab, setProdViewTab] = useState("history"); // "history" or "report"
  const [drossViewTab, setDrossViewTab] = useState("history"); // "history" or "report"

  // 1. Entry Month State
  const [entryMonth, setEntryMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // 2. Print & Export Range States (From Month -> To Month)
  const [printStartMonth, setPrintStartMonth] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 5))
      .toISOString()
      .slice(0, 7)
  );
  const [printEndMonth, setPrintEndMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [monthlyData, setMonthlyData] = useState({
    productionMT: "",
    metalChargedMT: "",
    totalDrossMT: "",
    remarks: "",
  });

  const [bottomEntry, setBottomEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    quantityMT: "",
    lineRemarks: "",
  });

  const [currentReport, setCurrentReport] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    fetchMonthReport(entryMonth);
    fetchHistory();
  }, [entryMonth]);

  const fetchMonthReport = async (month) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/production-dross/get-report?monthYear=${month}`
      );
      if (res.data?.success) {
        const data = res.data.data;
        setCurrentReport(data);
        setMonthlyData({
          productionMT: data.productionMT !== undefined ? data.productionMT : "",
          metalChargedMT: data.metalChargedMT !== undefined ? data.metalChargedMT : "",
          totalDrossMT: data.totalDrossMT !== undefined ? data.totalDrossMT : "",
          remarks: data.remarks || "",
        });
      } else {
        setCurrentReport(null);
        setMonthlyData({
          productionMT: "",
          metalChargedMT: "",
          totalDrossMT: "",
          remarks: "",
        });
      }
    } catch (err) {
      console.warn("Fetch month report error / No data:", err?.response?.data || err.message);
      setCurrentReport(null);
      setMonthlyData({
        productionMT: "",
        metalChargedMT: "",
        totalDrossMT: "",
        remarks: "",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/production-dross/history");
      if (res.data?.success) {
        setHistoryList(res.data.data || []);
      }
    } catch (err) {
      console.error("History fetch error:", err?.response?.data || err.message);
    }
  };

  // =====================================================
  // ALL HISTORY & DYNAMIC RANGE FILTERING FOR TABLE & PRINT
  // =====================================================

  // Sorted Full History for History Tab
  const sortedFullHistory = useMemo(() => {
    return [...historyList].sort((a, b) => (b.monthYear || "").localeCompare(a.monthYear || ""));
  }, [historyList]);

  const fullHistoryTotals = useMemo(() => {
    const totalProd = sortedFullHistory.reduce((acc, item) => acc + (Number(item.productionMT) || 0), 0);
    const totalMetal = sortedFullHistory.reduce((acc, item) => acc + (Number(item.metalChargedMT) || 0), 0);
    const totalDross = sortedFullHistory.reduce((acc, item) => acc + (Number(item.totalDrossMT) || 0), 0);
    const avgPct = totalMetal > 0 ? ((totalDross / totalMetal) * 100).toFixed(2) : "0.00";
    const avgKgMT = totalProd > 0 ? ((totalDross * 1000) / totalProd).toFixed(2) : "0.00";
    return { totalProd, totalMetal, totalDross, avgPct, avgKgMT };
  }, [sortedFullHistory]);

  // Range Filtered Data for Report Tab
  const rangeFilteredData = useMemo(() => {
    return historyList
      .filter((item) => {
        if (!item.monthYear) return false;
        const itemMonth = item.monthYear.toString().trim();
        return itemMonth >= printStartMonth && itemMonth <= printEndMonth;
      })
      .sort((a, b) => a.monthYear.localeCompare(b.monthYear));
  }, [historyList, printStartMonth, printEndMonth]);

  const rangeTotals = useMemo(() => {
    const totalProd = rangeFilteredData.reduce(
      (acc, item) => acc + (Number(item.productionMT) || 0),
      0
    );
    const totalMetal = rangeFilteredData.reduce(
      (acc, item) => acc + (Number(item.metalChargedMT) || 0),
      0
    );
    const totalDross = rangeFilteredData.reduce(
      (acc, item) => acc + (Number(item.totalDrossMT) || 0),
      0
    );
    const avgPct =
      totalMetal > 0 ? ((totalDross / totalMetal) * 100).toFixed(2) : "0.00";
    const avgKgMT =
      totalProd > 0 ? ((totalDross * 1000) / totalProd).toFixed(2) : "0.00";

    return { totalProd, totalMetal, totalDross, avgPct, avgKgMT };
  }, [rangeFilteredData]);

  // Extract all bottom dross logs across all history
  const allBottomDrossHistory = useMemo(() => {
    const list = [];
    historyList.forEach((h) => {
      if (h.bottomDrossLogs && Array.isArray(h.bottomDrossLogs)) {
        h.bottomDrossLogs.forEach((log) => {
          list.push({ ...log, monthYear: h.monthYear });
        });
      }
    });
    return list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [historyList]);

  const totalAllBottomDrossQuantity = useMemo(() => {
    return allBottomDrossHistory.reduce((acc, log) => acc + (Number(log.quantityMT) || 0), 0);
  }, [allBottomDrossHistory]);

  // Active Month Calculations
  const prod = parseFloat(monthlyData.productionMT) || 0;
  const metal = parseFloat(monthlyData.metalChargedMT) || 0;
  const dross = parseFloat(monthlyData.totalDrossMT) || 0;
  const drossPct = metal > 0 ? ((dross / metal) * 100).toFixed(2) : "0.00";
  const drossKgMT = prod > 0 ? ((dross * 1000) / prod).toFixed(2) : "0.00";

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleSaveMonthly = async () => {
    if (!entryMonth) {
      alert("Please select Month and Year");
      return;
    }

    const payload = {
      monthYear: entryMonth,
      productionMT: monthlyData.productionMT === "" ? 0 : Number(monthlyData.productionMT),
      metalChargedMT: monthlyData.metalChargedMT === "" ? 0 : Number(monthlyData.metalChargedMT),
      totalDrossMT: monthlyData.totalDrossMT === "" ? 0 : Number(monthlyData.totalDrossMT),
      drossPercent: Number(drossPct),
      drossKgPerMT: Number(drossKgMT),
      remarks: monthlyData.remarks || "",
    };

    try {
      const res = await api.post("/api/production-dross/save-monthly", payload);
      if (res.data?.success) {
        alert(`Monthly Production & Dross Data Saved for ${entryMonth}!`);
        
        if (entryMonth > printEndMonth) {
          setPrintEndMonth(entryMonth);
        }
        if (entryMonth < printStartMonth) {
          setPrintStartMonth(entryMonth);
        }

        await fetchMonthReport(entryMonth);
        await fetchHistory();
      } else {
        alert(res.data?.message || "Failed to save data");
      }
    } catch (err) {
      console.error("Save monthly error:", err);
      const serverErrMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      alert(`Error saving data: ${serverErrMsg}`);
    }
  };

  const handleAddBottomDross = async () => {
    if (!bottomEntry.date) {
      alert("Please select date");
      return;
    }
    if (!bottomEntry.quantityMT || isNaN(Number(bottomEntry.quantityMT))) {
      alert("Please enter a valid Bottom Dross Quantity");
      return;
    }

    const payload = {
      ...bottomEntry,
      quantityMT: Number(bottomEntry.quantityMT),
    };

    try {
      const res = await api.post("/api/production-dross/add-bottom-dross", payload);
      if (res.data?.success) {
        alert("Bottom Dross Entry Added!");
        setBottomEntry({
          date: new Date().toISOString().split("T")[0],
          quantityMT: "",
          lineRemarks: "",
        });
        await fetchMonthReport(entryMonth);
        await fetchHistory();
      } else {
        alert(res.data?.message || "Failed to add entry");
      }
    } catch (err) {
      console.error("Bottom dross error:", err);
      const serverErrMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      alert(`Error adding Bottom Dross entry: ${serverErrMsg}`);
    }
  };

  // =====================================================
  // EXPORT EXCEL
  // =====================================================

  const exportAllHistoryExcel = () => {
    if (sortedFullHistory.length === 0) {
      alert("No production history records found to export.");
      return;
    }

    const rows = [
      ["APL APOLLO - CGL INDUCTOR ALL TIME PRODUCTION & DROSS HISTORY"],
      [`Exported On: ${new Date().toLocaleDateString()}`],
      [],
      [
        "Month / Year",
        "Production (MT)",
        "Metal Charged (MT)",
        "Total Dross (MT)",
        "Dross %",
        "Dross Kg/MT",
      ],
    ];

    sortedFullHistory.forEach((item) => {
      rows.push([
        item.monthYear,
        Number(item.productionMT || 0).toFixed(2),
        Number(item.metalChargedMT || 0).toFixed(2),
        Number(item.totalDrossMT || 0).toFixed(2),
        `${Number(item.drossPercent || 0).toFixed(2)}%`,
        Number(item.drossKgPerMT || 0).toFixed(2),
      ]);
    });

    rows.push([]);
    rows.push([
      "TOTAL / AVERAGE",
      fullHistoryTotals.totalProd.toFixed(2),
      fullHistoryTotals.totalMetal.toFixed(2),
      fullHistoryTotals.totalDross.toFixed(2),
      `${fullHistoryTotals.avgPct}%`,
      fullHistoryTotals.avgKgMT,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All History");
    XLSX.writeFile(workbook, `Production_Dross_All_History.xlsx`);
  };

  const exportRangeProductionExcel = () => {
    if (rangeFilteredData.length === 0) {
      alert(`No records found from ${printStartMonth} to ${printEndMonth}`);
      return;
    }

    const rows = [
      ["APL APOLLO - CGL INDUCTOR PRODUCTION & DROSS REPORT"],
      [`Report Period: ${printStartMonth} to ${printEndMonth}`],
      [],
      [
        "Month / Year",
        "Production (MT)",
        "Metal Charged (MT)",
        "Total Dross (MT)",
        "Dross %",
        "Dross Kg/MT",
      ],
    ];

    rangeFilteredData.forEach((item) => {
      rows.push([
        item.monthYear,
        Number(item.productionMT || 0).toFixed(2),
        Number(item.metalChargedMT || 0).toFixed(2),
        Number(item.totalDrossMT || 0).toFixed(2),
        `${Number(item.drossPercent || 0).toFixed(2)}%`,
        Number(item.drossKgPerMT || 0).toFixed(2),
      ]);
    });

    rows.push([]);
    rows.push([
      "TOTAL / AVERAGE",
      rangeTotals.totalProd.toFixed(2),
      rangeTotals.totalMetal.toFixed(2),
      rangeTotals.totalDross.toFixed(2),
      `${rangeTotals.avgPct}%`,
      rangeTotals.avgKgMT,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Range Report");
    XLSX.writeFile(
      workbook,
      `Production_Dross_Report_${printStartMonth}_to_${printEndMonth}.xlsx`
    );
  };

  const exportBottomDrossExcel = () => {
    const logs = currentReport?.bottomDrossLogs || [];
    if (logs.length === 0) {
      alert("No Bottom Dross entries available for selected entry month");
      return;
    }

    const rows = [
      ["CGL INDUCTOR - BOTTOM DROSS REPORT"],
      [],
      ["Month / Year", entryMonth],
      [],
      ["Date", "Quantity (MT)", "Remarks / Line Status"],
    ];

    logs.forEach((log) => {
      rows.push([
        log.date,
        Number(log.quantityMT || 0).toFixed(2),
        log.lineRemarks || "Line Active",
      ]);
    });

    rows.push([]);
    rows.push([
      "TOTAL",
      Number(currentReport?.totalBottomDrossMT || 0).toFixed(2),
      "",
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 18 }, { wch: 18 }, { wch: 40 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bottom Dross");
    XLSX.writeFile(workbook, `Bottom_Dross_Report_${entryMonth}.xlsx`);
  };

  // =====================================================
  // PRINT PDF
  // =====================================================

  const printRangeProductionReport = () => {
    if (rangeFilteredData.length === 0) {
      alert(`No records found between ${printStartMonth} and ${printEndMonth}`);
      return;
    }

    const tableRowsHtml = rangeFilteredData
      .map(
        (item, idx) => `
      <tr style="background: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}">
        <td style="font-weight: 800; color: #0369a1;">${item.monthYear}</td>
        <td>${Number(item.productionMT || 0).toFixed(2)}</td>
        <td>${Number(item.metalChargedMT || 0).toFixed(2)}</td>
        <td style="color: #c2410c; font-weight: 700;">${Number(
          item.totalDrossMT || 0
        ).toFixed(2)}</td>
        <td style="color: #ea580c; font-weight: 800;">${Number(
          item.drossPercent || 0
        ).toFixed(2)}%</td>
        <td style="color: #15803d; font-weight: 800;">${Number(
          item.drossKgPerMT || 0
        ).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=1000,height=750");
    if (!printWindow) {
      alert("Please allow popups to print.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Production & Dross Report Range</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; background: #fafafa; color: #0f172a; }
          .report-card { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 30px; }
          .header { background: linear-gradient(135deg, #0e7490 0%, #0369a1 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
          .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.85; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #0f172a; color: #ffffff; font-size: 11px; text-transform: uppercase; padding: 12px; }
          td { padding: 10px 12px; text-align: center; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
          .total-row { background: #e0f2fe !important; font-weight: 800; color: #0369a1; }
        </style>
      </head>
      <body>
        <div class="report-card">
          <div class="header">
            <h1>APL APOLLO - CGL INDUCTOR</h1>
            <p>PRODUCTION & DROSS CONSOLIDATED REPORT (${printStartMonth} TO ${printEndMonth})</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Month / Year</th>
                <th>Production (MT)</th>
                <th>Metal Charged (MT)</th>
                <th>Total Dross (MT)</th>
                <th>Dross %</th>
                <th>Dross Kg/MT</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
              <tr class="total-row">
                <td>TOTAL / AVERAGE</td>
                <td>${rangeTotals.totalProd.toFixed(2)}</td>
                <td>${rangeTotals.totalMetal.toFixed(2)}</td>
                <td>${rangeTotals.totalDross.toFixed(2)}</td>
                <td>${rangeTotals.avgPct}%</td>
                <td>${rangeTotals.avgKgMT}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const printBottomDrossReport = () => {
    const logs = currentReport?.bottomDrossLogs || [];
    if (logs.length === 0) {
      alert("No Bottom Dross entries available for selected entry month");
      return;
    }

    const tableRows = logs
      .map(
        (log, idx) => `
      <tr style="background: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}">
        <td style="font-weight: 700; color: #0e7490;">${log.date}</td>
        <td style="font-weight: 800; color: #7e22ce;">${Number(
          log.quantityMT || 0
        ).toFixed(2)}</td>
        <td style="color: #64748b;">${log.lineRemarks || "Line Active"}</td>
      </tr>
    `
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=900,height=750");
    if (!printWindow) {
      alert("Please allow popups to print.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bottom Dross Report - ${entryMonth}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; background: #fafafa; color: #0f172a; }
          .report-card { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 30px; }
          .header { background: linear-gradient(135deg, #6b21a8 0%, #581c87 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
          .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.85; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #faf5ff; color: #6b21a8; font-size: 12px; text-transform: uppercase; padding: 12px; border-bottom: 2px solid #e9d5ff; }
          td { padding: 10px 12px; text-align: center; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
          .total-row { background: #faf5ff !important; font-weight: 800; color: #581c87; }
        </style>
      </head>
      <body>
        <div class="report-card">
          <div class="header">
            <h1>CGL INDUCTOR - BOTTOM DROSS LOGS</h1>
            <p>Monthly Log Entries (${entryMonth})</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Quantity (MT)</th>
                <th>Remarks / Line Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total-row">
                <td style="text-align: right; font-weight: 800;">TOTAL QUANTITY:</td>
                <td style="font-size: 15px; color: #6b21a8;">${Number(
                  currentReport?.totalBottomDrossMT || 0
                ).toFixed(2)} MT</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div className="p-6 space-y-8 bg-white text-slate-800 min-h-screen max-w-[1600px] mx-auto font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-cyan-900 p-5 rounded-2xl border border-indigo-200 shadow-md text-white">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-cyan-300">
            <Flame size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              INDUCTOR PRODUCTION & DROSS REPORT
            </h1>
            <p className="text-xs text-cyan-200 font-medium">
              Data Entry, Custom Range Reports & Print Exports
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center text-xs font-semibold text-cyan-600 animate-pulse">
          Fetching system records...
        </div>
      )}

      {/* ================================================= */}
      {/* 1. ENTRY SECTION */}
      {/* ================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-blue-700 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp size={18} /> Production Entry Form
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select Month and Year to enter or update readings
            </p>
          </div>

          <div className="flex items-center gap-3 bg-blue-50/70 px-4 py-2 rounded-xl border border-blue-200 shadow-xs">
            <Calendar size={16} className="text-blue-600" />
            <label className="text-xs font-bold text-blue-900 uppercase">
              Select Month/Year:
            </label>
            <input
              type="month"
              value={entryMonth}
              onChange={(e) => setEntryMonth(e.target.value)}
              className="bg-white border border-blue-300 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-700 outline-none cursor-pointer focus:border-blue-500 shadow-xs"
            />
            <button
              onClick={handleSaveMonthly}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-extrabold px-4 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 ml-2 cursor-pointer"
            >
              <Save size={14} /> Save Data
            </button>
          </div>
        </div>

        {/* INPUT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PRODUCTION (MT) */}
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-blue-800 uppercase tracking-wide flex items-center gap-1.5">
                <Layers size={13} className="text-blue-600" /> Production (MT)
              </label>
              <span className="text-[10px] font-bold bg-blue-200/80 text-blue-800 px-1.5 py-0.5 rounded">MT</span>
            </div>
            <input
              type="number"
              value={monthlyData.productionMT}
              onChange={(e) =>
                setMonthlyData({ ...monthlyData, productionMT: e.target.value })
              }
              placeholder="0.00"
              className="w-full mt-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 font-extrabold text-sm text-blue-900 outline-none focus:border-blue-400 placeholder:text-blue-300 shadow-xs"
            />
          </div>

          {/* METAL CHARGED (MT) */}
          <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-200 transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-teal-800 uppercase tracking-wide flex items-center gap-1.5">
                <Zap size={13} className="text-teal-600" /> Metal Charged (MT)
              </label>
              <span className="text-[10px] font-bold bg-teal-200/80 text-teal-800 px-1.5 py-0.5 rounded">MT</span>
            </div>
            <input
              type="number"
              value={monthlyData.metalChargedMT}
              onChange={(e) =>
                setMonthlyData({
                  ...monthlyData,
                  metalChargedMT: e.target.value,
                })
              }
              placeholder="0.00"
              className="w-full mt-2 bg-white px-3 py-1.5 rounded-lg border border-teal-200 font-extrabold text-sm text-teal-900 outline-none focus:border-teal-400 placeholder:text-teal-300 shadow-xs"
            />
          </div>

          {/* TOTAL DROSS (MT) */}
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                <Flame size={13} className="text-amber-600" /> Total Dross (MT)
              </label>
              <span className="text-[10px] font-bold bg-amber-200/80 text-amber-800 px-1.5 py-0.5 rounded">MT</span>
            </div>
            <input
              type="number"
              value={monthlyData.totalDrossMT}
              onChange={(e) =>
                setMonthlyData({ ...monthlyData, totalDrossMT: e.target.value })
              }
              placeholder="0.00"
              className="w-full mt-2 bg-white px-3 py-1.5 rounded-lg border border-amber-200 font-extrabold text-sm text-amber-900 outline-none focus:border-amber-400 placeholder:text-amber-300 shadow-xs"
            />
          </div>

          {/* REMARKS */}
          <div className="bg-violet-50/70 p-3.5 rounded-xl border border-violet-200 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-200 transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-violet-800 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare size={13} className="text-violet-600" /> Remarks
              </label>
              <span className="text-[10px] font-bold bg-violet-200/80 text-violet-800 px-1.5 py-0.5 rounded">Note</span>
            </div>
            <input
              type="text"
              value={monthlyData.remarks}
              onChange={(e) =>
                setMonthlyData({ ...monthlyData, remarks: e.target.value })
              }
              placeholder="Monthly remarks..."
              className="w-full mt-2 bg-white px-3 py-1.5 rounded-lg border border-violet-200 text-xs font-semibold text-violet-900 outline-none focus:border-violet-400 placeholder:text-violet-300 shadow-xs"
            />
          </div>
        </div>

        {/* CALCULATED KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl p-4 flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                Dross Percentage ({entryMonth})
              </span>
              <div className="text-2xl font-black text-white mt-1 drop-shadow-sm">
                {drossPct}%
              </div>
            </div>
            <div className="p-3 bg-white/20 rounded-xl text-white">
              <Award size={24} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-4 flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                Dross Kg/MT Production ({entryMonth})
              </span>
              <div className="text-2xl font-black text-white mt-1 drop-shadow-sm">
                {drossKgMT}{" "}
                <span className="text-xs font-medium text-emerald-100">
                  Kg/MT
                </span>
              </div>
            </div>
            <div className="p-3 bg-white/20 rounded-xl text-white">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* 2. DYNAMIC VIEW: HISTORY vs CONSOLIDATED REPORT */}
      {/* ================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* VIBRANT TOGGLE BUTTONS / TABS (HISTORY & REPORT) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            {/* HISTORY TOGGLE BLOCK */}
            <button
              onClick={() => setProdViewTab("history")}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer transform-gpu ${
                prodViewTab === "history"
                  ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-[0_8px_16px_rgba(245,158,11,0.3)] border-t border-l border-amber-300 border-b-4 border-r-2 border-b-amber-700 -translate-y-1"
                  : "bg-slate-100 text-slate-600 border-b-4 border-slate-300 hover:bg-amber-50 hover:text-amber-800"
              }`}
            >
              <History size={18} className={prodViewTab === "history" ? "text-amber-100" : "text-amber-600"} />
              <span>PRODUCTION HISTORY (ALL DATA)</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                prodViewTab === "history" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {sortedFullHistory.length} Records
              </span>
            </button>

            {/* REPORT TOGGLE BLOCK */}
            <button
              onClick={() => setProdViewTab("report")}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer transform-gpu ${
                prodViewTab === "report"
                  ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-[0_8px_16px_rgba(147,51,234,0.3)] border-t border-l border-purple-300 border-b-4 border-r-2 border-b-purple-800 -translate-y-1"
                  : "bg-slate-100 text-slate-600 border-b-4 border-slate-300 hover:bg-purple-50 hover:text-purple-800"
              }`}
            >
              <FileBarChart2 size={18} className={prodViewTab === "report" ? "text-purple-100" : "text-purple-600"} />
              <span>CONSOLIDATED REPORT (RANGE & PRINT)</span>
            </button>
          </div>

          {/* ACTION BUTTONS (EXCEL / PRINT) */}
          {prodViewTab === "history" ? (
            <button
              onClick={exportAllHistoryExcel}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet size={15} /> Export All History (Excel)
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 bg-purple-50/70 p-2.5 rounded-2xl border border-purple-200 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <label className="uppercase">From:</label>
                <input
                  type="month"
                  value={printStartMonth}
                  onChange={(e) => setPrintStartMonth(e.target.value)}
                  className="bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs font-black text-purple-800 outline-none cursor-pointer focus:border-purple-500"
                />
              </div>

              <span className="text-purple-400 font-black">→</span>

              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <label className="uppercase">To:</label>
                <input
                  type="month"
                  value={printEndMonth}
                  onChange={(e) => setPrintEndMonth(e.target.value)}
                  className="bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs font-black text-purple-800 outline-none cursor-pointer focus:border-purple-500"
                />
              </div>

              <button
                onClick={exportRangeProductionExcel}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer ml-1"
              >
                <FileSpreadsheet size={14} /> Export Range
              </button>
              <button
                onClick={printRangeProductionReport}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Printer size={14} /> Print PDF
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: ALL HISTORY VIEW */}
        {prodViewTab === "history" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={15} className="text-amber-600" /> Complete Historical Records Database ({sortedFullHistory.length} Total Months)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Month / Year</th>
                    <th className="p-3.5 text-center">Production (MT)</th>
                    <th className="p-3.5 text-center">Metal Charged (MT)</th>
                    <th className="p-3.5 text-center">Total Dross (MT)</th>
                    <th className="p-3.5 text-center">Dross %</th>
                    <th className="p-3.5 text-center">Dross Kg/MT</th>
                    <th className="p-3.5 text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sortedFullHistory.length > 0 ? (
                    sortedFullHistory.map((item, idx) => (
                      <tr key={item._id || idx} className="hover:bg-amber-50/50 transition-colors">
                        <td className="p-3.5 font-black text-amber-900">{item.monthYear}</td>
                        <td className="p-3.5 text-center font-bold text-blue-900">
                          {Number(item.productionMT || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center font-bold text-teal-800">
                          {Number(item.metalChargedMT || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center font-black text-amber-600">
                          {Number(item.totalDrossMT || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center font-black text-orange-600">
                          {Number(item.drossPercent || 0).toFixed(2)}%
                        </td>
                        <td className="p-3.5 text-center font-black text-emerald-600">
                          {Number(item.drossKgPerMT || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center text-slate-500 font-medium">
                          {item.remarks || "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">
                        No production records saved in the database yet.
                      </td>
                    </tr>
                  )}

                  {/* ALL TIME TOTAL ROW */}
                  {sortedFullHistory.length > 0 && (
                    <tr className="bg-amber-100/80 font-black text-amber-950 border-t-2 border-amber-300">
                      <td className="p-3.5">ALL TIME TOTAL / AVG</td>
                      <td className="p-3.5 text-center text-blue-950">
                        {fullHistoryTotals.totalProd.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center text-teal-950">
                        {fullHistoryTotals.totalMetal.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center text-amber-900">
                        {fullHistoryTotals.totalDross.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center text-orange-900">
                        {fullHistoryTotals.avgPct}%
                      </td>
                      <td className="p-3.5 text-center text-emerald-900">
                        {fullHistoryTotals.avgKgMT}
                      </td>
                      <td className="p-3.5 text-center">—</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CONSOLIDATED REPORT (RANGE & PRINT) VIEW */}
        {prodViewTab === "report" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileBarChart2 size={15} className="text-purple-600" /> Filtered Range ({printStartMonth} to {printEndMonth})
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-gradient-to-r from-purple-700 via-indigo-700 to-cyan-700 text-white font-black uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Month / Year</th>
                    <th className="p-3.5 text-center">Production (MT)</th>
                    <th className="p-3.5 text-center">Metal Charged (MT)</th>
                    <th className="p-3.5 text-center">Total Dross (MT)</th>
                    <th className="p-3.5 text-center">Dross %</th>
                    <th className="p-3.5 text-center">Kg/MT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rangeFilteredData.length > 0 ? (
                    rangeFilteredData.map((item) => (
                      <tr
                        key={item._id || item.monthYear}
                        className="hover:bg-purple-50/40 transition-colors"
                      >
                        <td className="p-3.5 font-bold text-purple-800">
                          {item.monthYear}
                        </td>
                        <td className="p-3.5 text-center font-bold text-blue-900">
                          {Number(item.productionMT || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center font-bold text-teal-800">
                          {Number(item.metalChargedMT || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center font-bold text-amber-600">
                          {Number(item.totalDrossMT || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center font-bold text-orange-600">
                          {Number(item.drossPercent || 0).toFixed(2)}%
                        </td>
                        <td className="p-3.5 text-center font-bold text-emerald-600">
                          {Number(item.drossKgPerMT || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-6 text-center text-slate-400 font-medium"
                      >
                        No production history records found from {printStartMonth} to {printEndMonth}.
                      </td>
                    </tr>
                  )}

                  {/* SUMMARY ROW FOR SELECTED RANGE */}
                  {rangeFilteredData.length > 0 && (
                    <tr className="bg-purple-100/80 font-black text-purple-950 border-t-2 border-purple-300">
                      <td className="p-3.5">TOTAL / AVERAGE</td>
                      <td className="p-3.5 text-center text-blue-950">
                        {rangeTotals.totalProd.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center text-teal-950">
                        {rangeTotals.totalMetal.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center text-amber-900">
                        {rangeTotals.totalDross.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center text-orange-900">
                        {rangeTotals.avgPct}%
                      </td>
                      <td className="p-3.5 text-center text-emerald-900">
                        {rangeTotals.avgKgMT}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* 3. BOTTOM DROSS ENTRY FORM */}
      {/* ================================================= */}
      <div className="bg-white border border-purple-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 border-b border-purple-100 pb-4">
          <div>
            <h2 className="text-base font-black text-purple-700 uppercase tracking-wide flex items-center gap-2">
              <Flame size={18} className="text-purple-600" /> Bottom Dross Logging
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record individual day-wise bottom dross quantities
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleAddBottomDross}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle size={14} /> Add Entry
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LOG DATE */}
          <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200 transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={13} className="text-rose-600" /> Log Date
              </label>
              <span className="text-[10px] font-bold bg-rose-200/80 text-rose-800 px-1.5 py-0.5 rounded">Date</span>
            </div>
            <input
              type="date"
              value={bottomEntry.date}
              onChange={(e) =>
                setBottomEntry({ ...bottomEntry, date: e.target.value })
              }
              className="w-full mt-2 bg-white px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-bold text-rose-900 outline-none focus:border-rose-400 shadow-xs cursor-pointer"
            />
          </div>

          {/* QUANTITY (MT) */}
          <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-purple-800 uppercase tracking-wide flex items-center gap-1.5">
                <Scale size={13} className="text-purple-600" /> Quantity (MT)
              </label>
              <span className="text-[10px] font-bold bg-purple-200/80 text-purple-800 px-1.5 py-0.5 rounded">MT</span>
            </div>
            <input
              type="number"
              value={bottomEntry.quantityMT}
              onChange={(e) =>
                setBottomEntry({ ...bottomEntry, quantityMT: e.target.value })
              }
              placeholder="0.00"
              className="w-full mt-2 bg-white px-3 py-1.5 rounded-lg border border-purple-200 font-extrabold text-sm text-purple-900 outline-none focus:border-purple-400 placeholder:text-purple-300 shadow-xs"
            />
          </div>

          {/* LINE REMARKS */}
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-indigo-800 uppercase tracking-wide flex items-center gap-1.5">
                <Tag size={13} className="text-indigo-600" /> Line Remarks
              </label>
              <span className="text-[10px] font-bold bg-indigo-200/80 text-indigo-800 px-1.5 py-0.5 rounded">Status</span>
            </div>
            <input
              type="text"
              value={bottomEntry.lineRemarks}
              onChange={(e) =>
                setBottomEntry({ ...bottomEntry, lineRemarks: e.target.value })
              }
              placeholder="Line status / observation"
              className="w-full mt-2 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 text-xs font-semibold text-indigo-900 outline-none focus:border-indigo-400 placeholder:text-indigo-300 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* 4. DYNAMIC VIEW: BOTTOM DROSS HISTORY vs REPORT */}
      {/* ================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* VIBRANT TOGGLE BUTTONS (BOTTOM DROSS HISTORY & MONTHLY LOGS) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrossViewTab("history")}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer transform-gpu ${
                drossViewTab === "history"
                  ? "bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-[0_8px_16px_rgba(244,63,94,0.3)] border-t border-l border-rose-300 border-b-4 border-r-2 border-b-rose-700 -translate-y-1"
                  : "bg-slate-100 text-slate-600 border-b-4 border-slate-300 hover:bg-rose-50 hover:text-rose-800"
              }`}
            >
              <History size={18} className={drossViewTab === "history" ? "text-rose-100" : "text-rose-600"} />
              <span>ALL DROSS HISTORY (ALL ENTRIES)</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                drossViewTab === "history" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {allBottomDrossHistory.length} Logs
              </span>
            </button>

            <button
              onClick={() => setDrossViewTab("report")}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer transform-gpu ${
                drossViewTab === "report"
                  ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-[0_8px_16px_rgba(147,51,234,0.3)] border-t border-l border-purple-300 border-b-4 border-r-2 border-b-purple-800 -translate-y-1"
                  : "bg-slate-100 text-slate-600 border-b-4 border-slate-300 hover:bg-purple-50 hover:text-purple-800"
              }`}
            >
              <ListOrdered size={18} className={drossViewTab === "report" ? "text-purple-100" : "text-purple-600"} />
              <span>MONTHLY REPORT LOGS ({entryMonth})</span>
            </button>
          </div>

          {/* DROSS ACTIONS */}
          {drossViewTab === "report" && (
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={exportBottomDrossExcel}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                <FileSpreadsheet size={14} /> Excel ({entryMonth})
              </button>
              <button
                onClick={printBottomDrossReport}
                className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Printer size={14} /> Print PDF ({entryMonth})
              </button>
            </div>
          )}
        </div>

        {/* DROSS TAB 1: ALL TIME LOGS */}
        {drossViewTab === "history" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={15} className="text-rose-600" /> Complete Bottom Dross History Across All Months
              </span>
              <span className="text-xs font-extrabold text-rose-950 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl shadow-xs">
                Total All-Time Dross: <span className="text-rose-600 font-black">{totalAllBottomDrossQuantity.toFixed(2)} MT</span>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-black uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Month</th>
                    <th className="p-3.5">Log Date</th>
                    <th className="p-3.5 text-center">Quantity (MT)</th>
                    <th className="p-3.5">Remarks / Line Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {allBottomDrossHistory.length > 0 ? (
                    allBottomDrossHistory.map((log, index) => (
                      <tr key={index} className="hover:bg-rose-50/40 transition-colors">
                        <td className="p-3.5 font-bold text-slate-800">{log.monthYear}</td>
                        <td className="p-3.5 font-bold text-rose-700">{log.date}</td>
                        <td className="p-3.5 text-center font-black text-purple-700">
                          {Number(log.quantityMT || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-indigo-900 font-medium">
                          {log.lineRemarks || "Line Active"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-400 font-medium">
                        No Bottom Dross entries found in the entire database.
                      </td>
                    </tr>
                  )}
                  {allBottomDrossHistory.length > 0 && (
                    <tr className="bg-rose-100/80 font-black text-rose-950 border-t-2 border-rose-300">
                      <td colSpan="2" className="p-3.5 text-right uppercase">TOTAL ALL-TIME QUANTITY:</td>
                      <td className="p-3.5 text-center text-purple-900 font-black text-sm">
                        {totalAllBottomDrossQuantity.toFixed(2)} MT
                      </td>
                      <td className="p-3.5">—</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DROSS TAB 2: MONTHLY SELECTED LOGS */}
        {drossViewTab === "report" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h3 className="flex items-center gap-2 text-xs font-black text-purple-700 uppercase tracking-wider">
                <History size={15} /> Bottom Dross Logs for ({entryMonth})
              </h3>

              <div className="text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl shadow-xs">
                Total Monthly:{" "}
                <span className="text-purple-950 font-extrabold">
                  {Number(currentReport?.totalBottomDrossMT || 0).toFixed(2)} MT
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-purple-900 font-bold uppercase tracking-wider border-b border-purple-100">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-center">Quantity (MT)</th>
                    <th className="p-3.5">Remarks / Line Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {currentReport?.bottomDrossLogs?.length > 0 ? (
                    currentReport.bottomDrossLogs.map((log, index) => (
                      <tr
                        key={log._id || index}
                        className="hover:bg-purple-50/40 transition-colors"
                      >
                        <td className="p-3.5 font-bold text-rose-700">
                          {log.date}
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-purple-700">
                          {Number(log.quantityMT || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-indigo-800 font-medium">
                          {log.lineRemarks || "Line Active"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="p-6 text-center text-slate-400 font-medium"
                      >
                        No Bottom Dross log entries found for {entryMonth}.
                      </td>
                    </tr>
                  )}
                  {currentReport?.bottomDrossLogs?.length > 0 && (
                    <tr className="bg-purple-50 font-black text-purple-950 border-t border-purple-200">
                      <td className="p-3.5 text-right uppercase">MONTHLY TOTAL:</td>
                      <td className="p-3.5 text-center text-purple-900 font-black">
                        {Number(currentReport?.totalBottomDrossMT || 0).toFixed(2)} MT
                      </td>
                      <td className="p-3.5">—</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}