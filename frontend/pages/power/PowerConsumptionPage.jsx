import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Save, Zap, Factory, Trash2, Gauge, Percent, Pencil } from "lucide-react";
import StatCard from "../../components/StatCard.jsx";
import ChartCard, { chartTheme } from "../../components/ChartCard.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import useToast from "../../hooks/useToast.js";
import useAuth from "../../hooks/useAuth.js";
import { todayStr, fmtDateLong } from "../../utils/rowsConfig.js";
import { fetchPowerByDate, createPower, updatePower, deletePower, listPower } from "../../services/powerService.js";

const emptyForm = (date) => ({
  date, mainPotPower: "", pmPotPower: "", metalCharging: "", drossGeneration: "",
  operatorName: "", shift: "A", remarks: "",
});

export default function PowerConsumptionPage() {
  const { user } = useAuth();
  const { notify } = useToast();

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [form, setForm] = useState(emptyForm(todayStr()));
  const [existsOnServer, setExistsOnServer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [trend, setTrend] = useState([]);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadDay = useCallback(async (date) => {
    setLoading(true);
    try {
      const data = await fetchPowerByDate(date);
      if (data) {
        setForm({
          date, mainPotPower: data.mainPotPower, pmPotPower: data.pmPotPower,
          metalCharging: data.metalCharging, drossGeneration: data.drossGeneration,
          operatorName: data.operatorName, shift: data.shift, remarks: data.remarks,
        });
        setExistsOnServer(true);
      } else {
        setForm(emptyForm(date));
        setExistsOnServer(false);
      }
    } catch (err) {
      notify(err.response?.data?.message || "Failed to load power data", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const loadTrend = useCallback(async () => {
    try {
      const params = {};
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;
      if (filterShift) params.shift = filterShift;
      const data = await listPower(params);
      setTrend(data);
    } catch (err) {
      notify(err.response?.data?.message || "Failed to load trend data", "error");
    }
  }, [filterFrom, filterTo, filterShift, notify]);

  useEffect(() => { loadDay(selectedDate); }, [selectedDate, loadDay]);
  useEffect(() => { loadTrend(); }, [loadTrend]);

  const overallPower = (Number(form.mainPotPower) || 0) + (Number(form.pmPotPower) || 0);
  const powerPerTon = Number(form.metalCharging) > 0 ? overallPower / Number(form.metalCharging) : 0;
  const drossPercent = Number(form.metalCharging) > 0 ? (Number(form.drossGeneration) / Number(form.metalCharging)) * 100 : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, date: selectedDate };
      const saved = existsOnServer ? await updatePower(selectedDate, payload) : await createPower(payload);
      setExistsOnServer(true);
      notify(existsOnServer ? "Power record updated" : "Power record saved");
      loadTrend();
    } catch (err) {
      notify(err.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const chartData = useMemo(
    () => trend.map((r) => ({ date: r.date.slice(5), power: r.overallPower, production: r.metalCharging, powerPerTon: r.powerPerTon, dross: r.drossGeneration, drossPercent: r.drossPercent })),
    [trend]
  );

  const monthlyComparison = useMemo(() => {
    const map = {};
    trend.forEach((r) => {
      const m = r.date.slice(0, 7);
      if (!map[m]) map[m] = { month: m, power: 0, production: 0 };
      map[m].power += r.overallPower;
      map[m].production += r.metalCharging;
    });
    return Object.values(map);
  }, [trend]);

  /** Load a row from the records table into the form for editing. */
  const editRecord = (record) => {
    setSelectedDate(record.date);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Delete a saved record (Admin only, enforced server-side too). */
  const deleteRecord = (record) => {
    setConfirmDialog({
      title: "Delete this record?",
      message: `This permanently deletes the production & power record for ${fmtDateLong(record.date)}. This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await deletePower(record.date);
          notify("Record deleted");
          loadTrend();
          if (record.date === selectedDate) {
            setForm(emptyForm(selectedDate));
            setExistsOnServer(false);
          }
        } catch (err) {
          notify(err.response?.data?.message || "Delete failed (Admin role required)", "error");
        }
      },
    });
  };

  if (loading) return <LoadingSpinner label="Loading power consumption data…" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-extrabold text-white">Daily Production &amp; Power Consumption</h1>
        <p className="text-xs text-slate-500 mt-1">Track daily power, production, and dross generation, and see automatically calculated efficiency metrics.</p>
      </div>

      {/* ENTRY FORM */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div>
            <label className="text-[10.5px] uppercase text-slate-500 mb-1 block">Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="select-input w-full" />
          </div>
          <div>
            <label className="text-[10.5px] uppercase text-slate-500 mb-1 block">Main Pot Power (kW)</label>
            <input type="number" step="any" value={form.mainPotPower} onChange={(e) => setForm((f) => ({ ...f, mainPotPower: e.target.value }))} className="select-input w-full" />
          </div>
          <div>
            <label className="text-[10.5px] uppercase text-slate-500 mb-1 block">PM Pot Power (kW)</label>
            <input type="number" step="any" value={form.pmPotPower} onChange={(e) => setForm((f) => ({ ...f, pmPotPower: e.target.value }))} className="select-input w-full" />
          </div>
          <div>
            <label className="text-[10.5px] uppercase text-slate-500 mb-1 block">Overall Power (kW)</label>
            <input readOnly value={overallPower.toFixed(2)} className="select-input w-full opacity-70 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-[10.5px] uppercase text-slate-500 mb-1 block">Metal Charging (Ton)</label>
            <input type="number" step="any" value={form.metalCharging} onChange={(e) => setForm((f) => ({ ...f, metalCharging: e.target.value }))} className="select-input w-full" />
          </div>
          <div>
            <label className="text-[10.5px] uppercase text-slate-500 mb-1 block">Dross Generation (kg)</label>
            <input type="number" step="any" value={form.drossGeneration} onChange={(e) => setForm((f) => ({ ...f, drossGeneration: e.target.value }))} className="select-input w-full" />
          </div>
          <div>
            <label className="text-[10.5px] uppercase text-slate-500 mb-1 block">Operator Name</label>
            <input value={form.operatorName} onChange={(e) => setForm((f) => ({ ...f, operatorName: e.target.value }))} className="select-input w-full" />
          </div>
          <div>
            <label className="text-[10.5px] uppercase text-slate-500 mb-1 block">Shift</label>
            <select value={form.shift} onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value }))} className="select-input w-full">
              <option value="A">A</option><option value="B">B</option><option value="C">C</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="text-[10.5px] uppercase text-slate-500 mb-1 block">Remarks</label>
            <input value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} className="select-input w-full" placeholder="Notes for this shift/day…" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="toolbar-btn-primary mt-4">
          <Save size={14} /> {saving ? "Saving…" : existsOnServer ? "Update" : "Save"}
        </button>
        <p className="text-[11px] text-slate-500 mt-2">
          Power Per Ton = Overall Power ÷ Metal Charging = <b className="text-cyan-400">{powerPerTon.toFixed(2)} kW/Ton</b> ·
          Dross % = (Dross ÷ Metal Charging) × 100 = <b className="text-orange-400"> {drossPercent.toFixed(2)}%</b>
        </p>
      </div>

      {/* CARDS */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <StatCard icon={Zap} label="Today's Power" value={overallPower.toFixed(1) + " kW"} accent="text-orange-400" />
        <StatCard icon={Factory} label="Today's Production" value={(Number(form.metalCharging) || 0).toFixed(1) + " Ton"} accent="text-blue-400" />
        <StatCard icon={Trash2} label="Today's Dross" value={(Number(form.drossGeneration) || 0).toFixed(1) + " kg"} accent="text-red-400" />
        <StatCard icon={Gauge} label="Power Per Ton" value={powerPerTon.toFixed(2) + " kW/T"} accent="text-cyan-400" />
        <StatCard icon={Percent} label="Dross %" value={drossPercent.toFixed(2) + "%"} accent="text-orange-400" />
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
        <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="select-input" />
        <span className="text-slate-500 text-xs">to</span>
        <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="select-input" />
        <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)} className="select-input">
          <option value="">All Shifts</option><option value="A">Shift A</option><option value="B">Shift B</option><option value="C">Shift C</option>
        </select>
        <button onClick={loadTrend} className="toolbar-btn-primary">Apply</button>
      </div>

      {/* RECORDS TABLE — full CRUD: Edit loads a row into the form above, Delete removes it */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <span className="font-extrabold text-sm text-white">Saved Records</span>
          <span className="text-[11px] text-slate-500">{trend.length} record{trend.length === 1 ? "" : "s"}</span>
        </div>
        {trend.length === 0 ? (
          <div className="text-sm text-slate-500 p-8 text-center">No production/power records match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[860px]">
              <thead>
                <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-800">
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5">Shift</th>
                  <th className="px-3.5 py-2.5">Operator</th>
                  <th className="px-3.5 py-2.5 text-right">Overall Power</th>
                  <th className="px-3.5 py-2.5 text-right">Production</th>
                  <th className="px-3.5 py-2.5 text-right">Dross</th>
                  <th className="px-3.5 py-2.5 text-right">Power/Ton</th>
                  <th className="px-3.5 py-2.5 text-right">Dross %</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trend.slice().reverse().map((r) => (
                  <tr key={r.date} className={`border-b border-slate-800/60 hover:bg-slate-800/30 ${r.date === selectedDate ? "bg-cyan-500/5" : ""}`}>
                    <td className="px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap">{fmtDateLong(r.date)}</td>
                    <td className="px-3.5 py-2 text-xs text-slate-400">{r.shift}</td>
                    <td className="px-3.5 py-2 text-xs text-slate-400">{r.operatorName || "—"}</td>
                    <td className="px-3.5 py-2 text-xs text-right tabular-nums text-slate-200">{r.overallPower.toFixed(1)} kW</td>
                    <td className="px-3.5 py-2 text-xs text-right tabular-nums text-slate-200">{r.metalCharging.toFixed(1)} T</td>
                    <td className="px-3.5 py-2 text-xs text-right tabular-nums text-slate-200">{r.drossGeneration.toFixed(1)} kg</td>
                    <td className="px-3.5 py-2 text-xs text-right tabular-nums text-cyan-400">{r.powerPerTon.toFixed(2)}</td>
                    <td className="px-3.5 py-2 text-xs text-right tabular-nums text-orange-400">{r.drossPercent.toFixed(2)}%</td>
                    <td className="px-3.5 py-2 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => editRecord(r)} className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                          <Pencil size={12} /> Edit
                        </button>
                        {user?.role === "Admin" && (
                          <button onClick={() => deleteRecord(r)} className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CHARTS */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
        <ChartCard title="Daily Power Trend">
          <LineChart data={chartData}>
            <CartesianGrid stroke={chartTheme.grid} vertical={false} />
            <XAxis dataKey="date" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
            <Line type="monotone" dataKey="power" name="Overall Power (kW)" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Production Trend">
          <LineChart data={chartData}>
            <CartesianGrid stroke={chartTheme.grid} vertical={false} />
            <XAxis dataKey="date" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
            <Line type="monotone" dataKey="production" name="Production (Ton)" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Power per Ton Trend">
          <LineChart data={chartData}>
            <CartesianGrid stroke={chartTheme.grid} vertical={false} />
            <XAxis dataKey="date" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
            <Line type="monotone" dataKey="powerPerTon" name="kW / Ton" stroke="#22D3EE" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Dross Trend">
          <BarChart data={chartData}>
            <CartesianGrid stroke={chartTheme.grid} vertical={false} />
            <XAxis dataKey="date" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} />
            <Bar dataKey="dross" name="Dross (kg)" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Power vs Production">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke={chartTheme.grid} vertical={false} />
            <XAxis dataKey="date" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="production" name="Production (Ton)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="power" name="Power (kW)" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ChartCard>
        <ChartCard title="Monthly Comparison">
          <BarChart data={monthlyComparison}>
            <CartesianGrid stroke={chartTheme.grid} vertical={false} />
            <XAxis dataKey="month" tick={chartTheme.tick} /><YAxis tick={chartTheme.tick} /><Tooltip {...chartTheme.tooltip} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="power" name="Total Power (kW)" fill="#F97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="production" name="Total Production (Ton)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={async () => { const d = confirmDialog; setConfirmDialog(null); if (d?.onConfirm) await d.onConfirm(); }}
      />
    </div>
  );
}
