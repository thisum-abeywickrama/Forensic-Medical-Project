import type { MLRReport, Patient } from "@/types";
import { ReportDoc, fmt, fmtDate } from "./reportDoc";
import { fileName, patientSection } from "./shared";

export function buildMlrDoc(report: MLRReport, patient: Patient | null, generatedBy: string): ReportDoc {
  const doc = new ReportDoc({
    title: "Medico-Legal Report",
    reportId: report.id,
    generatedBy,
  });

  patientSection(doc, patient, report.patientId);

  doc.section("Injuries Observed");
  doc.table(
    ["Injury No.", "Description"],
    (report.injuries ?? []).map(i => [fmt(i.no), fmt(i.description)]),
    "No injuries recorded."
  );

  doc.section("Grievous Injuries");
  doc.table(
    ["Injury No.", "Limb / Region", "Remarks"],
    (report.grievousEntries ?? []).map(g => [fmt(g.injuryNo), fmt(g.limb), fmt(g.remarks)]),
    "No grievous injuries recorded."
  );

  doc.fields([
    ["Non-Grievous Injury Nos.", report.nonGrievousNos],
    ["Injuries Capable of Causing Death", report.deathCausingCount],
  ]);

  doc.section("Categorisation by Weapon Type");
  doc.fields([
    ["Blunt Weapon Nos.", report.bluntWeaponNos],
    ["Blunt Contusion Nos.", report.bluntContusionNos],
    ["Cut Nos.", report.cutNos],
    ["Sharp Cutting Nos.", report.sharpCuttingNos],
    ["Stab Nos.", report.stabNos],
    ["Firearm Nos.", report.firearmsNos],
    ["Burns Nos.", report.burnsNos],
    ["Bite Nos.", report.biteNos],
  ]);

  doc.section("Toxicology & Observations");
  doc.fields([
    ["Smell of Liquor", report.patientSmellLiquor],
    ["Under Influence of Liquor", report.underInfluenceLiquor],
  ]);
  doc.longText("Special Investigations", report.specialInvestigations);
  doc.longText("Further Notes", report.furtherNotes);

  doc.section("Certifying Officer");
  doc.fields([
    ["Station", report.station],
    ["Date of Despatch", fmtDate(report.dateOfDespatch)],
    ["Status", report.status],
    ["Created", fmtDate(report.createdAt)],
  ]);

  doc.signature(report.doctorName, [
    report.doctorQualifications,
    report.designation,
    report.station,
  ]);

  return doc;
}

export function downloadMlrPdf(report: MLRReport, patient: Patient | null, generatedBy: string) {
  const doc = buildMlrDoc(report, patient, generatedBy);
  doc.save(fileName(report.id, patient?.name));
}
