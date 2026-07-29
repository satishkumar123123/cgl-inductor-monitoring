// Conditional formatting thresholds for table cells.
// Current: Green = normal, Orange = near limit, Red = above limit.
// PF:      Green >= 0.99, Yellow 0.95-0.99, Red < 0.95.
// Voltage: Green = normal band, Orange = high/low, Red = out of range.
// Adjust these thresholds to match your plant's actual limits.

export function cellTone(type, raw) {
  const v = parseFloat(raw);
  if (raw === "" || raw === undefined || raw === null || isNaN(v)) return null;

  if (type === "current") {
    if (v >= 500) return "red";
    if (v >= 450) return "orange";
    return "green";
  }
  if (type === "pf") {
    if (v >= 0.99) return "green";
    if (v >= 0.95) return "yellow";
    return "red";
  }
  if (type === "voltage") {
    if (v >= 380 && v <= 420) return "green";
    if ((v > 420 && v <= 450) || (v >= 350 && v < 380)) return "orange";
    return "red";
  }
  return null;
}

export const toneClasses = {
  green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/40",
  yellow: "text-amber-400 bg-amber-500/10 border-amber-500/40",
  orange: "text-orange-400 bg-orange-500/10 border-orange-500/40",
  red: "text-red-400 bg-red-500/10 border-red-500/40",
};
