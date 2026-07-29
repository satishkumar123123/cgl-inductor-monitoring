import React, { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, X } from "lucide-react";

export default function FileUploadCard({ onFile, progress, result, onClose }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <UploadCloud size={16} className="text-cyan-400" /> Excel Import
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={15} />
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl px-4 py-6 text-center cursor-pointer transition-colors ${
          dragOver ? "border-cyan-400 bg-cyan-400/5" : "border-slate-700"
        }`}
      >
        <UploadCloud size={22} className="text-cyan-400 mx-auto mb-1.5" />
        <div className="text-[12.5px] font-semibold text-slate-200">Drag &amp; drop the Excel sheet here, or click to browse</div>
        <div className="text-[10.5px] text-slate-500 mt-1">.xlsx / .xls — columns are mapped automatically</div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {progress !== null && progress < 100 && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[10.5px] text-slate-500 mt-1">Processing… {progress}%</div>
        </div>
      )}

      {result && (
        <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-emerald-400 text-[12.5px] font-bold">
            <CheckCircle2 size={15} /> Imported successfully
          </div>
          <div className="text-[11.5px] text-slate-500">
            File: <b className="text-slate-200">{result.fileName}</b>
          </div>
          <div className="text-[11.5px] text-slate-500">Rows imported: <b className="text-cyan-400">{result.rowsImported}</b></div>
          {result.unmatched?.length > 0 && (
            <div className="text-[11.5px] text-orange-400">
              <div className="flex items-center gap-1.5 mb-0.5">
                <AlertTriangle size={13} /> Unmatched rows ({result.unmatched.length}):
              </div>
              <ul className="list-disc pl-5">
                {result.unmatched.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          )}
          {result.errors?.length > 0 && (
            <div className="text-[11.5px] text-red-400">
              <div className="flex items-center gap-1.5 mb-0.5">
                <AlertTriangle size={13} /> Non-numeric cells left blank ({result.errors.length}):
              </div>
              <ul className="list-disc pl-5">
                {result.errors.slice(0, 8).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 8 && <li>…and {result.errors.length - 8} more</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
