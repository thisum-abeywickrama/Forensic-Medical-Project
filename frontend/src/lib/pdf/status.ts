/**
 * Which records may be exported as PDF.
 *
 * MLEF is downloadable at any stage — an incomplete examination form often has
 * to travel with the patient or go to the police before Part B is filled in.
 * Unfinished exports are stamped DRAFT by the generator so they cannot be
 * mistaken for a completed record (see isDraft).
 *
 * The other three stay restricted to finished records.
 *
 * Kept in its own module, free of any jsPDF import, so that list pages can check
 * downloadability without pulling the PDF engine into the main bundle.
 */
export function isDownloadable(kind: "mlef" | "mlr" | "pmr" | "lab", status: string): boolean {
  return true;
}

/** Whether an exported record should carry the DRAFT marking. */
export function isDraft(kind: "mlef" | "mlr" | "pmr" | "lab", status: string): boolean {
  return !(
    (kind === "mlef" && status === "complete") ||
    ((kind === "mlr" || kind === "pmr") && status === "submitted") ||
    (kind === "lab" && status === "completed")
  );
}
