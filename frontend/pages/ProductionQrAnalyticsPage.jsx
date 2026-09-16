import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  return <main className="min-h-screen bg-slate-50 p-3 sm:p-6 text-slate-900"><div className="max-w-7xl mx-auto space-y-5">
    <Link to="/production-dross" className="inline-block text-indigo-700 font-bold text-sm">← Production &amp; Dross</Link>
    <header className="rounded-3xl bg-gradient-to-r from-indigo-950 to-purple-700 text-white p-6"><p className="text-xs text-indigo-200 font-bold tracking-widest">CGL MONITORING</p><h1 className="font-black text-2xl mt-2">{bottomDross ? 'Bottom Dross Analytics' : 'Production Analytics'}</h1><p className="text-sm text-indigo-100 mt-2">Saved monthly records • Bar and line charts • 6 / 12 months</p></header>
    <div className="flex flex-wrap justify-between gap-3"><label className="text-sm font-bold">Ending month <input type="month" value={month} onChange={(e) => { if(e.target.value) setMonth(e.target.value); }} className="ml-2 border rounded-lg px-3 py-2 bg-white"/></label><button disabled={loading} onClick={() => setReload((n) => n+1)} className="bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">Refresh</button></div>
    {loading ? <p role="status" className="text-center p-10">Loading saved records…</p> : error ? <p role="alert" className="p-5 bg-red-50 text-red-700 rounded-xl">{error}</p> : <>
      <ProductionMonthlyCharts history={history} selectedMonth={month} bottomDross={bottomDross} />
      {bottomDross && <section className="bg-white rounded-2xl border p-4"><h2 className="font-extrabold text-purple-800 mb-4">Removal logs · {month}</h2><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="bg-purple-50"><th className="p-3">Date</th><th className="p-3">Quantity (MT)</th><th className="p-3">Line Remarks</th></tr></thead><tbody>{logs.map((log,i) => <tr key={log._id || i} className="border-t"><td className="p-3 whitespace-nowrap">{log.date}</td><td className="p-3">{log.quantityMT ?? '—'}</td><td className="p-3 break-words">{log.lineRemarks || '—'}</td></tr>)}</tbody></table>{!logs.length && <p className="p-6 text-center text-slate-500">No removal logs for this month.</p>}</div></section>}
    </>}
  </div></main>;
}
