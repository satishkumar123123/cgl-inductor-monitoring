import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, History, Calculator, Calendar } from "lucide-react";
import axios from "axios";

export default function BalancingKvarPage() {
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [initialKvar, setInitialKvar] = useState(0);
  const [removedKvar, setRemovedKvar] = useState(0);
  const [addKvar, setAddKvar] = useState(0);
  const [historyList, setHistoryList] = useState([]);
  const [saving, setSaving] = useState(false);

  // Auto-calculated Actual KVAR
  const actualKvar = (parseFloat(initialKvar) || 0) - (parseFloat(removedKvar) || 0) + (parseFloat(addKvar) || 0);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("/api/reports/balancing-kvar");
      if (res.data?.success) {
        setHistoryList(res.data.data);
      }
    } catch (err) {
      console.warn("History fetch fallback:", err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      date,
      initialKvar: parseFloat(initialKvar) || 0,
      removedKvar: parseFloat(removedKvar) || 0,
      addKvar: parseFloat(addKvar) || 0,
      actualKvar,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await axios.post("/api/reports/balancing-kvar", payload);
      if (res.data?.success) {
        setHistoryList((prev) => [res.data.data || payload, ...prev]);
        alert("Balancing KVAR record saved successfully!");
      } else {
        // Fallback local save if endpoint pending
        setHistoryList((prev) => [payload, ...prev]);
      }
    } catch (err) {
      // Local state fallback
      setHistoryList((prev) => [payload, ...prev]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 space-y-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            {/* WORDWISE DIFFERENT COLORS FOR TITLE */}
            <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Calculator className="text-pink-600" size={26} />
              <span className="text-pink-600">Balancing</span>
              <span className="text-blue-600">KVAR</span>
              <span className="text-purple-600">Calculator</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Calculate &amp; maintain historical record for Initial, Removed, and Added KVAR readings
            </p>
          </div>
        </div>

        {/* DATE SELECTOR */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2">
          <Calendar size={16} className="text-slate-500" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 outline-none"
          />
        </div>
      </div>

      {/* TOP ROW: 4 KVAR BLOCKS */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* BLOCK 1: INITIAL KVAR (PINK THEME) */}
          <div className="bg-pink-50/50 border-2 border-pink-200 p-5 rounded-2xl shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-pink-600">1. Initial KVAR</span>
            <input
              type="number"
              step="any"
              value={initialKvar}
              onChange={(e) => setInitialKvar(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-black text-pink-700 bg-white border border-pink-300 rounded-xl p-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all"
            />
            <p className="text-[11px] text-pink-400">Baseline capacity starting point</p>
          </div>

          {/* BLOCK 2: REMOVED KVAR */}
          <div className="bg-red-50/50 border-2 border-red-200 p-5 rounded-2xl shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-red-600">2. Removed KVAR (-)</span>
            <input
              type="number"
              step="any"
              value={removedKvar}
              onChange={(e) => setRemovedKvar(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-black text-red-700 bg-white border border-red-300 rounded-xl p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
            />
            <p className="text-[11px] text-red-400">Deducted / removed capacity</p>
          </div>

          {/* BLOCK 3: ADD KVAR */}
          <div className="bg-emerald-50/50 border-2 border-emerald-200 p-5 rounded-2xl shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">3. Add KVAR (+)</span>
            <input
              type="number"
              step="any"
              value={addKvar}
              onChange={(e) => setAddKvar(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-black text-emerald-700 bg-white border border-emerald-300 rounded-xl p-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
            <p className="text-[11px] text-emerald-500">Newly added / injected capacity</p>
          </div>

          {/* BLOCK 4: ACTUAL KVAR (CALCULATED) */}
          <div className="bg-blue-50/60 border-2 border-blue-400 p-5 rounded-2xl shadow-md space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wide text-blue-700">4. Actual KVAR (Net)</span>
            <div className="text-3xl font-black text-blue-900 bg-white border border-blue-300 rounded-xl p-3 flex items-center justify-between">
              <span>{actualKvar.toFixed(2)}</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md">AUTO</span>
            </div>
            <p className="text-[11px] text-blue-600 font-medium">Initial - Removed + Added</p>
          </div>

        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Save size={16} /> {saving ? "Saving Record..." : "Save Balancing Record"}
          </button>
        </div>
      </form>

      {/* BOTTOM SECTION: HISTORY TABLE */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <History size={18} className="text-blue-600" /> Balancing KVAR History Logs ({historyList.length})
        </h2>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase text-[11px] font-extrabold">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4 text-pink-600">Initial KVAR</th>
                <th className="p-4 text-red-600">Removed KVAR</th>
                <th className="p-4 text-emerald-600">Add KVAR</th>
                <th className="p-4 text-blue-700">Actual KVAR</th>
                <th className="p-4">Saved Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {historyList.length > 0 ? (
                historyList.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{row.date}</td>
                    <td className="p-4 font-medium text-pink-600">{row.initialKvar}</td>
                    <td className="p-4 font-medium text-red-600">-{row.removedKvar}</td>
                    <td className="p-4 font-medium text-emerald-600">+{row.addKvar}</td>
                    <td className="p-4 font-extrabold text-blue-700">{row.actualKvar}</td>
                    <td className="p-4 text-slate-400">
                      {row.createdAt ? new Date(row.createdAt).toLocaleTimeString() : "Just now"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    No history logs saved yet. Fill above values and click Save.
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