// Renders the front + back ID card DOM nodes to a 2-page A6 PDF.
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export async function generateIdCardPdf(
  front: HTMLElement,
  back: HTMLElement,
  filename: string,
) {
  const scale = 3;
  const [frontCanvas, backCanvas] = await Promise.all([
    html2canvas(front, { scale, backgroundColor: "#ffffff", useCORS: true }),
    html2canvas(back, { scale, backgroundColor: "#ffffff", useCORS: true }),
  ]);

  // A6 portrait: 105 × 148 mm. Card aspect is 420:630 = 2:3, so use 100×150 mm
  // on an A6 page with 2.5mm margins.
  const pageW = 105;
  const pageH = 148;
  const cardW = 100;
  const cardH = 150; // overflows slightly; clamp
  const w = cardW;
  const h = (cardW * frontCanvas.height) / frontCanvas.width;
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;

  const pdf = new jsPDF({ unit: "mm", format: [pageW, pageH], orientation: "portrait" });
  pdf.addImage(frontCanvas.toDataURL("image/jpeg", 0.95), "JPEG", x, y, w, h);
  pdf.addPage([pageW, pageH], "portrait");
  pdf.addImage(backCanvas.toDataURL("image/jpeg", 0.95), "JPEG", x, y, w, h);
  pdf.save(filename);

  // Avoid unused warning
  void cardH;
}
