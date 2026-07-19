import type { MLEFForm, MLRReport, PMRForm, LabRequest, Patient } from "@/types";

export { isDownloadable } from "./status";

// jsPDF and its dependencies weigh several hundred kB. Loading them on demand
// keeps them out of the initial bundle — the cost is paid only when a user
// actually downloads a report.
export const downloadMlefPdf = async (form: MLEFForm, patient: Patient | null, generatedBy: string) =>
  (await import("./mlef")).downloadMlefPdf(form, patient, generatedBy);

export const downloadMlrPdf = async (report: MLRReport, patient: Patient | null, generatedBy: string) =>
  (await import("./mlr")).downloadMlrPdf(report, patient, generatedBy);

export const downloadPmrPdf = async (form: PMRForm, patient: Patient | null, generatedBy: string) =>
  (await import("./pmr")).downloadPmrPdf(form, patient, generatedBy);

export const downloadLabPdf = async (req: LabRequest, patient: Patient | null, generatedBy: string) =>
  (await import("./lab")).downloadLabPdf(req, patient, generatedBy);
