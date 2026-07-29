import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ fullScreen, label = "Loading…" }) {
  const content = (
    <div className="flex items-center gap-2 text-slate-400 text-sm">
      <Loader2 size={16} className="animate-spin text-cyan-400" />
      {label}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-industrial-bg">
        {content}
      </div>
    );
  }
  return content;
}
