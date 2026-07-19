import type { LabRequest, Patient } from "@/types";
import { ReportDoc, fmtDateTime, fmtCoded } from "./reportDoc";
import { fileName, patientSection } from "./shared";
import { TEST_LABELS } from "@/data/mockData";

export function buildLabDoc(req: LabRequest, patient: Patient | null, generatedBy: string): ReportDoc {
  const doc = new ReportDoc({
    title: "Laboratory Report",
    reportId: req.id,
    generatedBy,
  });

  patientSection(doc, patient, req.patientId);

  doc.section("Request Details");
  doc.fields([
    ["Requested By", req.requestedByName],
    ["Requested At", fmtDateTime(req.requestedAt)],
    ["Source Form Type", req.formType ? req.formType.toUpperCase() : "—"],
    ["Source Form ID", req.formId],
    ["Urgency", req.urgency],
    ["Status", req.status],
    ["Tests Requested", fmtCoded(req.testTypes, TEST_LABELS)],
  ]);
  doc.longText("Clinical History", req.clinicalHistory);

  doc.section("Results");
  doc.longText("Test Results", req.testResults);
  doc.longText("Observations", req.observations);
  doc.longText("Conclusion", req.conclusion);

  doc.section("Completion");
  doc.fields([
    ["Analysed By", req.labTechName],
    ["Completed At", fmtDateTime(req.completedAt)],
  ]);

  doc.signature(req.labTechName, [
    "Laboratory Officer",
    `Report ID: ${req.id}`,
    `Completed: ${fmtDateTime(req.completedAt)}`,
  ]);

  return doc;
}

export function downloadLabPdf(req: LabRequest, patient: Patient | null, generatedBy: string) {
  const doc = buildLabDoc(req, patient, generatedBy);
  doc.save(fileName(req.id, patient?.name));
}
