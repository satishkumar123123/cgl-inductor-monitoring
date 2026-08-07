import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, ResponsiveContainer
} from "recharts";
import {
  Save, RefreshCcw, Trash2, FileSpreadsheet, FileText, UploadCloud, Download,
  Clock, Zap, Activity, Gauge
} from "lucide-react";
import ChartCard, { chartTheme } from "../components/ChartCard.jsx";
import DataTable from "../components/DataTable.jsx";
import FileUploadCard from "../components/FileUploadCard.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import useAuth from "../hooks/useAuth.js";
import useToast from "../hooks/useToast.js";
import { ROWS, POTS, emptyRecord, todayStr, fmtDateLong } from "../utils/rowsConfig.js";
import { parseExcelFile, downloadSampleTemplate, exportRecordToExcel } from "../utils/excelMapper.js";
import { fetchDataByDate, createData, updateData, deleteData } from "../services/dataService.js";

// 6 Distinct Premium Themes for 6 Inductor Blocks (Light / Pure White BG Compatible)
const BLOCK_STYLES = [
  // 1. Red / Rose Theme
  {
    bg: "bg-red-50 hover:bg-red-100",
    border: "border-red-300 hover:border-red-400",
    glow: "shadow-sm hover:shadow-md",
    title: "text-red-700 font-extrabold",
    boxBg: "bg-white border-red-200",
  },
  // 2. Yellow / Amber Theme
  {
    bg: "bg-amber-50 hover:bg-amber-100",
    border: "border-amber-300 hover:border-amber-400",
    glow: "shadow-sm hover:shadow-md",
    title: "text-amber-700 font-extrabold",
    boxBg: "bg-white border-amber-200",
  },
  // 3. Blue / Cobalt Theme
  {
    bg: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-300 hover:border-blue-400",
    glow: "shadow-sm hover:shadow-md",
    title: "text-blue-700 font-extrabold",
    boxBg: "bg-white border-blue-200",
  },
  // 4. Cyan / Teal Theme
  {
    bg: "bg-cyan-50 hover:bg-cyan-100",
    border: "border-cyan-300 hover:border-cyan-400",
    glow: "shadow-sm hover:shadow-md",
    title: "text-cyan-700 font-extrabold",
    boxBg: "bg-white border-cyan-200",
  },
  // 5. Emerald / Green Theme
  {
    bg: "bg-emerald-50 hover:bg-emerald-100",
    border: "border-emerald-300 hover:border-emerald-400",
    glow: "shadow-sm hover:shadow-md",
    title: "text-emerald-700 font-extrabold",
    boxBg: "bg-white border-emerald-200",
  },
  // 6. Purple / Violet Theme
  {
    bg: "bg-purple-50 hover:bg-purple-100",
    border: "border-purple-300 hover:border-purple-400",
    glow: "shadow-sm hover:shadow-md",
    title: "text-purple-700 font-extrabold",
    boxBg: "bg-white border-purple-200",
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user || null;

  let toast = null;
  try {
    toast = useToast();
  } catch (e) {
    console.warn("Toast Context unavailable", e);
  }

  const notify = useCallback((msg, type = "info") => {
    if (toast?.notify) toast.notify(msg, type);
    else console.log(`[Toast ${type}]: ${msg}`);
  }, [toast]);

  const location = useLocation();

  const [selectedDate, setSelectedDate] = useState(location?.state?.date || todayStr());
  const [record, setRecord] = useState(emptyRecord(todayStr()));
  const [existsOnServer, setExistsOnServer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorCells, setErrorCells] = useState(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadDate = useCallback(async (date) => {
    setLoading(true);
    setUploadResult(null);
    setErrorCells(new Set());
    try {
      const data = await fetchDataByDate(date);
      if (data && typeof data === "object") {
        setRecord(data);
        setExistsOnServer(true);
      } else {
        setRecord(emptyRecord(date));
        setExistsOnServer(false);
      }
    } catch (err) {
      console.warn("No data for date or fetch failed:", date, err?.message);
      setRecord(emptyRecord(date));
      setExistsOnServer(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDate(selectedDate);
  }, [selectedDate, loadDate]);

  const updateCell = (potKey, ind, lvl, rowId, value) => {
    setRecord((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[potKey]) next[potKey] = {};
      if (!next[potKey][ind]) next[potKey][ind] = {};
      if (!next[potKey][ind][lvl]) next[potKey][ind][lvl] = {};

      next[potKey][ind][lvl][rowId] = value;
      next.source = "manual";
      return next;
    });

    setErrorCells((prev) => {
      const s = new Set(prev);
      s.delete(`${potKey}:${ind}:${lvl}:${rowId}`);
      return s;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...record, date: selectedDate };
      let saved = null;

      if (existsOnServer) {
        try {
          saved = await updateData(selectedDate, payload);
          notify("Record updated successfully");
        } catch (updateErr) {
          if (updateErr.response?.status === 404) {
            saved = await createData(payload);
            setExistsOnServer(true);
            notify("Record saved to MongoDB");
          } else {
            throw updateErr;
          }
        }
      } else {
        saved = await createData(payload);
        setExistsOnServer(true);
        notify("Record saved to MongoDB");
      }

      if (saved) {
        setRecord(saved?.data || saved || payload);
      }
    } catch (err) {
      console.error("Save error:", err);
      notify(err?.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = () => handleSave();

  const handleDelete = () => {
    if (!existsOnServer) {
      notify("Nothing saved yet for this date", "error");
      return;
    }
    setConfirmDialog({
      title: "Delete this record?",
      message: `This permanently deletes all readings for ${fmtDateLong ? fmtDateLong(selectedDate) : selectedDate}. This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await deleteData(selectedDate);
          setRecord(emptyRecord(selectedDate));
          setExistsOnServer(false);
          notify("Record deleted successfully");
        } catch (err) {
          notify(err?.response?.data?.message || "Delete failed (Admin role required)", "error");
        }
      },
    });
  };

  const handleFile = async (file) => {
    setUploadOpen(true);
    setUploadResult(null);
    setUploadProgress(15);
    try {
      const { potUpdates, rowsImported, unmatched, errors } = await parseExcelFile(file);
      setUploadProgress(70);

      const newErrorCells = new Set();
      setRecord((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        if (potUpdates) {
          Object.entries(potUpdates).forEach(([potKey, potData]) => {
            next[potKey] = potData;
          });
        }
        next.source = "excel";
        next.uploadedFileName = file.name;
        next.uploadedTime = new Date().toISOString();
        return next;
      });

      setErrorCells(newErrorCells);
      setUploadProgress(100);
      const result = { fileName: file.name, rowsImported, unmatched, errors };
      setUploadResult(result);
      notify(`Imported ${rowsImported} rows from ${file.name}`);
    } catch (err) {
      setUploadProgress(100);
      notify("Import failed: " + err.message, "error");
    }
  };

  const exportExcel = () => {
    if (typeof exportRecordToExcel === "function") {
      exportRecordToExcel(record, `CGL_Inductor_${selectedDate}`);
    } else {
      notify("Excel export module not ready", "error");
    }
  };

  const exportPDF = () => window.print();

  /* -------------------------- SAFE DERIVED CHART DATA -------------------------- */
  const allInductorRows = useMemo(() => {
    const out = [];
    if (!record || typeof record !== "object") return out;

    const resolveChartVal = (lvlData, rowId) => {
      if (!lvlData || typeof lvlData !== "object") return 0;

      if (lvlData[rowId] !== undefined && lvlData[rowId] !== null && lvlData[rowId] !== "") {
        return parseFloat(lvlData[rowId]) || 0;
      }

      const keyAliases = {
        rPhase: ["rCurrent", "r_phase", "rPhaseCurrent"],
        yPhase: ["yCurrent", "y_phase", "yPhaseCurrent"],
        bPhase: ["bCurrent", "b_phase", "bPhaseCurrent"],
        conductanceRatio: [
          "conductanceCurrentRatio",
          "condRatio",
          "conductance_ratio",
          "cond_ratio"
        ],
        initialValue: [
          "condInitialValue",
          "conductanceInitialValue",
          "initial_value"
        ],
        kvarConnected: ["kvarConnected", "kvar_connected", "inductorKva", "kvar"],
        inductorVoltage: ["voltage", "v", "indVoltage"],
        inductorCurrent: ["current", "i", "indCurrent"],
      };

      const aliases = keyAliases[rowId] || [];
      for (const alias of aliases) {
        if (lvlData[alias] !== undefined && lvlData[alias] !== null && lvlData[alias] !== "") {
          return parseFloat(lvlData[alias]) || 0;
        }
      }

      return 0;
    };

    Object.values(POTS).forEach((pot) => {
      pot.inductors.forEach((ind) => {
        const name = pot.key === "mainPot" ? ind : `PM-${ind}`;
        const lvlData = record?.[pot.key]?.[ind]?.high || {};
        const row = { name };

        ROWS.forEach((r) => {
          row[r.id] = resolveChartVal(lvlData, r.id);
        });

        out.push(row);
      });
    });

    return out;
  }, [record]);

  /* -------------------------- SAFE MULTI-KEY INDUCTOR METRICS EXTRACTOR -------------------------- */
  const getInductorMetrics = (potKey, ind) => {
    const highLevel = record?.[potKey]?.[ind]?.high || {};
    const directLevel = record?.[potKey]?.[ind] || {};
    
    const getVal = (...keys) => {
      for (const k of keys) {
        if (highLevel[k] !== undefined && highLevel[k] !== null && highLevel[k] !== "") {
          return highLevel[k];
        }
        if (directLevel[k] !== undefined && directLevel[k] !== null && directLevel[k] !== "") {
          return directLevel[k];
        }
      }
      return "—";
    };

    const r = getVal("rPhase", "rCurrent", "r_phase", "rPhaseCurrent");
    const y = getVal("yPhase", "yCurrent", "y_phase", "yPhaseCurrent");
    const b = getVal("bPhase", "bCurrent", "b_phase", "bPhaseCurrent");

    const condRatio = getVal(
      "conductanceRatio",
      "conductanceCurrentRatio",
      "condRatio",
      "conductance_ratio",
      "cond_ratio",
      "ratio"
    );

    const initVal = getVal(
      "initialValue",
      "conductanceInitialValue",
      "conductorInitialValue",
      "condInitialValue",
      "initial_value",
      "conductance_initial_value"
    );

    const volt = getVal("inductorVoltage", "voltage", "v", "indVoltage");
    const curr = getVal("inductorCurrent", "current", "i", "indCurrent");

    return {
      voltage: volt,
      current: curr,
      rPhase: r,
      yPhase: y,
      bPhase: b,
      ratio: condRatio,
      initialValue: initVal,
    };
  };

  const ALL_BLOCKS = [
    { key: "MAIN_A", potKey: "mainPot", ind: "A", label: "Main Pot Inductor A" },
    { key: "MAIN_B", potKey: "mainPot", ind: "B", label: "Main Pot Inductor B" },
    { key: "MAIN_C", potKey: "mainPot", ind: "C", label: "Main Pot Inductor C" },
    { key: "MAIN_D", potKey: "mainPot", ind: "D", label: "Main Pot Inductor D" },
    { key: "PM_A", potKey: "pmPot", ind: "A", label: "PM Pot Inductor A" },
    { key: "PM_B", potKey: "pmPot", ind: "B", label: "PM Pot Inductor B" },
  ];

  // Router handler to navigate to dedicated inductor page
  const handleCardClick = (key) => {
    navigate(`/inductor/${key}`);
  };

  if (loading) return <LoadingSpinner label="Loading readings…" />;

  return (
    <div className="flex flex-col gap-6 p-6 bg-white min-h-screen text-slate-900 font-sans">
      
      {/* TOOLBAR */}
      <div className="no-print flex flex-wrap items-center gap-2.5 bg-slate-100 border border-slate-200 rounded-2xl p-3.5 shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600"
          />
        </div>
        <button onClick={() => setUploadOpen((o) => !o)} className="toolbar-btn bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"><UploadCloud size={14} /> Upload Excel</button>
        <button onClick={downloadSampleTemplate} className="toolbar-btn bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"><Download size={14} /> Sample Excel</button>
        <button onClick={handleSave} disabled={saving} className="toolbar-btn-primary bg-cyan-600 hover:bg-cyan-700 text-white font-bold"><Save size={14} /> {saving ? "Saving…" : "Save"}</button>
        <button onClick={handleUpdate} disabled={saving} className="toolbar-btn bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"><RefreshCcw size={14} /> Update</button>
        {user?.role === "Admin" && (
          <button onClick={handleDelete} className="toolbar-btn-danger bg-red-600 hover:bg-red-700 text-white"><Trash2 size={14} /> Delete</button>
        )}
        <button onClick={exportExcel} className="toolbar-btn bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"><FileSpreadsheet size={14} /> Export Excel</button>
        <button onClick={exportPDF} className="toolbar-btn bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"><FileText size={14} /> Export PDF / Print</button>
      </div>

      <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
        Showing <b className="text-cyan-700">{fmtDateLong ? fmtDateLong(selectedDate) : selectedDate}</b>
        {record?.lastUpdated && <>· Last updated {new Date(record.lastUpdated).toLocaleString()}</>}
        {record?.source === "excel" && record?.uploadedFileName && <>· Source: Excel ({record.uploadedFileName})</>}
        {!existsOnServer && <span className="flex items-center gap-1 text-amber-600 font-medium"><Clock size={11} /> Not yet saved</span>}
      </div>

      {uploadOpen && (
        <FileUploadCard
          onFile={handleFile}
          progress={uploadProgress}
          result={uploadResult}
          onClose={() => { setUploadOpen(false); setUploadProgress(null); }}
        />
      )}

      {/* TOP 6 CLICKABLE INDUCTOR CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {ALL_BLOCKS.map((item, idx) => {
          const metrics = getInductorMetrics(item.potKey, item.ind);
          const style = BLOCK_STYLES[idx % BLOCK_STYLES.length];

          return (
            <div
              key={item.key}
              onClick={() => handleCardClick(item.key)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.02] group ${style.bg} ${style.border} ${style.glow}`}
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-3">
                <span className={`text-xs uppercase tracking-wide ${style.title}`}>
                  {item.label}
                </span>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                  View &rarr;
                </span>
              </div>

              {/* INDIVIDUAL PARAMETER DISPLAY */}
              <div className="space-y-2 text-xs">
                <div className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg border ${style.boxBg}`}>
                  <span className="text-sky-600 font-semibold flex items-center gap-1">
                    <Activity size={12} className="text-sky-500" /> Voltage:
                  </span>
                  <span className="font-extrabold text-slate-800">
                    {metrics.voltage} {metrics.voltage !== "—" && "V"}
                  </span>
                </div>

                <div className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg border ${style.boxBg}`}>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Gauge size={12} className="text-emerald-500" /> Current:
                  </span>
                  <span className="font-extrabold text-slate-800">
                    {metrics.current} {metrics.current !== "—" && "A"}
                  </span>
                </div>

                <div className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg border ${style.boxBg}`}>
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <Zap size={12} className="text-amber-500" /> Ratio:
                  </span>
                  <span className="font-extrabold text-slate-800">
                    {metrics.ratio}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DATA TABLES */}
      <div className="flex flex-col gap-5">
        <DataTable 
          potKey="mainPot" 
          potLabel="MAIN POT" 
          inductors={POTS.mainPot.inductors} 
          potData={record?.mainPot || {}} 
          onChange={updateCell} 
          errorCells={errorCells} 
        />
        <DataTable 
          potKey="pmPot" 
          potLabel="PM POT" 
          inductors={POTS.pmPot.inductors} 
          potData={record?.pmPot || {}} 
          onChange={updateCell} 
          errorCells={errorCells} 
        />
      </div>

      {/* SHIFT META SECTION */}
      <div className="no-print grid gap-3 bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-sm" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div>
          <div className="text-[10.5px] uppercase font-bold text-slate-500 mb-1">Created By</div>
          <div className="text-sm font-semibold text-slate-800">{record?.createdByName || user?.name || "—"}</div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase font-bold text-slate-500 mb-1">Daily Status</div>
          <select
            value={record?.status || "Normal"}
            onChange={(e) => setRecord((p) => ({ ...p, status: e.target.value }))}
            className="select-input w-full bg-white border-slate-300 text-slate-800"
          >
            <option>Excellent</option>
            <option>Normal</option>
            <option>Needs Attention</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <div className="text-[10.5px] uppercase font-bold text-slate-500 mb-1">Remarks</div>
          <input
            value={record?.remarks || ""}
            onChange={(e) => setRecord((p) => ({ ...p, remarks: e.target.value }))}
            placeholder="Shift observations…"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-600"
          />
        </div>
      </div>

      {/* TRENDS & CHARTS SECTION */}
      <div>
        <h2 className="text-base font-black text-slate-900 mb-3.5 tracking-wide flex items-center gap-2">
          <span className="text-cyan-600">▍</span> DASHBOARD &amp; TRENDS ANALYTICS
        </h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
          <ChartCard title="Three Phase Current">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="rPhase" name="R Phase" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="yPhase" name="Y Phase" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bPhase" name="B Phase" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Power">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Bar dataKey="power" name="Power (kW)" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Voltage">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} domain={["auto", "auto"]} /><Tooltip />
                <Line type="monotone" dataKey="inductorVoltage" name="Voltage (V)" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Current">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Line type="monotone" dataKey="lineCurrent" name="Line Current (A)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Power Factor">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} domain={[0, 1]} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="linePF" name="Line PF" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="inductorPF" name="Inductor PF" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Inductor Current">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Bar dataKey="inductorCurrent" name="Inductor Current (A)" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Impedance / Resistance / Reactance">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="impedanceZ" name="Impedance" stroke="#0284c7" strokeWidth={2} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="resistanceR" name="Resistance" stroke="#ea580c" strokeWidth={2} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="reactanceX" name="Reactance" stroke="#2563eb" strokeWidth={2} dot={{ r: 2.5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Conductance Ratio">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Line type="monotone" dataKey="conductanceRatio" name="Conductance Ratio" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="KVAR Connected">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Bar dataKey="kvarConnected" name="KVAR Connected" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Balancing KVAR">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Bar dataKey="balancingKvar" name="Balancing KVAR" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={async () => {
          const d = confirmDialog;
          setConfirmDialog(null);
          if (d?.onConfirm) await d.onConfirm();
        }}
      />
    </div>
  );
}