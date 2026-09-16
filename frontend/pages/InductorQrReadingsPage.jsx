import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, RefreshCw, Activity, Download } from 'lucide-react';
import api from '../services/api.js';
import { INDUCTORS, METRICS, latestInductorReadings } from '../utils/inductorTelemetry.js';

export default function InductorQrReadingsPage() {
  const { inductorKey } = useParams();
  const inductor = INDUCTORS.find((item) => item.key === inductorKey);
  const [records, setRecords] = useState([]);
  const [level, setLevel] = useState('high');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    if (!inductor) { setLoading(false); return; }
    setLoading(true); setError('');
    api.get('/api/data', { signal: controller.signal }).then(({ data }) => {
      const rows = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(rows)) throw new Error('Invalid readings response');
      setRecords(rows);
    }).catch((err) => {
      if (!controller.signal.aborted) setError('Readings could not be loaded. Check your connection and tap Retry.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [inductorKey, reload]);
  const points = useMemo(() => latestInductorReadings(records, inductorKey, level), [records, inductorKey, level]);
  const downloadReport = async () => {
    setExporting(true); setExportError('');
    try {
      const { downloadInductorPdf } = await import('../utils/inductorPdfReport.js');
      downloadInductorPdf({ inductor, points, level });
    } catch (err) {
      setExportError('Report could not be downloaded. Please try again.');
    } finally { setExporting(false); }
  };
  if (!inductor) return <main className="p-8 text-slate-900 bg-white min-h-screen"><h1 className="text-xl font-bold">Inductor not found</h1><Link to="/qr-codes" className="text-indigo-700 underline">View all QR codes</Link></main>;
  return (
    <main className="bg-slate-50 min-h-screen text-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <Link to="/qr-codes" className="inline-flex items-center gap-2 text-indigo-700 font-bold text-sm mb-4"><ArrowLeft size={17} /> All inductor QR codes</Link>
        <header className="rounded-3xl p-5 sm:p-8 text-white shadow-sm" style={{ backgroundColor: inductor.color }}>
          <p className="uppercase tracking-widest text-xs font-bold mb-2">CGL · Equipment Monitoring</p>
          <h1 className="text-2xl sm:text-3xl font-black">{inductor.title}</h1>
          <p className="text-sm mt-3">Latest 20 saved readings · {level === 'high' ? 'High' : 'Intermediate'} tap</p>
          {!loading && !error && points.length > 0 && <p className="text-sm mt-2">{points.length} readings · {points[0].date} to {points[points.length - 1].date}</p>}
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3 my-5">
          <label className="text-sm font-bold">Tap level <select value={level} onChange={(e) => setLevel(e.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="high">High</option><option value="intermediate">Intermediate</option></select></label>
          <button onClick={downloadReport} disabled={exporting || loading || !!error || !points.length} className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white rounded-lg px-4 py-2 font-bold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"><Download size={17} />{exporting ? 'Preparing PDF…' : 'Download PDF Report'}</button>
          <button onClick={() => setReload((r) => r + 1)} disabled={loading} className="inline-flex items-center gap-2 bg-indigo-700 text-white rounded-lg px-4 py-2 font-bold text-sm disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />{error ? 'Retry' : 'Refresh'}</button>
        </div>
        {exportError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{exportError}</p>}
        {loading ? <p role="status" className="p-10 text-center text-slate-600">Loading saved readings…</p> : error ? <p role="alert" className="p-6 bg-red-50 text-red-700 rounded-xl">{error}</p> : !points.length ? <div className="p-10 text-center bg-white rounded-2xl border"><Activity className="mx-auto mb-3 text-indigo-500" /><h2 className="font-bold">No saved readings for this tap level</h2><p className="text-sm text-slate-500 mt-2">Save readings from the dashboard or select another tap level.</p></div> : <>
          <p className="text-xs text-slate-500 mb-5">Saved measurements, not live telemetry. Missing values remain blank. Tap a bar for its date and value; scroll charts sideways on mobile.</p>
          <div className="grid gap-5 lg:grid-cols-2">
            {METRICS.map((metric) => {
              const hasValues = points.some((p) => p[metric.key] !== null);
              return <section key={metric.key} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 min-w-0">
                <h2 className="font-extrabold text-base mb-1" style={{ color: metric.color }}>{metric.label} <span className="text-xs">({metric.unit})</span></h2>
                <p className="text-xs text-slate-500 mb-4">{points.filter((p) => p[metric.key] !== null).length} available values</p>
                {!hasValues ? <p className="h-64 flex items-center justify-center text-slate-500 text-sm">No {metric.label.toLowerCase()} values saved.</p> : <div className="overflow-x-auto" tabIndex={0} aria-label={`${metric.label} chart, scroll horizontally`}>
                  <div style={{ minWidth: Math.max(360, points.length * 42), height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={points} margin={{ top: 8, right: 12, left: 4, bottom: 45 }} accessibilityLayer>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" tickFormatter={(date) => `${date.slice(8)}/${date.slice(5, 7)}`} interval={0} angle={-45} textAnchor="end" tick={{ fontSize: 11, fill: '#475569' }} />
                        <YAxis width={62} tick={{ fontSize: 11, fill: '#475569' }} />
                        <Tooltip labelFormatter={(date) => `Date: ${date}`} formatter={(value) => [`${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${metric.unit}`, metric.label]} contentStyle={{ borderRadius: 12, color: '#0f172a' }} />
                        <Bar dataKey={metric.key} name={metric.label} fill={metric.color} radius={[5, 5, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>}
              </section>;
            })}
          </div>
        </>}
      </div>
    </main>
  );
}
