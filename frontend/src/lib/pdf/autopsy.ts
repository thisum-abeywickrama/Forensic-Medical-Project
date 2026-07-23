import type { AutopsyForm, Patient } from "@/types";
import { ReportDoc, fmt, fmtDate } from "./reportDoc";
import { fileName, patientSection } from "./shared";

export function buildAutopsyDoc(form: AutopsyForm, patient: Patient | null, generatedBy: string): ReportDoc {
  const doc = new ReportDoc({ title: "Post-Mortem Examination Report", reportId: form.id, generatedBy, draft: form.status !== "submitted" });
  patientSection(doc, patient, form.patientId);
  doc.section("Post-Mortem Register");
  doc.fields([["PM Register Serial No.", form.pmRegisterSerialNo], ["Date", fmtDate(form.date)], ["Verdict", form.verdict], ["Height", form.height], ["Estimated Age", form.estimatedAge], ["Sex", form.sex], ["Body Temperature", form.bodyTemperature]]);
  const groups: [string, [string, unknown][]][] = [
    ["Examination of the Locus", [["Site and position of body", form.locusExamination]]],
    ["External Examination", [["Clothing, nourishment, colour, marks and disease", form.externalExamination]]],
    ["Injuries", [["Injuries", form.injuries], ["Recorded on continuation sheet", form.injuriesOnContinuationSheet ? "Yes" : "No"]]],
    ["Head & Facial Features (External)", [["Eyes and pupils", form.eyesAndPupils], ["Hair", form.hair], ["Tongue", form.tongue], ["Teeth", form.teeth]]],
    ["Signs of Death", [["Primary flaccidity", form.primaryFlaccidity], ["Rigor mortis", form.rigorMortis], ["Hypostasis", form.hypostasis], ["Putrefaction", form.putrefaction]]],
    ["Natural Openings", [["Nose, mouth and ears", form.noseMouthEars], ["Urinary and sexual organs", form.urinaryAndSexual], ["Anal opening", form.anal]]],
    ["Hands & Nails", [["Hands and nails", form.handsAndNails]]],
    ["Neck", [["Neck", form.neck]]],
    ["Head (Internal Examination)", [["Head soft parts", form.headSoftParts], ["Skull bones", form.skullBones], ["Brain membranes and sinuses", form.brainMembranesSinuses], ["Brain substance and ventricles", form.brainSubstanceVentricles], ["Brain blood vessels", form.brainBloodVessels]]],
    ["Spinal Cord", [["Spinal cord", form.spinalCord]]],
    ["Thorax", [["Thorax bones", form.thoraxBones], ["Chest cavity", form.chestCavity], ["Pericardium", form.pericardium], ["Heart", form.heart], ["Coronary vessels", form.coronaryVessels], ["Large blood vessels", form.largeBloodVessels], ["Larynx, trachea and bronchi", form.larynxTracheaBronchi], ["Pleura and lungs", form.pleuraAndLungs], ["Gullet", form.gullet]]],
    ["Abdomen", [["Abdomen contents", form.abdomenContents], ["Peritoneum", form.peritoneum], ["Diaphragm", form.diaphragm], ["Liver and gall bladder", form.liverAndGallBladder], ["Spleen", form.spleen], ["Stomach", form.stomach], ["Duodenum, jejunum, ileum", form.smallIntestines], ["Large intestines", form.largeIntestines], ["Pancreas", form.pancreas], ["Kidneys", form.kidneys], ["Suprarenal glands", form.suprarenalGlands]]],
    ["Pelvis", [["Bladder and prostate", form.bladderAndProstate], ["Generative organs", form.generativeOrgans], ["Pelvic blood vessels", form.pelvicBloodVessels], ["Pelvic bones", form.pelvicBones]]],
    ["Cause of Death & Opinion", [["Cause of death and opinion", form.causeOfDeath]]],
  ];
  for (const [title, fields] of groups) {
    doc.section(title);
    doc.longText(title, fields.map(([label, value]) => `${label}: ${fmt(value)}`).join("\n\n"));
  }
  doc.section("Articles Secured");
  doc.table(["Article / Specimen", "Sent To / Purpose For Analysis"], (form.articlesSecured ?? []).map(article => [fmt(article.description), fmt(article.purpose)]), "No articles secured.");
  doc.signature(form.moName, [form.moQualifications, form.moDesignation, "Judicial Medical Officer"]);
  return doc;
}

export function downloadAutopsyPdf(form: AutopsyForm, patient: Patient | null, generatedBy: string) {
  buildAutopsyDoc(form, patient, generatedBy).save(fileName(form.id, patient?.name));
}
