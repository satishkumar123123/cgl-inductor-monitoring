import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Download, RefreshCw } from 'lucide-react';
import '../styles/production.css';
import { monthlyProductionTrends, monthlyBottomDrossTrends } from '../utils/productionTrends.js';
import api from '../services/api.js';
import ProductionMonthlyCharts from '../components/ProductionMonthlyCharts.jsx';
export default function ProductionQrAnalyticsPage() {
  const { pathname } = useLocation();
  const bottomDross = pathname === '/qr/bottom-dross';
  const [history, setHistory] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [months, setMonths] = useState(6);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const rows = useMemo(() => (bottomDross ? monthlyBottomDrossTrends : monthlyProductionTrends)(history, month, months), [history, month, months, bottomDross]);
  const hasData = rows.some((row) => (bottomDross ? [row.bottomDross] : [row.production, row.metal, row.dross]).some((v) => v !== null));
  const downloadReport = async () => {
    setExporting(true); setExportError('');
    try {
      const { downloadProductionPdf } = await import('../utils/productionPdfReport.js');
      downloadProductionPdf({ history, endMonth: month, months, bottomDross });
    } catch (err) { setExportError('PDF download failed. Please retry.'); }
    finally { setExporting(false); }
  };
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    api.get('/api/production-dross/history', { signal: controller.signal }).then(({ data }) => {
      if (!data.success || !Array.isArray(data.data)) throw new Error('Invalid response');
      setHistory(data.data);
    }).catch(() => { if (!controller.signal.aborted) setError('Could not load saved readings. Tap Refresh to retry.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);
  const logs = history.flatMap((r) => r.bottomDrossLogs || []).filter((log) => log.date?.slice(0, 7) === month).sort((a,b) => a.date.localeCompare(b.date));
  return <main className="production-studio min-h-screen bg-slate-50 p-3 sm:p-6 text-slate-900"><div className="max-w-7xl mx-auto space-y-5">
    <Link to="/production-dross" className="inline-block text-indigo-700 font-bold text-sm">← Production &amp; Dross</Link>
    <header className="production-hero rounded-3xl bg-gradient-to-r from-indigo-950 to-purple-700 text-white p-6"><p className="text-xs text-indigo-200 font-bold tracking-widest">CGL MONITORING</p><h1 className="font-black text-2xl mt-2">{bottomDross ? 'Bottom Dross Analytics' : 'Production Analytics'}</h1><p className="text-sm text-indigo-100 mt-2">Saved monthly records • Interactive charts • Print-ready PDF reports</p></header>
    <div className="production-toolbar flex flex-wrap items-center justify-between gap-3"><label className="text-sm font-bold">Ending month <input type="month" value={month} onChange={(e) => { if(e.target.value) setMonth(e.target.value); }} className="ml-2 border rounded-lg px-3 py-2 bg-white"/></label><button onClick={downloadReport} disabled={loading || !!error || !hasData || exporting} className="production-export flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-extrabold disabled:opacity-50"><Download size={18}/>{exporting ? 'Preparing PDF…' : `Download ${months}-Month PDF`}</button><button disabled={loading} onClick={() => setReload((n) => n+1)} className="bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"><RefreshCw size={16} className="inline mr-2"/>Refresh</button></div>
    {exportError && <p role="alert" className="bg-red-50 text-red-700 p-4 rounded-xl">{exportError}</p>}
    {loading ? <p role="status" className="text-center p-10">Loading saved records…</p> : error ? <p role="alert" className="p-5 bg-red-50 text-red-700 rounded-xl">{error}</p> : <>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="production-stat"><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Report period</p><p className="mt-2 font-black text-xl">{months} months</p><p className="text-xs text-slate-500 mt-1">{rows[0]?.month} to {month}</p></div>
        <div className="production-stat"><p className="text-xs font-bold uppercase tracking-wider text-purple-600">Visual analysis</p><p className="mt-2 font-black text-xl">{bottomDross ? 'Quantity & logs' : '5 parameters'}</p><p className="text-xs text-slate-500 mt-1">Bar comparison + line trends</p></div>
        <div className="production-stat"><p className="text-xs font-bold uppercase tracking-wider text-teal-600">Download report</p><p className="mt-2 font-black text-xl">High-quality PDF</p><p className="text-xs text-slate-500 mt-1">Charts, summary and data register</p></div>
      </div>
      <ProductionMonthlyCharts period={months} onPeriodChange={setMonths} history={history} selectedMonth={month} bottomDross={bottomDross} />
      {bottomDross && <section className="production-panel bg-white rounded-2xl border p-4"><h2 className="font-extrabold text-purple-800 mb-4">Removal logs · {month}</h2><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="bg-purple-50"><th className="p-3">Date</th><th className="p-3">Quantity (MT)</th><th className="p-3">Line Remarks</th></tr></thead><tbody>{logs.map((log,i) => <tr key={log._id || i} className="border-t"><td className="p-3 whitespace-nowrap">{log.date}</td><td className="p-3">{log.quantityMT ?? '—'}</td><td className="p-3 break-words">{log.lineRemarks || '—'}</td></tr>)}</tbody></table>{!logs.length && <p className="p-6 text-center text-slate-500">No removal logs for this month.</p>}</div></section>}
    </>}
  </div></main>;
}
