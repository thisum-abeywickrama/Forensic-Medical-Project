import type { PMRForm, Patient } from "@/types";
import { ReportDoc, fmt, fmtDate, fmtDateTime } from "./reportDoc";
import { fileName, patientSection } from "./shared";

export function buildPmrDoc(form: PMRForm, patient: Patient | null, generatedBy: string): ReportDoc {
  const doc = new ReportDoc({
    title: "Post-Mortem Report",
    reportId: form.id,
    generatedBy,
  });

  patientSection(doc, patient, form.patientId);

  doc.section("Inquest Details");
  doc.fields([
    ["Inquest No.", form.inquestNo],
    ["Case No.", form.caseNo],
    ["Place", form.place],
    ["Courts", form.courts],
    ["District", form.district],
    ["Date", fmtDate(form.date)],
  ]);

  doc.section("Deceased");
  doc.fields([
    ["Name of Deceased", form.deceasedName],
    ["Date/Time of Death", fmtDateTime(form.dateTimeOfDeath)],
  ]);

  doc.section("Identification of the Body");
  doc.table(
    ["Identifier Name", "Address"],
    (form.identifiers ?? []).map(i => [fmt(i.name), fmt(i.address)]),
    "No identifiers recorded."
  );

  doc.section("Examination");
  doc.fields([
    ["Doctor Conducting", form.doctorConducting],
    ["Date/Time of Examination", fmtDateTime(form.dateTimeOfExam)],
    ["Place of Examination", form.placeOfExam],
    ["Status", form.status],
  ]);

  doc.section("Requested By");
  doc.fields([
    ["Requestor Name", form.requestorName],
    ["Designation", form.requestorDesignation],
  ]);

  doc.signature(form.jmoName, [
    "Judicial Medical Officer",
    form.placeOfExam,
    `Examination: ${fmtDateTime(form.dateTimeOfExam)}`,
  ]);

  return doc;
}

export function downloadPmrPdf(form: PMRForm, patient: Patient | null, generatedBy: string) {
  const doc = buildPmrDoc(form, patient, generatedBy);
  doc.save(fileName(form.id, patient?.name));
}
