import React, { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  Printer,
  Save,
  PlusCircle,
  History,
} from "lucide-react";
import axios from "axios";
import * as XLSX from "xlsx";

export default function ProductionDrossPage() {
  const [selectedMonth, setSelectedMonth] = useState(
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
    fetchMonthReport(selectedMonth);
    fetchHistory();
  }, [selectedMonth]);

  const fetchMonthReport = async (month) => {
    setLoading(true);

    try {
      const res = await axios.get(
        `/api/production-dross/get-report?monthYear=${month}`
      );

      if (res.data.success) {
        const data = res.data.data;

        setCurrentReport(data);

        setMonthlyData({
          productionMT: data.productionMT || "",
          metalChargedMT: data.metalChargedMT || "",
          totalDrossMT: data.totalDrossMT || "",
          remarks: data.remarks || "",
        });
      }
    } catch (err) {
      console.error("Fetch month report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get("/api/production-dross/history");

      if (res.data.success) {
        setHistoryList(res.data.data || []);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  // =====================================================
  // SAVE MONTHLY PRODUCTION REPORT
  // =====================================================

  const handleSaveMonthly = async () => {
    try {
      const res = await axios.post(
        "/api/production-dross/save-monthly",
        {
          monthYear: selectedMonth,
          ...monthlyData,
        }
      );

      if (res.data.success) {
        alert("Monthly Production & Dross Report Saved!");

        await fetchMonthReport(selectedMonth);
        await fetchHistory();
      }
    } catch (err) {
      console.error("Save monthly error:", err);
      alert("Error saving monthly Production & Dross data");
    }
  };

  // =====================================================
  // ADD BOTTOM DROSS
  // =====================================================

  const handleAddBottomDross = async () => {
    if (!bottomEntry.date) {
      alert("Please select date");
      return;
    }

    if (!bottomEntry.quantityMT) {
      alert("Please enter Bottom Dross Quantity");
      return;
    }

    try {
      const res = await axios.post(
        "/api/production-dross/add-bottom-dross",
        bottomEntry
      );

      if (res.data.success) {
        alert("Bottom Dross Entry Added!");

        setBottomEntry({
          date: new Date().toISOString().split("T")[0],
          quantityMT: "",
          lineRemarks: "",
        });

        await fetchMonthReport(selectedMonth);
        await fetchHistory();
      }
    } catch (err) {
      console.error("Bottom dross error:", err);
      alert("Error adding Bottom Dross entry");
    }
  };

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const prod = parseFloat(monthlyData.productionMT) || 0;
  const metal = parseFloat(monthlyData.metalChargedMT) || 0;
  const dross = parseFloat(monthlyData.totalDrossMT) || 0;

  const drossPct =
    metal > 0 ? ((dross / metal) * 100).toFixed(2) : "0.00";

  const drossKgMT =
    prod > 0 ? ((dross * 1000) / prod).toFixed(2) : "0.00";

  // =====================================================
  // PRODUCTION REPORT → EXCEL
  // =====================================================

  const exportProductionExcel = () => {
    const rows = [
      ["CGL INDUCTOR - PRODUCTION & DROSS REPORT"],
      [],
      ["Month", selectedMonth],
      [],
      [
        "Production (MT)",
        "Metal Charged (MT)",
        "Total Dross (MT)",
        "Dross %",
        "Dross Kg/MT",
        "Remarks",
      ],
      [
        prod.toFixed(2),
        metal.toFixed(2),
        dross.toFixed(2),
        `${drossPct}%`,
        drossKgMT,
        monthlyData.remarks || "",
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 35 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Production Dross"
    );

    XLSX.writeFile(
      workbook,
      `Production_Dross_Report_${selectedMonth}.xlsx`
    );
  };

  // =====================================================
  // PRODUCTION REPORT → PRINT / PDF
  // =====================================================

  const printProductionReport = () => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=700"
    );

    if (!printWindow) {
      alert("Please allow popups to print the report.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Production & Dross Report - ${selectedMonth}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #111;
          }
          h1 {
            text-align: center;
            font-size: 22px;
            margin-bottom: 5px;
          }
          h2 {
            text-align: center;
            font-size: 16px;
            margin-top: 0;
          }
          .month {
            text-align: center;
            margin: 20px 0;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background: #e2e8f0;
            font-weight: bold;
          }
          th,
          td {
            border: 1px solid #333;
            padding: 10px;
            text-align: center;
            font-size: 12px;
          }
          .remarks {
            margin-top: 20px;
            border: 1px solid #333;
            padding: 12px;
          }
        </style>
      </head>
      <body>
        <h1>CGL INDUCTOR</h1>
        <h2>PRODUCTION & DROSS REPORT</h2>
        <div class="month">
          Month: ${selectedMonth}
        </div>
        <table>
          <thead>
            <tr>
              <th>Production (MT)</th>
              <th>Metal Charged (MT)</th>
              <th>Total Dross (MT)</th>
              <th>Dross %</th>
              <th>Dross Kg/MT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${prod.toFixed(2)}</td>
              <td>${metal.toFixed(2)}</td>
              <td>${dross.toFixed(2)}</td>
              <td>${drossPct}%</td>
              <td>${drossKgMT}</td>
            </tr>
          </tbody>
        </table>
        <div class="remarks">
          <strong>Remarks:</strong>
          ${monthlyData.remarks || "N/A"}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // =====================================================
  // BOTTOM DROSS → EXCEL
  // =====================================================

  const exportBottomDrossExcel = () => {
    const logs = currentReport?.bottomDrossLogs || [];

    if (logs.length === 0) {
      alert("No Bottom Dross entries available for this month");
      return;
    }

    const rows = [
      ["CGL INDUCTOR - BOTTOM DROSS REPORT"],
      [],
      ["Month", selectedMonth],
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

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Bottom Dross"
    );

    XLSX.writeFile(
      workbook,
      `Bottom_Dross_Report_${selectedMonth}.xlsx`
    );
  };

  // =====================================================
  // BOTTOM DROSS → PRINT / PDF
  // =====================================================

  const printBottomDrossReport = () => {
    const logs = currentReport?.bottomDrossLogs || [];

    if (logs.length === 0) {
      alert("No Bottom Dross entries available for this month");
      return;
    }

    const tableRows = logs
      .map(
        (log) => `
          <tr>
            <td>${log.date}</td>
            <td>
              ${Number(log.quantityMT || 0).toFixed(2)}
            </td>
            <td>
              ${log.lineRemarks || "Line Active"}
            </td>
          </tr>
        `
      )
      .join("");

    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!printWindow) {
      alert("Please allow popups to print the report.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bottom Dross Report - ${selectedMonth}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #111;
          }
          h1 {
            text-align: center;
            font-size: 22px;
            margin-bottom: 5px;
          }
          h2 {
            text-align: center;
            font-size: 16px;
            margin-top: 0;
          }
          .month {
            text-align: center;
            margin: 20px 0;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background: #e2e8f0;
          }
          th,
          td {
            border: 1px solid #333;
            padding: 9px;
            font-size: 12px;
            text-align: center;
          }
          .total {
            font-weight: bold;
            background: #f1f5f9;
          }
        </style>
      </head>
      <body>
        <h1>CGL INDUCTOR</h1>
        <h2>BOTTOM DROSS REPORT</h2>
        <div class="month">
          Month: ${selectedMonth}
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
            <tr class="total">
              <td>TOTAL</td>
              <td>
                ${Number(
                  currentReport?.totalBottomDrossMT || 0
                ).toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-cyan-400">
            INDUCTOR PRODUCTION & DROSS REPORT
          </h1>
          <p className="text-xs text-slate-400">
            Production Report & Bottom Dross Report
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">
            Select Month:
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {loading && (
        <div className="text-center text-xs text-cyan-400">
          Loading report...
        </div>
      )}

      {/* ================================================= */}
      {/* PRODUCTION & DROSS REPORT */}
      {/* ================================================= */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-extrabold text-cyan-400 uppercase">
              Production & Dross Report
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Monthly Production Summary
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSaveMonthly}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg"
            >
              <Save size={14} />
              Save Monthly
            </button>

            <button
              onClick={exportProductionExcel}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
            >
              <FileSpreadsheet size={14} />
              Excel
            </button>

            <button
              onClick={printProductionReport}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
            >
              <Printer size={14} />
              PDF
            </button>
          </div>
        </div>

        {/* INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-400">
              Production (MT)
            </label>
            <input
              type="number"
              value={monthlyData.productionMT}
              onChange={(e) =>
                setMonthlyData({
                  ...monthlyData,
                  productionMT: e.target.value,
                })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">
              Metal Charged (MT)
            </label>
            <input
              type="number"
              value={monthlyData.metalChargedMT}
              onChange={(e) =>
                setMonthlyData({
                  ...monthlyData,
                  metalChargedMT: e.target.value,
                })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">
              Total Dross (MT)
            </label>
            <input
              type="number"
              value={monthlyData.totalDrossMT}
              onChange={(e) =>
                setMonthlyData({
                  ...monthlyData,
                  totalDrossMT: e.target.value,
                })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">
              Remarks
            </label>
            <input
              type="text"
              value={monthlyData.remarks}
              onChange={(e) =>
                setMonthlyData({
                  ...monthlyData,
                  remarks: e.target.value,
                })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* CALCULATED CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">
              Dross %
            </span>
            <div className="text-2xl font-extrabold text-orange-400 mt-1">
              {drossPct}%
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">
              Dross Kg/MT of Production
            </span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {drossKgMT}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* PRODUCTION HISTORY */}
      {/* ================================================= */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-cyan-400 uppercase mb-4">
          <History size={16} />
          Production & Dross Monthly History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400">
                <th className="p-3 text-left">
                  Month
                </th>
                <th className="p-3">
                  Production
                </th>
                <th className="p-3">
                  Metal Charged
                </th>
                <th className="p-3">
                  Total Dross
                </th>
                <th className="p-3">
                  Dross %
                </th>
                <th className="p-3">
                  Kg/MT
                </th>
              </tr>
            </thead>
            <tbody>
              {historyList.length > 0 ? (
                historyList.map((item) => (
                  <tr
                    key={item._id || item.monthYear}
                    className="border-b border-slate-800"
                  >
                    <td className="p-3 text-cyan-300">
                      {item.monthYear}
                    </td>
                    <td className="p-3 text-center">
                      {Number(item.productionMT || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      {Number(item.metalChargedMT || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-center text-amber-400">
                      {Number(item.totalDrossMT || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-center text-orange-400 font-bold">
                      {Number(item.drossPercent || 0).toFixed(2)}%
                    </td>
                    <td className="p-3 text-center text-emerald-400 font-bold">
                      {Number(item.drossKgPerMT || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="p-5 text-center text-slate-500"
                  >
                    No Production & Dross history available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================= */}
      {/* BOTTOM DROSS ENTRY */}
      {/* ================================================= */}
      <div className="bg-slate-900/60 border border-purple-900/50 rounded-2xl p-5">
        <div className="flex flex-wrap justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-extrabold text-purple-400 uppercase">
              Bottom Dross Report
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Date-wise Bottom Dross Entry
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAddBottomDross}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
            >
              <PlusCircle size={14} />
              Add Entry
            </button>

            <button
              onClick={exportBottomDrossExcel}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
            >
              <FileSpreadsheet size={14} />
              Excel
            </button>

            <button
              onClick={printBottomDrossReport}
              className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold px-3 py-2 rounded-lg"
            >
              <Printer size={14} />
              PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400">
              Date
            </label>
            <input
              type="date"
              value={bottomEntry.date}
              onChange={(e) =>
                setBottomEntry({
                  ...bottomEntry,
                  date: e.target.value,
                })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">
              Quantity (MT)
            </label>
            <input
              type="number"
              value={bottomEntry.quantityMT}
              onChange={(e) =>
                setBottomEntry({
                  ...bottomEntry,
                  quantityMT: e.target.value,
                })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">
              Remarks / Line Status
            </label>
            <input
              type="text"
              value={bottomEntry.lineRemarks}
              onChange={(e) =>
                setBottomEntry({
                  ...bottomEntry,
                  lineRemarks: e.target.value,
                })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* BOTTOM DROSS HISTORY */}
      {/* ================================================= */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-wrap justify-between gap-3 mb-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-purple-400 uppercase">
            <History size={16} />
            Bottom Dross History - {selectedMonth}
          </h3>

          <div className="text-xs font-bold text-purple-300">
            Total:{" "}
            {Number(
              currentReport?.totalBottomDrossMT || 0
            ).toFixed(2)}{" "}
            MT
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400">
                <th className="p-3 text-left">
                  Date
                </th>
                <th className="p-3 text-left">
                  Quantity (MT)
                </th>
                <th className="p-3 text-left">
                  Remarks / Line Status
                </th>
              </tr>
            </thead>
            <tbody>
              {currentReport?.bottomDrossLogs?.length > 0 ? (
                currentReport.bottomDrossLogs.map(
                  (log, index) => (
                    <tr
                      key={log._id || index}
                      className="border-b border-slate-800"
                    >
                      <td className="p-3 text-cyan-300">
                        {log.date}
                      </td>
                      <td className="p-3 font-bold text-purple-400">
                        {Number(log.quantityMT || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-slate-400">
                        {log.lineRemarks || "Line Active"}
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="p-5 text-center text-slate-500"
                  >
                    No Bottom Dross entries recorded for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}