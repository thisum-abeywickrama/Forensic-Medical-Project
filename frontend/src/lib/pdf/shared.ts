import type { Patient } from "@/types";
import { ReportDoc, fmtDate } from "./reportDoc";
import { BODY_HARM_OPTIONS, WEAPON_OPTIONS, SEXUAL_ASSAULT_OPTIONS } from "@/data/mockData";

/** Turn an options array into a value -> label lookup. */
const toLabelMap = (opts: { value: string; label: string }[]) =>
  Object.fromEntries(opts.map(o => [o.value, o.label]));

export const BODY_HARM_LABELS = toLabelMap(BODY_HARM_OPTIONS);
export const WEAPON_LABELS = toLabelMap(WEAPON_OPTIONS);
export const SEXUAL_ASSAULT_LABELS = toLabelMap(SEXUAL_ASSAULT_OPTIONS);

/** Safe, readable download filename: MLEF-2026-001_Ruwan-Kumara.pdf */
export function fileName(reportId?: string | null, patientName?: string | null): string {
  const clean = (s?: string | null) => (s ?? "").trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const baseId = clean(reportId) || "Report";
  const suffix = patientName && clean(patientName) ? `_${clean(patientName)}` : "";
  return `${baseId}${suffix}.pdf`;
}

/** The patient details block, identical across all four report types. */
export function patientSection(doc: ReportDoc, patient: Patient | null, patientId: string) {
  doc.section("Patient Details");

  if (!patient) {
    doc.fields([["Patient ID", patientId], ["Record", "Patient record not available"]]);
    return;
  }

  doc.fields([
    ["Patient ID", patient.id],
    ["Full Name", patient.name],
    ["Date of Birth", fmtDate(patient.dob)],
    ["Sex", patient.sex],
    ["NIC", patient.nic],
    ["Phone", patient.phone],
    ["Address", patient.address],
    ["Registered By", patient.registeredBy],
  ]);
}
