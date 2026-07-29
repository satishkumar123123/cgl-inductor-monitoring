import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures a DOM element (by id) and exports it as a multi-page A4 PDF,
 * preserving charts and tables exactly as rendered on screen.
 */
export async function exportElementToPdf(elementId, fileName = "report.pdf") {
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Element #${elementId} not found`);

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#0F172A",
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
}
