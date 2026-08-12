import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, History, Calendar, Trash2, Zap, CheckCircle2 } from "lucide-react";
import axios from "axios";

const INDUCTORS = [
  { key: "MAIN_A", title: "Main Pot Inductor A", tag: "Main Pot" },
  { key: "MAIN_B", title: "Main Pot Inductor B", tag: "Main Pot" },
  { key: "MAIN_C", title: "Main Pot Inductor C", tag: "Main Pot" },
  { key: "MAIN_D", title: "Main Pot Inductor D", tag: "Main Pot" },
  { key: "PM_A", title: "PM Pot Inductor A", tag: "PM Pot" },
  { key: "PM_B", title: "PM Pot Inductor B", tag: "PM Pot" },
];

export default function BalancingKvarPage() {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-white text-slate-900 p-6 sm:p-8 space-y-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Zap className="text-blue-600 fill-blue-600" size={24} /> Balancing KVAR Management
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Select an inductor block to calculate and store historical Initial, Removed, and Added KVAR logs
            </p>
          </div>
        </div>

        {/* DATE SELECTOR */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
          <Calendar size={16} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-500 uppercase">Entry Date:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* 1. TOP SECTION: 6 INDUCTOR CARDS GRID */}
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
          Step 1: Select Inductor Block
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {INDUCTORS.map((item) => {
            const isSelected = selectedInductor.key === item.key;
            return (
              <div
                key={item.key}
                onClick={() => setSelectedInductor(item)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between relative ${
                  isSelected
                    ? "bg-blue-50/80 border-blue-600 shadow-lg shadow-blue-500/10 scale-[1.02]"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                }`}
              >
                {isSelected && (
                  <CheckCircle2 size={16} className="absolute top-3 right-3 text-blue-600" />
                )}
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 w-fit mb-2">
                  {item.tag}
                </span>
                <h3 className={`text-xs font-black ${isSelected ? "text-blue-900" : "text-slate-800"}`}>
                  {item.title}
                </h3>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MIDDLE SECTION: 4 KVAR INPUT BLOCKS */}
      <form onSubmit={handleSave} className="bg-slate-50/60 border border-slate-200 p-6 rounded-3xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-sm font-black text-blue-700 uppercase tracking-wide">
            Step 2: Enter Readings for [{selectedInductor.title}]
          </h2>
          <span className="text-xs text-slate-400 font-medium">Selected Date: {date}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* BLOCK 1: INITIAL */}
          <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl space-y-2 shadow-sm">
            <span className="text-xs font-extrabold uppercase text-slate-500">1. Initial KVAR</span>
            <input
              type="number"
              step="any"
              value={initialKvar}
              onChange={(e) => setInitialKvar(e.target.value)}
              className="w-full text-2xl font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* BLOCK 2: REMOVED */}
          <div className="bg-white border-2 border-red-200 p-4 rounded-2xl space-y-2 shadow-sm">
            <span className="text-xs font-extrabold uppercase text-red-600">2. Removed KVAR (-)</span>
            <input
              type="number"
              step="any"
              value={removedKvar}
              onChange={(e) => setRemovedKvar(e.target.value)}
              className="w-full text-2xl font-black text-red-700 bg-red-50/40 border border-red-300 rounded-xl p-2.5 outline-none focus:border-red-500 focus:bg-white transition-all"
            />
          </div>

          {/* BLOCK 3: ADD */}
          <div className="bg-white border-2 border-emerald-200 p-4 rounded-2xl space-y-2 shadow-sm">
            <span className="text-xs font-extrabold uppercase text-emerald-600">3. Add KVAR (+)</span>
            <input
              type="number"
              step="any"
              value={addKvar}
              onChange={(e) => setAddKvar(e.target.value)}
              className="w-full text-2xl font-black text-emerald-700 bg-emerald-50/40 border border-emerald-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* BLOCK 4: ACTUAL (CALCULATED) */}
          <div className="bg-blue-600 border-2 border-blue-700 p-4 rounded-2xl space-y-2 shadow-md text-white">
            <span className="text-xs font-extrabold uppercase text-blue-100">4. Actual KVAR (Net)</span>
            <div className="text-2xl font-black bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 flex items-center justify-between">
              <span>{actualKvar.toFixed(2)}</span>
              <span className="text-[10px] font-bold bg-white text-blue-900 px-2 py-0.5 rounded-md">AUTO</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md transition-all uppercase tracking-wider"
          >
            <Save size={15} /> {saving ? "Saving Record..." : `Save Log for ${selectedInductor.title}`}
          </button>
        </div>
      </form>

      {/* 3. BOTTOM SECTION: HISTORY TABLE FOR SELECTED INDUCTOR */}
      <div className="space-y-4">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <History size={18} className="text-blue-600" />
          History Logs for [{selectedInductor.title}] ({historyList.length})
        </h2>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Initial KVAR</th>
                <th className="p-3.5 text-red-600">Removed KVAR</th>
                <th className="p-3.5 text-emerald-600">Add KVAR</th>
                <th className="p-3.5 text-blue-700">Actual KVAR</th>
                <th className="p-3.5">Saved Time</th>
                <th className="p-3.5 text-center">Action</th>
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
                    <td className="p-3.5 font-semibold">{row.initialKvar}</td>
                    <td className="p-3.5 font-semibold text-red-600">-{row.removedKvar}</td>
                    <td className="p-3.5 font-semibold text-emerald-600">+{row.addKvar}</td>
                    <td className="p-3.5 font-black text-blue-700">{row.actualKvar}</td>
                    <td className="p-3.5 text-slate-400">{new Date(row.createdAt).toLocaleTimeString()}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleDelete(row._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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