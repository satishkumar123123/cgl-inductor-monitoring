import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, ResponsiveContainer
} from "recharts";
import {
  Save, FileSpreadsheet, FileText, UploadCloud, Download,
  Zap, Activity, Gauge, Calendar, Lock, XCircle
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
import { fetchDataByDate, createData, updateData } from "../services/dataService.js";

// Save Authorization Password
const SAVE_AUTH_PASSWORD = "1234";

// 6 Custom Colors with User Specified Hex Codes
const BLOCK_STYLES = [
  // 1. MAIN POT INDUCTOR A - Olive Green (#6B8E23)
  {
    hexBg: "#6B8E23",
    border: "border-[#55721B]",
    glow: "shadow-sm hover:shadow-md",
    title: "text-white font-extrabold",
    boxBg: "bg-white/90 border-[#55721B]/30",
  },
  // 2. MAIN POT INDUCTOR B - Terracotta / Dark Orange (#E2725B)
  {
    hexBg: "#E2725B",
    border: "border-[#C85A43]",
    glow: "shadow-sm hover:shadow-md",
    title: "text-white font-extrabold",
    boxBg: "bg-white/90 border-[#C85A43]/30",
  },
  // 3. MAIN POT INDUCTOR C - Navy Blue / Dark Blue (#1E315A)
  {
    hexBg: "#1E315A",
    border: "border-[#132243]",
    glow: "shadow-sm hover:shadow-md",
    title: "text-white font-extrabold",
    boxBg: "bg-white/90 border-[#132243]/30",
  },
  // 4. MAIN POT INDUCTOR D - Mustard Yellow / Gold (#E1B382)
  {
    hexBg: "#E1B382",
    border: "border-[#C89B67]",
    glow: "shadow-sm hover:shadow-md",
    title: "text-slate-900 font-extrabold",
    boxBg: "bg-white/90 border-[#C89B67]/30",
  },
  // 5. PM POT INDUCTOR A - Emerald Green / Medium Green (#3CB371)
  {
    hexBg: "#3CB371",
    border: "border-[#2E9B5B]",
    glow: "shadow-sm hover:shadow-md",
    title: "text-white font-extrabold",
    boxBg: "bg-white/90 border-[#2E9B5B]/30",
  },
  // 6. PM POT INDUCTOR B - Deep Rust Brown (#B5651D)
  {
    hexBg: "#B5651D",
    border: "border-[#964E11]",
    glow: "shadow-sm hover:shadow-md",
    title: "text-white font-extrabold",
    boxBg: "bg-white/90 border-[#964E11]/30",
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user || null;

  const dateInputRef = useRef(null);

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

  // Password Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

  // 1. Open Password Modal when user clicks Save button
  const handleSaveClick = () => {
    setPasswordError("");
    setEnteredPassword("");
    setShowPasswordModal(true);
  };

  // 2. Actual Save function (Triggered only after correct password)
  const executeSave = async () => {
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

  // 3. Verify Password and Proceed
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (enteredPassword !== SAVE_AUTH_PASSWORD) {
      setPasswordError("Galat Password! Kripya sahi password (1234) enter karein.");
      return;
    }

    setShowPasswordModal(false);
    await executeSave();
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

    Object.keys(POTS).forEach((potKey) => {
      const pot = POTS[potKey];
      if (pot && pot.inductors) {
        pot.inductors.forEach((ind) => {
          const name = potKey === "mainPot" ? ind : `PM-${ind}`;
          const lvlData = record?.[potKey]?.[ind]?.high || record?.[potKey]?.[ind] || {};
          const row = { name };

          ROWS.forEach((r) => {
            row[r.id] = resolveChartVal(lvlData, r.id);
          });

          out.push(row);
        });
      }
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

  const handleCardClick = (key) => {
    navigate(`/inductor/${key}`);
  };

  if (loading) return <LoadingSpinner label="Loading readings…" />;

  return (
    <div className="flex flex-col gap-6 p-6 bg-white min-h-screen text-slate-900 font-sans relative">
      
      {/* TOOLBAR WITH VIBRANT COLORS */}
      <div className="no-print flex flex-wrap items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-sm">
        
        {/* DATE PICKER BLOCK */}
        <div className="flex flex-col gap-1 bg-cyan-50/80 border border-cyan-200 px-3 py-1 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-black text-cyan-800">Select Date</span>
          <div 
            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
            className="flex items-center gap-2 bg-white border border-cyan-300 rounded-lg px-2.5 py-1 cursor-pointer hover:border-cyan-500 transition-colors"
          >
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || todayStr())}
              className="bg-transparent text-xs font-bold text-cyan-900 focus:outline-none cursor-pointer w-full"
            />
            <Calendar size={15} className="text-cyan-700 flex-shrink-0" />
          </div>
        </div>

        {/* UPLOAD EXCEL (EMERALD GREEN) */}
        <button 
          onClick={() => setUploadOpen((o) => !o)} 
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <UploadCloud size={15} /> Upload Excel
        </button>

        {/* SAMPLE EXCEL (BLUE THEME) */}
        <button 
          onClick={downloadSampleTemplate} 
          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Download size={15} /> Sample Excel
        </button>

        {/* SAVE BUTTON (TRIGGERS PASSWORD MODAL) */}
        <button 
          onClick={handleSaveClick} 
          disabled={saving} 
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Save size={15} /> {saving ? "Saving…" : "Save"}
        </button>

        {/* EXPORT EXCEL (TEAL / DARK GREEN) */}
        <button 
          onClick={exportExcel} 
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <FileSpreadsheet size={15} /> Export Excel
        </button>

        {/* EXPORT PDF / PRINT (PURPLE THEME) */}
        <button 
          onClick={exportPDF} 
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <FileText size={15} /> Export PDF / Print
        </button>

        {/* BALANCING KVAR (PINK THEME) */}
        <button 
          onClick={() => navigate("/balancing-kvar")} 
          className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Zap size={15} /> Balancing KVAR
        </button>

      </div>

      {/* PASSWORD CONFIRMATION MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                  Authorization Required
                </h3>
                <p className="text-[11px] text-slate-500">
                  Data save karne ke liye password daalein.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Password
                </label>
                <input
                  type="password"
                  autoFocus
                  value={enteredPassword}
                  onChange={(e) => {
                    setEnteredPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition-all"
                />
                {passwordError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                    <XCircle size={13} /> {passwordError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Verify &amp; Save
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

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
              style={{ backgroundColor: style.hexBg }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.03] group ${style.border} ${style.glow}`}
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2 mb-3">
                <span className={`text-xs uppercase tracking-wide ${style.title}`}>
                  {item.label}
                </span>
                <span className="text-[10px] font-bold text-white/80 group-hover:text-white transition-colors">
                  Click Me &rarr;
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg border shadow-xs ${style.boxBg}`}>
                  <span className="text-sky-700 font-bold flex items-center gap-1">
                    <Activity size={12} className="text-sky-600" /> Voltage:
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {metrics.voltage} {metrics.voltage !== "—" && "V"}
                  </span>
                </div>

                <div className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg border shadow-xs ${style.boxBg}`}>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Gauge size={12} className="text-emerald-600" /> Current:
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {metrics.current} {metrics.current !== "—" && "A"}
                  </span>
                </div>

                <div className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg border shadow-xs ${style.boxBg}`}>
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <Zap size={12} className="text-amber-600" /> CR Ratio:
                  </span>
                  <span className="font-extrabold text-slate-900">
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
        <h2 className="text-base font-black text-slate-900 mb-4 tracking-wide flex items-center gap-2">
          <span className="text-purple-600 animate-pulse">▍</span> 
          <span className="text-cyan-700">DASHBOARD</span> &amp; 
          <span className="text-amber-700">TRENDS</span> 
          <span className="text-emerald-700">ANALYTICS</span>
        </h2>

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
          
          {/* 1. THREE PHASE CURRENT */}
          <ChartCard title={<span className="text-rose-600 font-extrabold uppercase">Three Phase Current</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" interval={0} tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="rPhase" name="R Phase" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="yPhase" name="Y Phase" fill="#EAB308" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bPhase" name="B Phase" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 2. POWER */}
          <ChartCard title={<span className="text-amber-600 font-extrabold uppercase">Power (kW)</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" interval={0} tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Bar dataKey="power" name="Power (kW)" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 3. VOLTAGE */}
          <ChartCard title={<span className="text-sky-600 font-extrabold uppercase">Voltage (V)</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" interval={0} tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} domain={["auto", "auto"]} /><Tooltip />
                <Line type="monotone" dataKey="inductorVoltage" name="Voltage (V)" stroke="#0284C7" strokeWidth={3} dot={{ r: 4, fill: "#0284C7" }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 4. CURRENT */}
          <ChartCard title={<span className="text-blue-600 font-extrabold uppercase">Line Current (A)</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" interval={0} tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Line type="monotone" dataKey="lineCurrent" name="Line Current (A)" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 4, fill: "#1D4ED8" }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 5. POWER FACTOR */}
          <ChartCard title={<span className="text-purple-600 font-extrabold uppercase">Power Factor</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" interval={0} tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} domain={[0, 1]} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="linePF" name="Line PF" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="inductorPF" name="Inductor PF" stroke="#EC4899" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 6. INDUCTOR CURRENT */}
          <ChartCard title={<span className="text-emerald-600 font-extrabold uppercase">Inductor Current (A)</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" interval={0} tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Bar dataKey="inductorCurrent" name="Inductor Current (A)" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 7. IMPEDANCE / RESISTANCE / REACTANCE */}
          <ChartCard title={<span className="text-indigo-600 font-extrabold uppercase">Impedance / Resistance / Reactance</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" interval={0} tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="impedanceZ" name="Impedance" stroke="#0284C7" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="resistanceR" name="Resistance" stroke="#EA580C" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="reactanceX" name="Reactance" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 8. CONDUCTANCE RATIO */}
          <ChartCard title={<span className="text-orange-600 font-extrabold uppercase">Conductance Ratio</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" interval={0} tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Line type="monotone" dataKey="conductanceRatio" name="Conductance Ratio" stroke="#EA580C" strokeWidth={3} dot={{ r: 4, fill: "#EA580C" }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 9. KVAR CONNECTED */}
          <ChartCard title={<span className="text-cyan-600 font-extrabold uppercase">KVAR Connected</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allInductorRows}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" interval={0} tick={{ fill: "#475569" }} /><YAxis tick={{ fill: "#475569" }} /><Tooltip />
                <Bar dataKey="kvarConnected" name="KVAR Connected" fill="#0891B2" radius={[4, 4, 0, 0]} />
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