import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, ResponsiveContainer
} from "recharts";
import {
  Save, RefreshCcw, Trash2, FileSpreadsheet, FileText, Search, UploadCloud, Download,
  Settings2, Clock, Zap, Activity, Gauge
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

// Unique attractive gradients for each inductor block
const BLOCK_STYLES = [
  {
    bg: "bg-gradient-to-br from-cyan-950/80 via-slate-900/90 to-blue-950/80",
    border: "border-cyan-500/40 hover:border-cyan-400",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    glow: "shadow-[0_0_15px_rgba(6,182,212,0.15)]",
  },
  {
    bg: "bg-gradient-to-br from-amber-950/80 via-slate-900/90 to-orange-950/80",
    border: "border-amber-500/40 hover:border-amber-400",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
  },
  {
    bg: "bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-teal-950/80",
    border: "border-emerald-500/40 hover:border-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
  },
  {
    bg: "bg-gradient-to-br from-purple-950/80 via-slate-900/90 to-violet-950/80",
    border: "border-purple-500/40 hover:border-purple-400",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.15)]",
  },
  {
    bg: "bg-gradient-to-br from-rose-950/80 via-slate-900/90 to-pink-950/80",
    border: "border-rose-500/40 hover:border-rose-400",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    glow: "shadow-[0_0_15px_rgba(244,63,94,0.15)]",
  },
  {
    bg: "bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-blue-950/80",
    border: "border-indigo-500/40 hover:border-indigo-400",
    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    glow: "shadow-[0_0_15px_rgba(99,102,241,0.15)]",
  },
];

export default function DashboardPage() {
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

  const [potFilter, setPotFilter] = useState("all");
  const [paramFilter, setParamFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [chartLevel, setChartLevel] = useState("high");

  const [errorCells, setErrorCells] = useState(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // FIXED: No toast spam loop on empty date
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
      // Safely set empty record without triggering toast notification spam loop
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
        const lvlData = record?.[pot.key]?.[ind]?.[chartLevel] || {};
        const row = { name };

        ROWS.forEach((r) => {
          row[r.id] = resolveChartVal(lvlData, r.id);
        });

        out.push(row);
      });
    });

    return out;
  }, [record, chartLevel]);

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
    { potKey: "mainPot", ind: "A", label: "Main Pot Inductor A" },
    { potKey: "mainPot", ind: "B", label: "Main Pot Inductor B" },
    { potKey: "mainPot", ind: "C", label: "Main Pot Inductor C" },
    { potKey: "mainPot", ind: "D", label: "Main Pot Inductor D" },
    { potKey: "pmPot", ind: "A", label: "PM Pot Inductor A" },
    { potKey: "pmPot", ind: "B", label: "PM Pot Inductor B" },
  ];

  if (loading) return <LoadingSpinner label="Loading readings…" />;

  return (
    <div className="flex flex-col gap-6">
      {/* TOOLBAR */}
      <div className="no-print flex flex-wrap items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-slate-500">Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
          />
        </div>
        <button onClick={() => setUploadOpen((o) => !o)} className="toolbar-btn"><UploadCloud size={14} /> Upload Excel</button>
        <button onClick={downloadSampleTemplate} className="toolbar-btn"><Download size={14} /> Sample Excel</button>
        <button onClick={handleSave} disabled={saving} className="toolbar-btn-primary"><Save size={14} /> {saving ? "Saving…" : "Save"}</button>
        <button onClick={handleUpdate} disabled={saving} className="toolbar-btn"><RefreshCcw size={14} /> Update</button>
        {user?.role === "Admin" && (
          <button onClick={handleDelete} className="toolbar-btn-danger"><Trash2 size={14} /> Delete</button>
        )}
        <button onClick={exportExcel} className="toolbar-btn"><FileSpreadsheet size={14} /> Export Excel</button>
        <button onClick={exportPDF} className="toolbar-btn"><FileText size={14} /> Export PDF / Print</button>
      </div>

      <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
        Showing <b className="text-cyan-400">{fmtDateLong ? fmtDateLong(selectedDate) : selectedDate}</b>
        {record?.lastUpdated && <>· Last updated {new Date(record.lastUpdated).toLocaleString()}</>}
        {record?.source === "excel" && record?.uploadedFileName && <>· Source: Excel ({record.uploadedFileName})</>}
        {!existsOnServer && <span className="flex items-center gap-1 text-orange-400"><Clock size={11} /> Not yet saved</span>}
      </div>

      {uploadOpen && (
        <FileUploadCard
          onFile={handleFile}
          progress={uploadProgress}
          result={uploadResult}
          onClose={() => { setUploadOpen(false); setUploadProgress(null); }}
        />
      )}

      {/* RECTANGULAR BLOCKS ARRANGED IN 3-3 GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {ALL_BLOCKS.map((item, idx) => {
          const metrics = getInductorMetrics(item.potKey, item.ind);
          const style = BLOCK_STYLES[idx % BLOCK_STYLES.length];

          return (
            <div
              key={`${item.potKey}-${item.ind}`}
              className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] ${style.bg} ${style.border} ${style.glow}`}
            >
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-3">
                <span className="font-extrabold text-sm text-white uppercase tracking-wide">
                  {item.label}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                  High Level
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1"><Activity size={12} className="text-blue-400" /> Voltage:</span>
                  <span className="font-bold text-white">{metrics.voltage} {metrics.voltage !== "—" && "V"}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1"><Gauge size={12} className="text-cyan-400" /> Current:</span>
                  <span className="font-bold text-white">{metrics.current} {metrics.current !== "—" && "A"}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1"><Zap size={12} className="text-amber-400" /> Conductance Ratio:</span>
                  <span className="font-bold text-cyan-300">{metrics.ratio}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTERS */}
      <div className="no-print flex flex-wrap items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl p-3 backdrop-blur-md">
        <Settings2 size={14} className="text-slate-500" />
        <select value={potFilter} onChange={(e) => setPotFilter(e.target.value)} className="select-input">
          <option value="all">All Pots</option>
          <option value="mainPot">Main Pot</option>
          <option value="pmPot">PM Pot</option>
        </select>
        <select value={paramFilter} onChange={(e) => setParamFilter(e.target.value)} className="select-input">
          <option value="all">All Parameters</option>
          {ROWS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-700 rounded-lg px-2.5 py-1.5">
          <Search size={13} className="text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search parameter…" className="bg-transparent outline-none text-xs w-36 text-white" />
        </div>
        <select value={chartLevel} onChange={(e) => setChartLevel(e.target.value)} className="select-input ml-auto">
          <option value="high">Charts: High level</option>
          <option value="intermediate">Charts: Intermediate level</option>
        </select>
      </div>

      {/* TABLES */}
      <div className="flex flex-col gap-4">
        {(potFilter === "all" || potFilter === "mainPot") && (
          <DataTable potKey="mainPot" potLabel="MAIN POT" inductors={POTS.mainPot.inductors} potData={record?.mainPot || {}} onChange={updateCell} search={search} paramFilter={paramFilter} errorCells={errorCells} />
        )}
        {(potFilter === "all" || potFilter === "pmPot") && (
          <DataTable potKey="pmPot" potLabel="PM POT" inductors={POTS.pmPot.inductors} potData={record?.pmPot || {}} onChange={updateCell} search={search} paramFilter={paramFilter} errorCells={errorCells} />
        )}
      </div>

      {/* META */}
      <div className="no-print grid gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div>
          <div className="text-[10.5px] uppercase text-slate-500 mb-1">Created By</div>
          <div className="text-sm text-slate-200">{record?.createdByName || user?.name || "—"}</div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase text-slate-500 mb-1">Daily Status</div>
          <select
            value={record?.status || "Normal"}
            onChange={(e) => setRecord((p) => ({ ...p, status: e.target.value }))}
            className="select-input w-full"
          >
            <option>Excellent</option>
            <option>Normal</option>
            <option>Needs Attention</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <div className="text-[10.5px] uppercase text-slate-500 mb-1">Remarks</div>
          <input
            value={record?.remarks || ""}
            onChange={(e) => setRecord((p) => ({ ...p, remarks: e.target.value }))}
            placeholder="Shift observations…"
            className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      {/* CHARTS */}
      <div>
        <h2 className="text-[15px] font-extrabold text-white mb-3.5"><span className="text-cyan-400">▍</span> Dashboard &amp; Trends</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
          <ChartCard title="Three Phase Current">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke={chartTheme?.grid || "#334155"} vertical={false} />
                <XAxis dataKey="name" tick={chartTheme?.tick} /><YAxis tick={chartTheme?.tick} /><Tooltip {...chartTheme?.tooltip} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="rPhase" name="R Phase" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="yPhase" name="Y Phase" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bPhase" name="B Phase" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Power">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke={chartTheme?.grid || "#334155"} vertical={false} />
                <XAxis dataKey="name" tick={chartTheme?.tick} /><YAxis tick={chartTheme?.tick} /><Tooltip {...chartTheme?.tooltip} />
                <Bar dataKey="power" name="Power (kW)" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Voltage">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke={chartTheme?.grid || "#334155"} vertical={false} />
                <XAxis dataKey="name" tick={chartTheme?.tick} /><YAxis tick={chartTheme?.tick} domain={["auto", "auto"]} /><Tooltip {...chartTheme?.tooltip} />
                <Line type="monotone" dataKey="inductorVoltage" name="Voltage (V)" stroke="#22D3EE" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Current">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke={chartTheme?.grid || "#334155"} vertical={false} />
                <XAxis dataKey="name" tick={chartTheme?.tick} /><YAxis tick={chartTheme?.tick} /><Tooltip {...chartTheme?.tooltip} />
                <Line type="monotone" dataKey="lineCurrent" name="Line Current (A)" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Power Factor">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke={chartTheme?.grid || "#334155"} vertical={false} />
                <XAxis dataKey="name" tick={chartTheme?.tick} /><YAxis tick={chartTheme?.tick} domain={[0, 1]} /><Tooltip {...chartTheme?.tooltip} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="linePF" name="Line PF" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="inductorPF" name="Inductor PF" stroke="#22D3EE" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Inductor Current">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke={chartTheme?.grid || "#334155"} vertical={false} />
                <XAxis dataKey="name" tick={chartTheme?.tick} /><YAxis tick={chartTheme?.tick} /><Tooltip {...chartTheme?.tooltip} />
                <Bar dataKey="inductorCurrent" name="Inductor Current (A)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Impedance / Resistance / Reactance">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={allInductorRows}>
                <CartesianGrid stroke={chartTheme?.grid || "#334155"} vertical={false} />
                <XAxis dataKey="name" tick={chartTheme?.tick} /><YAxis tick={chartTheme?.tick} /><Tooltip {...chartTheme?.tooltip} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="impedanceZ" name="Impedance" stroke="#22D3EE" strokeWidth={2} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="resistanceR" name="Resistance" stroke="#F97316" strokeWidth={2} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="reactanceX" name="Reactance" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2.5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Conductance Ratio">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke={chartTheme?.grid || "#334155"} vertical={false} />
                <XAxis dataKey="name" tick={chartTheme?.tick} /><YAxis tick={chartTheme?.tick} /><Tooltip {...chartTheme?.tooltip} />
                <Line type="monotone" dataKey="conductanceRatio" name="Conductance Ratio" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="KVAR Connected">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke={chartTheme?.grid || "#334155"} vertical={false} />
                <XAxis dataKey="name" tick={chartTheme?.tick} /><YAxis tick={chartTheme?.tick} /><Tooltip {...chartTheme?.tooltip} />
                <Bar dataKey="kvarConnected" name="KVAR Connected" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Balancing KVAR">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke={chartTheme?.grid || "#334155"} vertical={false} />
                <XAxis dataKey="name" tick={chartTheme?.tick} /><YAxis tick={chartTheme?.tick} /><Tooltip {...chartTheme?.tooltip} />
                <Bar dataKey="balancingKvar" name="Balancing KVAR" fill="#F97316" radius={[4, 4, 0, 0]} />
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