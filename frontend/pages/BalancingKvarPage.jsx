import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, History, Calendar, Trash2, Zap, CheckCircle2 } from "lucide-react";
import axios from "axios";

// 6 Inductors with Exact Custom Hex Backgrounds and Light Text/Border Codes
const INDUCTORS = [
  { 
    key: "MAIN_A", 
    title: "Main Pot Inductor A", 
    tag: "Main Pot",
    hexBg: "#3F51B5",
    hexLight: "#C5CAE9",
  },
  { 
    key: "MAIN_B", 
    title: "Main Pot Inductor B", 
    tag: "Main Pot",
    hexBg: "#009688",
    hexLight: "#B2DFDB",
  },
  { 
    key: "MAIN_C", 
    title: "Main Pot Inductor C", 
    tag: "Main Pot",
    hexBg: "#FF5722",
    hexLight: "#FFE0B2",
  },
  { 
    key: "MAIN_D", 
    title: "Main Pot Inductor D", 
    tag: "Main Pot",
    hexBg: "#8BC34A",
    hexLight: "#DCEDC8",
  },
  { 
    key: "PM_A", 
    title: "PM Pot Inductor A", 
    tag: "PM Pot",
    hexBg: "#FFC107",
    hexLight: "#FFF8E1",
  },
  { 
    key: "PM_B", 
    title: "PM Pot Inductor B", 
    tag: "PM Pot",
    hexBg: "#00BCD4",
    hexLight: "#E0F7FA",
  },
];

export default function BalancingKvarPage() {
  const navigate = useNavigate();
  const dateInputRef = useRef(null);

  const [selectedInductor, setSelectedInductor] = useState(INDUCTORS[0]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [initialKvar, setInitialKvar] = useState(0);
  const [removedKvar, setRemovedKvar] = useState(0);
  const [addKvar, setAddKvar] = useState(0);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto calculate Actual KVAR
  const actualKvar = (parseFloat(initialKvar) || 0) - (parseFloat(removedKvar) || 0) + (parseFloat(addKvar) || 0);

  useEffect(() => {
    if (selectedInductor) {
      fetchHistory(selectedInductor.key);
    }
  }, [selectedInductor]);

  const fetchHistory = async (key) => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`/api/balancing-kvar/${key}`);
      if (res.data?.success) {
        setHistoryList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      inductorKey: selectedInductor.key,
      inductorTitle: selectedInductor.title,
      date,
      initialKvar: parseFloat(initialKvar) || 0,
      removedKvar: parseFloat(removedKvar) || 0,
      addKvar: parseFloat(addKvar) || 0,
      actualKvar,
    };

    try {
      const res = await axios.post("/api/balancing-kvar", payload);
      if (res.data?.success) {
        setHistoryList((prev) => [res.data.data, ...prev]);
        setRemovedKvar(0);
        setAddKvar(0);
        alert(`Saved balancing KVAR for ${selectedInductor.title}!`);
      }
    } catch (err) {
      alert("Error saving record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      const res = await axios.delete(`/api/balancing-kvar/${id}`);
      if (res.data?.success) {
        setHistoryList((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    /* PURE WHITE PAGE BACKGROUND */
    <div className="min-h-screen bg-white text-slate-900 p-6 sm:p-8 space-y-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            {/* WORDWISE DIFFERENT COLORS FOR MAIN HEADING */}
            <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Zap className="text-yellow-500 fill-yellow-500" size={26} />
              <span className="text-pink-600">Balancing</span>
              <span className="text-blue-600">KVAR</span>
              <span className="text-purple-600">Management</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Select an inductor block to calculate and store historical Initial, Removed, and Added KVAR logs
            </p>
          </div>
        </div>

        {/* DATE SELECTOR WITH CALENDAR ICON */}
        <div 
          onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
          className="flex items-center gap-2 bg-pink-50 border border-pink-300 rounded-xl px-3.5 py-2 cursor-pointer hover:border-pink-500 transition-colors shadow-xs"
        >
          <Calendar size={18} className="text-pink-600 flex-shrink-0 animate-bounce" />
          <span className="text-xs font-black text-pink-700 uppercase">Entry Date:</span>
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-xs font-extrabold text-slate-900 outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* 1. TOP SECTION: LIGHT YELLOW / PEACH CARD BACKGROUND WITH 6 CUSTOM HEX COLOR CARDS */}
      <div className="bg-amber-50/90 border-2 border-amber-200 p-6 rounded-3xl shadow-sm space-y-4">
        {/* WORDWISE DIFFERENT COLORS FOR STEP 1 */}
        <h2 className="text-xs font-black uppercase tracking-wider flex gap-1.5">
          <span className="text-rose-600">Step</span>
          <span className="text-orange-600">1:</span>
          <span className="text-amber-700">Select</span>
          <span className="text-emerald-700">Inductor</span>
          <span className="text-cyan-700">Block</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {INDUCTORS.map((item) => {
            const isSelected = selectedInductor.key === item.key;
            return (
              <div
                key={item.key}
                onClick={() => setSelectedInductor(item)}
                style={{
                  backgroundColor: item.hexBg,
                  borderColor: item.hexLight,
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between relative shadow-sm hover:scale-[1.03] ${
                  isSelected ? "ring-4 ring-offset-2 ring-slate-800 scale-[1.03] shadow-md" : ""
                }`}
              >
                {isSelected && (
                  <CheckCircle2 size={18} className="absolute top-3 right-3 text-white drop-shadow-sm" />
                )}
                <span 
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    color: item.hexLight,
                    borderColor: item.hexLight,
                  }}
                  className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border w-fit mb-2 backdrop-blur-xs"
                >
                  {item.tag}
                </span>
                <h3 
                  style={{ color: item.hexLight }}
                  className="text-xs font-black uppercase tracking-wide drop-shadow-xs"
                >
                  {item.title}
                </h3>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MIDDLE SECTION: 4 KVAR INPUT BLOCKS */}
      <form onSubmit={handleSave} className="bg-slate-50/80 border border-slate-200 p-6 rounded-3xl space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          {/* WORDWISE DIFFERENT COLORS FOR STEP 2 */}
          <h2 className="text-sm font-black uppercase tracking-wide flex gap-1.5">
            <span className="text-indigo-600">Step</span>
            <span className="text-purple-600">2:</span>
            <span className="text-pink-600">Enter</span>
            <span className="text-rose-600">Readings</span>
            <span className="text-teal-600">for</span>
            <span className="text-slate-800">[{selectedInductor.title}]</span>
          </h2>
          <span className="text-xs text-slate-500 font-bold">
            <span className="text-pink-600">Selected</span> <span className="text-blue-600">Date:</span> {date}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* BLOCK 1: INITIAL KVAR (PINK THEME) */}
          <div className="bg-pink-50/60 border-2 border-pink-200 p-4 rounded-2xl space-y-2 shadow-xs">
            <span className="text-xs font-black uppercase tracking-wide flex gap-1">
              <span className="text-pink-600">1. Initial</span>
              <span className="text-purple-600">KVAR</span>
            </span>
            <input
              type="number"
              step="any"
              value={initialKvar}
              onChange={(e) => setInitialKvar(e.target.value)}
              className="w-full text-2xl font-black text-pink-700 bg-white border border-pink-300 rounded-xl p-2.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all"
            />
          </div>

          {/* BLOCK 2: REMOVED KVAR */}
          <div className="bg-red-50/60 border-2 border-red-200 p-4 rounded-2xl space-y-2 shadow-xs">
            <span className="text-xs font-black uppercase tracking-wide flex gap-1">
              <span className="text-red-600">2. Removed</span>
              <span className="text-orange-600">KVAR</span>
              <span className="text-rose-600">(-)</span>
            </span>
            <input
              type="number"
              step="any"
              value={removedKvar}
              onChange={(e) => setRemovedKvar(e.target.value)}
              className="w-full text-2xl font-black text-red-700 bg-white border border-red-300 rounded-xl p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          {/* BLOCK 3: ADD KVAR */}
          <div className="bg-emerald-50/60 border-2 border-emerald-200 p-4 rounded-2xl space-y-2 shadow-xs">
            <span className="text-xs font-black uppercase tracking-wide flex gap-1">
              <span className="text-emerald-600">3. Add</span>
              <span className="text-teal-600">KVAR</span>
              <span className="text-green-600">(+)</span>
            </span>
            <input
              type="number"
              step="any"
              value={addKvar}
              onChange={(e) => setAddKvar(e.target.value)}
              className="w-full text-2xl font-black text-emerald-700 bg-white border border-emerald-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>

          {/* BLOCK 4: ACTUAL KVAR (NET - BLUE THEME) */}
          <div className="bg-blue-50/80 border-2 border-blue-400 p-4 rounded-2xl space-y-2 shadow-md">
            <span className="text-xs font-black uppercase tracking-wide flex gap-1">
              <span className="text-blue-700">4. Actual</span>
              <span className="text-indigo-700">KVAR</span>
              <span className="text-cyan-700">(Net)</span>
            </span>
            <div className="text-2xl font-black text-blue-900 bg-white border border-blue-300 rounded-xl p-2.5 flex items-center justify-between">
              <span>{actualKvar.toFixed(2)}</span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">AUTO</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md transition-all uppercase tracking-wider cursor-pointer active:scale-95"
          >
            <Save size={15} /> {saving ? "Saving Record..." : `Save Log for ${selectedInductor.title}`}
          </button>
        </div>
      </form>

      {/* 3. BOTTOM SECTION: HISTORY TABLE */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-xs">
        {/* WORDWISE DIFFERENT COLORS FOR HISTORY HEADING */}
        <h2 className="text-sm font-black uppercase tracking-wide flex items-center gap-2">
          <History size={18} className="text-purple-600" />
          <span className="text-purple-600">History</span>
          <span className="text-pink-600">Logs</span>
          <span className="text-indigo-600">for</span>
          <span className="text-slate-800">[{selectedInductor.title}]</span>
          <span className="text-emerald-600">({historyList.length})</span>
        </h2>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
          <table className="w-full text-left text-xs text-slate-700">
            {/* WORDWISE DIFFERENT COLORS FOR TABLE HEADERS */}
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="p-3.5"><span className="text-rose-600">Date</span></th>
                <th className="p-3.5"><span className="text-pink-600">Initial</span> <span className="text-purple-600">KVAR</span></th>
                <th className="p-3.5"><span className="text-red-600">Removed</span> <span className="text-orange-600">KVAR</span></th>
                <th className="p-3.5"><span className="text-emerald-600">Add</span> <span className="text-teal-600">KVAR</span></th>
                <th className="p-3.5"><span className="text-blue-600">Actual</span> <span className="text-indigo-600">KVAR</span></th>
                <th className="p-3.5"><span className="text-cyan-600">Saved</span> <span className="text-sky-600">Time</span></th>
                <th className="p-3.5 text-center"><span className="text-amber-600">Action</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingHistory ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-400">Loading history logs...</td>
                </tr>
              ) : historyList.length > 0 ? (
                historyList.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{row.date}</td>
                    <td className="p-3.5 font-semibold text-pink-600">{row.initialKvar}</td>
                    <td className="p-3.5 font-semibold text-red-600">-{row.removedKvar}</td>
                    <td className="p-3.5 font-semibold text-emerald-600">+{row.addKvar}</td>
                    <td className="p-3.5 font-black text-blue-700">{row.actualKvar}</td>
                    <td className="p-3.5 text-slate-400">{new Date(row.createdAt).toLocaleTimeString()}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleDelete(row._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No history logs found for {selectedInductor.title}. Select date &amp; save first log above.
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