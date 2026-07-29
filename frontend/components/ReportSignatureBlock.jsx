import React from "react";

export default function ReportSignatureBlock() {
  const boxes = ["Prepared By", "Checked By", "Approved By"];
  return (
    <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-700">
      {boxes.map((label) => (
        <div key={label} className="text-center">
          <div className="h-14 border-b border-slate-600 mb-1.5" />
          <div className="text-[11px] text-slate-400 font-semibold">{label}</div>
        </div>
      ))}
    </div>
  );
}
