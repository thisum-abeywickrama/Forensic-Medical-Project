import type { MLEFForm, Patient } from "@/types";
import { ReportDoc, fmtDate, fmtDateTime, fmtCoded } from "./reportDoc";
import { fileName, patientSection, BODY_HARM_LABELS, WEAPON_LABELS, SEXUAL_ASSAULT_LABELS } from "./shared";

export function buildMlefDoc(form: MLEFForm, patient: Patient | null, generatedBy: string): ReportDoc {
  const doc = new ReportDoc({
    title: "Medico-Legal Examination Form",
    reportId: form.id,
    generatedBy,
  });

  patientSection(doc, patient, form.patientId);

  doc.section("Part A — Police / Administrative Details");
  doc.fields([
    ["Police Station", form.policeStation],
    ["MLEF No.", form.mlefNo],
    ["Date of Issue", fmtDate(form.dateOfIssue)],
    ["Examinee Name", form.examineeName],
    ["Examinee Age", form.examineeAge],
    ["Examinee Sex", form.examineeSex],
    ["Examinee Address", form.examineeAddress],
    ["Reason for Referring", form.reasonForReferring],
  ]);
  doc.fields([
    ["Officer Name", form.officerName],
    ["Rank", form.officerRank],
    ["Reg. No.", form.officerRegNo],
    ["Officer Station", form.officerPoliceStation],
    ["Part A Filled By", form.partAFilledBy],
    ["Part A Filled At", fmtDateTime(form.partAFilledAt)],
  ]);

  doc.section("Part B — Medical Officer");
  doc.fields([
    ["Hospital", form.hospital],
    ["Ward", form.ward],
    ["BHT No.", form.bhtNo],
    ["Place of Examination", form.examPlace],
    ["Admission Date", fmtDate(form.admissionDate)],
    ["Examination Date/Time", fmtDateTime(form.examDateTime)],
    ["Discharge Date", fmtDate(form.dischargeDate)],
  ]);

  doc.section("Examination Findings");
  doc.fields([
    ["Body Harm Types", fmtCoded(form.bodyHarmTypes, BODY_HARM_LABELS)],
    ["Causative Weapon", fmtCoded(form.causativeWeapon, WEAPON_LABELS)],
    ["Weapon (Other)", form.causativeWeaponOther],
    ["Hurt Category", form.hurtCategory],
    ["Endangers Life", form.endangersLife],
    ["Alcohol Examination", form.alcoholExam],
    ["Drugs Examination", form.drugsExam],
    ["Signs of Sexual Assault", fmtCoded(form.sexualAssaultSigns, SEXUAL_ASSAULT_LABELS)],
  ]);
  doc.longText("Internal Injuries", form.internalInjuries);
  doc.longText("Brief History", form.briefHistory);
  doc.longText("Examination Findings", form.examFindings);
  doc.longText("Investigations", form.investigations);
  doc.longText("Referrals", form.referrals);
  doc.longText("Other Opinions", form.otherOpinions);
  doc.longText("Remarks", form.remarks);

  doc.section("Certifying Medical Officer");
  doc.fields([
    ["Ref. No.", form.refNo],
    ["SLMC Reg. No.", form.slmcRegNo],
    ["Part B Filled At", fmtDateTime(form.partBFilledAt)],
    ["Status", form.status],
  ]);

  doc.signature(form.doctorName, [
    form.doctorQualifications,
    form.doctorDesignation,
    form.slmcRegNo ? `SLMC Reg. No. ${form.slmcRegNo}` : "",
  ]);

  return doc;
}

export function downloadMlefPdf(form: MLEFForm, patient: Patient | null, generatedBy: string) {
  const doc = buildMlefDoc(form, patient, generatedBy);
  doc.save(fileName(form.id, patient?.name));
}
