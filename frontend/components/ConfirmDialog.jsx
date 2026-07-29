import React from "react";
import { AlertTriangle, X, Check } from "lucide-react";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/60 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex gap-3 items-start">
          <AlertTriangle size={20} className="text-orange-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <X size={13} /> Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
          >
            <Check size={13} /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
