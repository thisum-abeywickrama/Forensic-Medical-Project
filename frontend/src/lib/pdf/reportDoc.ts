import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MARGIN = 14;
const NAVY: [number, number, number] = [30, 58, 95];
const SLATE: [number, number, number] = [71, 85, 105];
const LIGHT: [number, number, number] = [241, 245, 249];

export type Field = [label: string, value: unknown];

/** Format any stored value into something printable. */
export function fmt(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  const s = String(value).trim();
  return s === "" ? "—" : s;
}

/** Date only, dd/mm/yyyy. */
export function fmtDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("en-GB");
}

/** Date and time, dd/mm/yyyy hh:mm. */
export function fmtDateTime(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return String(value);
  return `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Map coded values (e.g. "blood_alcohol") to their human labels. */
export function fmtCoded(value: unknown, labels: Record<string, string>): string {
  if (Array.isArray(value)) {
    return value.length ? value.map(v => labels[String(v)] ?? String(v)).join(", ") : "—";
  }
  if (!value) return "—";
  return labels[String(value)] ?? String(value);
}

interface DocMeta {
  /** e.g. "Medico-Legal Examination Form" */
  title: string;
  /** e.g. "MLEF-2026-001" */
  reportId: string;
  /** Name of the signed-in user producing the file */
  generatedBy: string;
}

/**
 * Wraps jsPDF with the house style for official report output: a banner on the
 * first page, a running header/footer on continuation pages, and page numbers
 * stamped once the total page count is known.
 */
export class ReportDoc {
  private doc: jsPDF;
  private y: number;
  private meta: DocMeta;
  private pageWidth: number;
  private pageHeight: number;
  private finalized = false;

  constructor(meta: DocMeta) {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
    this.meta = meta;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.y = MARGIN;
    this.drawBanner();
  }

  private get contentWidth() {
    return this.pageWidth - MARGIN * 2;
  }

  private drawBanner() {
    const { doc } = this;

    doc.setFillColor(...NAVY);
    doc.rect(0, 0, this.pageWidth, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Forensic Medical Department", MARGIN, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Medico-Legal Records Management System", MARGIN, 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(this.meta.title.toUpperCase(), MARGIN, 25.5);

    // Report id, right aligned in the banner
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(this.meta.reportId, this.pageWidth - MARGIN, 12, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `Generated ${new Date().toLocaleString("en-GB")}`,
      this.pageWidth - MARGIN, 18, { align: "right" }
    );

    doc.setTextColor(0, 0, 0);
    this.y = 38;
  }

  /** Running header for pages after the first. */
  private drawContinuationHeader() {
    const { doc } = this;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text(`${this.meta.title} — ${this.meta.reportId}`, MARGIN, 10);
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 12, this.pageWidth - MARGIN, 12);
    doc.setTextColor(0, 0, 0);
  }

  /** Ensure there is room for `needed` mm, otherwise start a new page. */
  private ensureSpace(needed: number) {
    if (this.y + needed > this.pageHeight - 20) {
      this.doc.addPage();
      this.drawContinuationHeader();
      this.y = 18;
    }
  }

  /** Section heading with a tinted bar. */
  section(title: string) {
    this.ensureSpace(14);
    const { doc } = this;
    doc.setFillColor(...LIGHT);
    doc.rect(MARGIN, this.y, this.contentWidth, 7, "F");
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, this.y, MARGIN, this.y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...NAVY);
    doc.text(title.toUpperCase(), MARGIN + 3, this.y + 4.8);
    doc.setTextColor(0, 0, 0);
    this.y += 11;
  }

  /**
   * Two-column label/value grid. Rows flow across the page and break
   * automatically onto new pages.
   */
  fields(rows: Field[]) {
    const body: string[][] = [];
    for (let i = 0; i < rows.length; i += 2) {
      const [l1, v1] = rows[i];
      const pair = rows[i + 1];
      body.push([l1, fmt(v1), pair ? pair[0] : "", pair ? fmt(pair[1]) : ""]);
    }

    const colW = this.contentWidth / 2;
    autoTable(this.doc, {
      startY: this.y,
      body,
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.1, textColor: [15, 23, 42] },
      columnStyles: {
        0: { cellWidth: colW * 0.38, fontStyle: "bold", textColor: SLATE, fillColor: [248, 250, 252] },
        1: { cellWidth: colW * 0.62 },
        2: { cellWidth: colW * 0.38, fontStyle: "bold", textColor: SLATE, fillColor: [248, 250, 252] },
        3: { cellWidth: colW * 0.62 },
      },
      margin: { left: MARGIN, right: MARGIN },
      didDrawPage: () => { if (this.doc.getCurrentPageInfo().pageNumber > 1) this.drawContinuationHeader(); },
    });

    this.y = (this.doc as any).lastAutoTable.finalY + 5;
  }

  /** Full-width block for narrative fields (history, findings, opinions). */
  longText(label: string, value: unknown) {
    autoTable(this.doc, {
      startY: this.y,
      body: [[label, fmt(value)]],
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.1, textColor: [15, 23, 42], valign: "top" },
      columnStyles: {
        0: { cellWidth: this.contentWidth * 0.22, fontStyle: "bold", textColor: SLATE, fillColor: [248, 250, 252] },
        1: { cellWidth: this.contentWidth * 0.78 },
      },
      margin: { left: MARGIN, right: MARGIN },
      didDrawPage: () => { if (this.doc.getCurrentPageInfo().pageNumber > 1) this.drawContinuationHeader(); },
    });

    this.y = (this.doc as any).lastAutoTable.finalY + 5;
  }

  /** Proper data table with a header row (injuries, identifiers, tests). */
  table(head: string[], body: string[][], emptyNote = "No entries recorded.") {
    if (body.length === 0) {
      this.ensureSpace(10);
      this.doc.setFont("helvetica", "italic");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(...SLATE);
      this.doc.text(emptyNote, MARGIN + 2, this.y + 3);
      this.doc.setTextColor(0, 0, 0);
      this.y += 9;
      return;
    }

    autoTable(this.doc, {
      startY: this.y,
      head: [head],
      body,
      theme: "grid",
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 8.5, fontStyle: "bold" },
      styles: { fontSize: 8.5, cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.1, textColor: [15, 23, 42], valign: "top" },
      margin: { left: MARGIN, right: MARGIN },
      didDrawPage: () => { if (this.doc.getCurrentPageInfo().pageNumber > 1) this.drawContinuationHeader(); },
    });

    this.y = (this.doc as any).lastAutoTable.finalY + 5;
  }

  /** Signature block with name, qualifications and a ruled signing line. */
  signature(name: string, lines: string[]) {
    this.ensureSpace(34);
    const { doc } = this;
    const boxW = this.contentWidth * 0.55;
    const x = this.pageWidth - MARGIN - boxW;

    this.y += 6;
    doc.setDrawColor(...SLATE);
    doc.setLineWidth(0.3);
    doc.line(x, this.y, x + boxW, this.y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(fmt(name), x, this.y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    let ly = this.y + 9.5;
    for (const line of lines.filter(Boolean)) {
      doc.text(line, x, ly);
      ly += 4;
    }
    doc.setTextColor(0, 0, 0);
    this.y = ly + 2;
  }

  /** Stamp footers on every page. Idempotent guard so it runs only once. */
  private finalize() {
    if (this.finalized) return;
    this.finalized = true;

    const { doc } = this;
    const total = doc.getNumberOfPages();

    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      const fy = this.pageHeight - 10;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, fy - 4, this.pageWidth - MARGIN, fy - 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...SLATE);
      doc.text("CONFIDENTIAL — Medico-legal document. Unauthorised disclosure is prohibited.", MARGIN, fy);
      doc.text(`Downloaded by ${this.meta.generatedBy}`, MARGIN, fy + 3.5);
      doc.text(`Page ${i} of ${total}`, this.pageWidth - MARGIN, fy, { align: "right" });
      doc.setTextColor(0, 0, 0);
    }
  }

  /** Finished PDF as raw bytes. Used by tests; the browser path uses save(). */
  output(): ArrayBuffer {
    this.finalize();
    return this.doc.output("arraybuffer");
  }

  /** Number of pages in the finished document. */
  pageCount(): number {
    this.finalize();
    return this.doc.getNumberOfPages();
  }

  /** Finalize and hand the file to the browser's download mechanism. */
  save(filename: string) {
    this.finalize();
    this.doc.save(filename);
  }
}
