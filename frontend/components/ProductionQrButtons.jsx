import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { QrCode, X, Download } from 'lucide-react';
export default function ProductionQrButtons() {
  const [type, setType] = useState(null);
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!type) return;
    let active = true; setImage(''); setError('');
    QRCode.toDataURL(`${window.location.origin}/qr/${type}`, { width: 768, margin: 4, errorCorrectionLevel: 'M' })
      .then((url) => { if (active) setImage(url); }).catch(() => { if (active) setError('Unable to generate QR. Please close and retry.'); });
    const escape = (event) => { if (event.key === 'Escape') setType(null); };
    window.addEventListener('keydown', escape);
    return () => { active = false; window.removeEventListener('keydown', escape); };
  }, [type]);
  return <>
    <div className="flex flex-wrap gap-3">
      {[['production','Production QR'],['bottom-dross','Bottom Dross QR']].map(([key,label]) => <button key={key} onClick={() => setType(key)} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white text-indigo-900 font-extrabold text-xs shadow-sm hover:bg-indigo-100"><QrCode size={19} />{label}</button>)}
    </div>
    {type && <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4" onClick={() => setType(null)}>
      <div role="dialog" aria-modal="true" aria-labelledby="production-qr-title" className="bg-white rounded-3xl p-6 w-full max-w-sm text-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2"><h2 id="production-qr-title" className="font-black text-lg">{type === 'production' ? 'Production QR' : 'Bottom Dross QR'}</h2><button autoFocus onClick={() => setType(null)} aria-label="Close QR code" className="p-2"><X size={20}/></button></div>
        {image ? <img src={image} width="280" height="280" className="mx-auto max-w-full" alt={`${type} monitoring QR code`} /> : <p role="status" className="py-16 text-center text-sm">{error || 'Generating QR…'}</p>}
        <p className="text-center text-xs text-slate-600 mb-4">Scan for 6 / 12 month bar and line charts.</p>
        <div className="flex gap-3 justify-center"><Link to={`/qr/${type}`} className="bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Open charts</Link>{image && <a href={image} download={`CGL_${type}_QR.png`} className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold"><Download size={15}/> PNG</a>}</div>
      </div>
    </div>}
  </>;
}
