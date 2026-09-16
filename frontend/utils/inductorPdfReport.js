import { jsPDF } from 'jspdf';
import { METRICS } from './inductorTelemetry.js';

const ink = '#172554';
const muted = '#64748b';
const valid = (v) => typeof v === 'number' && Number.isFinite(v);
const fmt = (v) => valid(v) ? v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '-';

// Vector text, tables and charts stay sharp at any zoom and do not depend on viewport size.
export function buildInductorPdf({ inductor, points, level = 'high', generatedAt = new Date() }) {
  if (!inductor || !points?.length) throw new Error('No readings available for this report.');
  const rows = [...points].sort((a, b) => a.date.localeCompare(b.date)).slice(-20);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const title = inductor.title.replace(/·/g, '-');
  const tap = level === 'intermediate' ? 'Intermediate' : 'High';
  const range = `${rows[0].date} to ${rows[rows.length - 1].date}`;
  const stamp = generatedAt.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  pdf.setProperties({ title: `${title} - Monitoring Report`, subject: `${tap} tap | ${range}`, author: 'CGL Inductor Monitoring', creator: 'CGL Inductor Monitoring' });
  const text = (value, x, y, size = 10, color = ink, bold = false, options = {}) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.setTextColor(color);
    pdf.text(Array.isArray(value) ? value.map(String) : String(value), x, y, options);
  };
  const box = (x, y, w, h, color, radius = 3) => { pdf.setFillColor(color); pdf.roundedRect(x, y, w, h, radius, radius, 'F'); };
  const header = (section) => {
    pdf.setFillColor('#f4f7fc'); pdf.rect(0, 0, 297, 210, 'F');
    box(0, 0, 297, 34, ink, 0); box(0, 34, 297, 2, inductor.color, 0);
    text('CGL / INDUCTOR MONITORING', 14, 10, 9, '#a5b4fc', true);
    text(title, 14, 23, 20, '#ffffff', true);
    text(section, 283, 12, 10, '#ffffff', true, { align: 'right' });
    text(`${tap} tap  |  ${rows.length} saved readings`, 283, 23, 9, '#cbd5e1', false, { align: 'right' });
  };
  header('EQUIPMENT SUMMARY');
  text('Equipment performance report', 14, 49, 19, ink, true);
  text(`Reading period: ${range}`, 14, 58, 10, muted);
  text(`Generated: ${stamp}`, 283, 58, 9, muted, false, { align: 'right' });
  METRICS.forEach((metric, i) => {
    const x = 14 + (i % 4) * 68; const y = 68 + Math.floor(i / 4) * 52;
    const values = rows.map((r) => r[metric.key]).filter(valid);
    const last = [...rows].reverse().find((r) => valid(r[metric.key]));
    box(x, y, 65, 47, '#ffffff'); box(x, y, 65, 2, metric.color, 0);
    text(metric.label, x + 4, y + 9, 10, metric.color, true);
    text(`${fmt(last?.[metric.key])} ${metric.unit}`, x + 4, y + 21, 17, ink, true);
    text(`Latest available: ${last?.date || 'No value'}`, x + 4, y + 28, 7, muted);
    text(`Min ${fmt(values.length ? Math.min(...values) : null)}  /  Max ${fmt(values.length ? Math.max(...values) : null)}`, x + 4, y + 35, 7.5, muted);
    text(`Average ${fmt(values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)}  |  ${values.length}/${rows.length} values`, x + 4, y + 42, 7.5, muted);
  });
  box(218, 120, 65, 47, '#e0e7ff');
  text('REPORT GUIDE', 222, 130, 10, '#4338ca', true);
  text(['7 parameter bar charts', 'Full readings register', 'Dates run oldest to newest', 'Missing values shown as "-"'], 222, 139, 8, ink, false, { lineHeightFactor: 1.7 });
  text('Saved measurements only. Summary uses available values; missing data is excluded, genuine zeros are retained.', 14, 183, 9, muted);

  function chart(metric, y) {
    box(14, y, 269, 69, '#ffffff');
    const values = rows.map((r) => r[metric.key]).filter(valid);
    text(`${metric.label} (${metric.unit})`, 19, y + 8, 11, metric.color, true);
    text(`${values.length} available values`, 277, y + 8, 8, muted, false, { align: 'right' });
    if (!values.length) { text('No values saved for this parameter.', 148, y + 38, 12, muted, false, { align: 'center' }); return; }
    const low = Math.min(0, ...values); const high = Math.max(0, ...values);
    const span = high - low || 1;
    const min = low < 0 ? low - span * 0.1 : 0;
    const max = high > 0 ? high + span * 0.15 : 1;
    const left = 37, top = y + 18, width = 239, height = 32;
    const py = (v) => top + height - (v - min) / (max - min) * height;
    for (let t = 0; t <= 4; t++) {
      const value = min + (max - min) * t / 4, yy = py(value);
      pdf.setDrawColor('#e2e8f0'); pdf.setLineWidth(0.15); pdf.line(left, yy, left + width, yy);
      text(Math.abs(value) >= 10000 ? `${(value / 1000).toFixed(1)}k` : fmt(value), left - 2, yy + 1, 6.5, muted, false, { align: 'right' });
    }
    const step = width / rows.length, barWidth = Math.min(8, step * 0.62), zero = py(0);
    rows.forEach((r, i) => {
      const cx = left + step * (i + 0.5), v = r[metric.key];
      if (valid(v)) {
        pdf.setFillColor(metric.color);
        const end = py(v), h = Math.max(Math.abs(end - zero), 0.25);
        pdf.rect(cx - barWidth / 2, v >= 0 ? end : zero, barWidth, h, 'F');
        text(fmt(v), cx, v >= 0 ? end - 1.5 : end + 3, rows.length > 12 ? 5.5 : 7, metric.color, true, { align: 'center' });
      } else text('-', cx, zero - 2, 8, muted, false, { align: 'center' });
      text(`${r.date.slice(8)}/${r.date.slice(5, 7)}`, cx, y + 57, 6, muted, false, { align: 'center' });
      text(r.date.slice(0, 4), cx, y + 61, 5.5, muted, false, { align: 'center' });
    });
  }
  for (let i = 0; i < METRICS.length; i += 2) {
    pdf.addPage(); header('PARAMETER TRENDS');
    text(`${range}  |  Oldest to newest`, 14, 43, 9, muted);
    chart(METRICS[i], 49);
    if (METRICS[i + 1]) chart(METRICS[i + 1], 123);
    else {
      box(14, 128, 269, 45, '#e0e7ff');
      text('Reading the charts', 20, 139, 12, '#4338ca', true);
      text(['Each bar represents one saved date for this equipment and tap level.', 'Axes are scaled separately for each parameter. Use the readings register for exact values.', 'Blank measurements are not treated as zero. This report does not assign equipment health ratings.'], 20, 148, 9, ink, false, { lineHeightFactor: 1.8 });
    }
  }
  pdf.addPage(); header('READINGS REGISTER');
  text('Complete measurement register', 14, 47, 16, ink, true);
  text(`${range}  |  ${tap} tap  |  All values rounded to 2 decimal places`, 14, 55, 9, muted);
  const widths = [35, 35, 36, 36, 31, 31, 31, 34];
  const headings = ['Date', 'CR (%)', 'Ind. current (A)', 'Voltage (V)', 'R phase (A)', 'Y phase (A)', 'B phase (A)', 'Power (kW)'];
  let x = 14;
  headings.forEach((heading, i) => {
    box(x, 62, widths[i], 10, i ? METRICS[i - 1].color : ink, 0);
    text(heading, x + widths[i] / 2, 68.5, 8, '#ffffff', true, { align: 'center' }); x += widths[i];
  });
  rows.forEach((row, index) => {
    const y = 72 + index * 5.6;
    box(14, y, 269, 5.6, index % 2 ? '#edf2fa' : '#ffffff', 0);
    let xx = 14;
    [row.date, ...METRICS.map((m) => fmt(row[m.key]))].forEach((value, i) => {
      text(value, xx + widths[i] / 2, y + 3.8, 7.5, i ? ink : '#475569', i === 0, { align: 'center' }); xx += widths[i];
    });
  });
  text('CR = Conductance Ratio. "-" = not recorded. Conductance fractions are converted to percent using the dashboard convention.', 14, 190, 8, muted);
  const count = pdf.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    pdf.setPage(i); pdf.setDrawColor('#cbd5e1'); pdf.line(14, 198, 283, 198);
    text(`CGL | ${inductor.key} | ${tap} tap | Generated ${stamp}`, 14, 204, 7, muted);
    text(`${i} / ${count}`, 283, 204, 8, ink, true, { align: 'right' });
  }
  return pdf;
}

export function downloadInductorPdf(options) {
  const pdf = buildInductorPdf(options);
  const dates = options.points.map((p) => p.date).sort();
  pdf.save(`CGL_${options.inductor.key}_${options.level || 'high'}_${dates[dates.length - 1]}_Report.pdf`);
}
