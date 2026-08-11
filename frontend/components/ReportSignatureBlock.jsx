import React from "react";

// Har signature box ke liye custom vibrant styles ka configuration
const SIGNATURE_BOXES = [
  {
    label: "Prepared By",
    role: "Shift Electrical Engineer",
    boxBg: "bg-cyan-50/70",
    border: "border-2 border-cyan-300",
    lineBorder: "border-cyan-400",
    textColor: "text-cyan-950",
    roleColor: "text-cyan-800",
  },
  {
    label: "Checked By",
    role: "Maintenance In-Charge",
    boxBg: "bg-emerald-50/70",
    border: "border-2 border-emerald-300",
    lineBorder: "border-emerald-400",
    textColor: "text-emerald-950",
    roleColor: "text-emerald-800",
  },
  {
    label: "Approved By",
    role: "Plant Operations Head",
    boxBg: "bg-purple-50/70",
    border: "border-2 border-purple-300",
    lineBorder: "border-purple-400",
    textColor: "text-purple-950",
    roleColor: "text-purple-800",
  },
];

export default function ReportSignatureBlock() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t-2 border-slate-300">
      {SIGNATURE_BOXES.map((box) => (
        <div
          key={box.label}
          className={`${box.boxBg} ${box.border} rounded-2xl p-4 text-center shadow-xs transition-all`}
        >
          {/* Signature Space Placeholder */}
          <div className={`h-16 border-b-2 border-dashed ${box.lineBorder} mb-3 flex items-end justify-center pb-1`}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 opacity-60">
              Signature &amp; Date
            </span>
          </div>

          {/* Label */}
          <div className={`text-xs font-black uppercase tracking-wider ${box.textColor}`}>
            {box.label}
          </div>

          {/* Subtitle / Role */}
          <div className={`text-[10px] font-extrabold ${box.roleColor} mt-0.5`}>
            {box.role}
          </div>
        </div>
      ))}
    </div>
  );
}