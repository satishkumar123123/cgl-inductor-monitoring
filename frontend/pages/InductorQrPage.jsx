import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, Download, ExternalLink, QrCode } from 'lucide-react';
import { INDUCTORS } from '../utils/inductorTelemetry.js';

export default function InductorQrPage() {
  const [codes, setCodes] = useState({});
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all(INDUCTORS.map(async ({ key }) => {
      const url = `${window.location.origin}/qr/inductor/${key}`;
      const image = await QRCode.toDataURL(url, { width: 768, margin: 4, errorCorrectionLevel: 'M' });
      return [key, { url, image }];
    })).then((entries) => { if (active) setCodes(Object.fromEntries(entries)); })
      .catch(() => { if (active) setError('QR codes could not be generated. Please reload the page.'); });
    return () => { active = false; };
  }, []);
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-7 text-slate-900">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 mb-5"><ArrowLeft size={18} /> Dashboard</Link>
      <header className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-800 to-violet-700 p-6 sm:p-8 text-white mb-6">
        <QrCode size={32} className="mb-3" /><h1 className="text-2xl sm:text-3xl font-black">Inductor QR Codes</h1>
        <p className="mt-2 text-indigo-100 text-sm">Scan an equipment QR to view its latest 20 saved readings in bar charts.</p>
        <p className="mt-2 text-indigo-200 text-xs">Main Pot A–D · PM Pot A–B · Download PNG labels for printing</p>
      </header>
      {error && <p role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl mb-4">{error}</p>}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {INDUCTORS.map((item) => (
          <article key={item.key} className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <h2 className="p-4 text-white font-extrabold" style={{ backgroundColor: item.color }}>{item.title}</h2>
            <div className="p-5 flex flex-col items-center gap-4">
              {codes[item.key] ? <img src={codes[item.key].image} alt={`Scan for ${item.title}`} width="240" height="240" className="w-60 max-w-full" /> : <div className="h-60 flex items-center text-slate-500">{error ? 'QR unavailable' : 'Generating QR…'}</div>}
              <p className="text-xs text-center text-slate-500">Conductance · Current · Voltage · R / Y / B · Power</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to={`/qr/inductor/${item.key}`} className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-indigo-700 font-bold text-sm"><ExternalLink size={16} /> Open charts</Link>
                {codes[item.key] && <a href={codes[item.key].image} download={`CGL_${item.key}_QR.png`} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white font-bold text-sm"><Download size={16} /> PNG</a>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
