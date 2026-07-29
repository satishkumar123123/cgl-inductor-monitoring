import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import useToast from "../hooks/useToast.js";

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="no-print fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl cursor-pointer"
        >
          {t.type === "error" ? (
            <AlertCircle size={15} className="text-red-400" />
          ) : (
            <CheckCircle2 size={15} className="text-emerald-400" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
