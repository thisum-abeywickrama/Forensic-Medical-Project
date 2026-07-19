/**
 * Only finished records may be exported. Drafts are still editable, so a PDF of
 * one would be a snapshot that misrepresents itself as an official document.
 *
 * Kept in its own module, free of any jsPDF import, so that list pages can check
 * downloadability without pulling the PDF engine into the main bundle.
 */
export function isDownloadable(kind: "mlef" | "mlr" | "pmr" | "lab", status: string): boolean {
  switch (kind) {
    case "mlef": return status === "complete";
    case "mlr":
    case "pmr": return status === "submitted";
    case "lab": return status === "completed";
    default: return false;
  }
}
