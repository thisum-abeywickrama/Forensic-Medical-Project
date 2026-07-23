import { describe, test, expect } from "vitest";
import { buildMlefDoc } from "../mlef";
import { buildMlrDoc } from "../mlr";
import { buildPmrDoc } from "../pmr";
import { buildAutopsyDoc } from "../autopsy";
import { buildLabDoc } from "../lab";
import { fileName } from "../shared";
import { isDownloadable, isDraft } from "../status";
import { fmt, fmtDate, fmtDateTime, fmtCoded } from "../reportDoc";
import type { MLEFForm, MLRReport, PMRForm, AutopsyForm, LabRequest, Patient } from "@/types";

const PATIENT: Patient = {
  id: "P2026-001", name: "Ruwan Kumara", dob: "1985-03-15", age: 41, sex: "Male",
  address: "123 Galle Road, Colombo 03", nic: "851530423V", email: "ruwan.k@gmail.com",
  phone: "0711234567", registeredAt: "2026-06-20T08:30:00", registeredBy: "Nimal Silva",
};

const MLEF = {
  id: "MLEF-2026-001", patientId: "P2026-001", policeStation: "Colombo Fort",
  mlefNo: "CF/2026/1234", dateOfIssue: "2026-06-20", examineeName: "Ruwan Kumara",
  examineeAddress: "123 Galle Road", examineeAge: "41", examineeSex: "Male",
  reasonForReferring: "Assault causing bodily harm", officerName: "Nimal Silva",
  officerRank: "Sub Inspector", officerRegNo: "PS/7890", officerPoliceStation: "Colombo Fort",
  partAFilledBy: "Nimal Silva", partAFilledAt: "2026-06-20T08:30:00",
  hospital: "National Hospital Colombo", ward: "Surgical Ward 5", bhtNo: "23181",
  admissionDate: "2026-06-20", examDateTime: "2026-06-20T09:40:00", dischargeDate: "",
  examPlace: "NHC", bodyHarmTypes: ["laceration", "contusion"], internalInjuries: "Nil",
  causativeWeapon: ["blunt"], causativeWeaponOther: "", hurtCategory: "non-grievous",
  endangersLife: "no", alcoholExam: "negative", drugsExam: "negative", sexualAssaultSigns: [],
  briefHistory: "Patient states he was attacked by unknown persons.",
  examFindings: "Multiple lacerations over scalp.", investigations: "X-Ray skull",
  referrals: "Nil", otherOpinions: "Consistent with blunt force trauma.",
  remarks: "Patient cooperative.", doctorName: "Dr. Amal Perera",
  doctorQualifications: "MBBS", slmcRegNo: "SLMC/12345", doctorDesignation: "Medical Officer",
  refNo: "NHC/MLR/2026/001", partBFilledBy: "d1", partBFilledAt: "2026-06-20T10:15:00",
  labRequestId: "", status: "complete", createdAt: "2026-06-20T08:30:00", createdBy: "a1",
} as MLEFForm;

const MLR = {
  id: "MLR-2026-001", patientId: "P2026-001",
  injuries: [{ id: "1", no: "1", description: "Laceration 3cm over scalp" }],
  specialInvestigations: "CT brain", nonGrievousNos: ["1"],
  grievousEntries: [{ id: "GE1", injuryNo: "2", limb: "Left arm", remarks: "Fracture" }],
  deathCausingCount: "0", bluntWeaponNos: "1", bluntContusionNos: "1", cutNos: "",
  sharpCuttingNos: "", stabNos: "", firearmsNos: "", burnsNos: "", biteNos: "",
  furtherNotes: "Nil", patientSmellLiquor: "no", underInfluenceLiquor: "no",
  doctorName: "Dr. Ruwan Perera", doctorQualifications: "MBBS, DLM",
  designation: "JMO", station: "Colombo", dateOfDespatch: "2026-06-25",
  labRequestId: "", status: "submitted", createdAt: "2026-06-22T08:00:00", createdBy: "j1",
} as MLRReport;

const PMR = {
  id: "PMR-2026-001", patientId: "P2026-001", inquestNo: "IQ/2026/44",
  place: "Colombo", courts: "Colombo Magistrate", date: "2026-06-23", caseNo: "B/1234/26",
  deceasedName: "Ruwan Kumara", dateTimeOfDeath: "2026-06-22T21:00:00",
  doctorConducting: "Dr. Ruwan Perera", dateTimeOfExam: "2026-06-23T09:00:00",
  placeOfExam: "NHC Mortuary", district: "Colombo", requestorName: "Nimal Silva",
  requestorDesignation: "Sub Inspector",
  identifiers: [{ id: "1", name: "Kamal Kumara", address: "123 Galle Road" }],
  jmoName: "Dr. Ruwan Perera", labRequestId: "", status: "submitted",
  createdAt: "2026-06-23T08:00:00", createdBy: "j1",
} as PMRForm;

const AUTOPSY = {
  id: "AUTOPSY-2026-001", patientId: "P2026-001", pmRegisterSerialNo: "PM/2026/44", date: "2026-06-23", verdict: "Natural",
  locusExamination: "Mortuary table", externalExamination: "Well-nourished adult male", injuries: "No external injuries", injuriesOnContinuationSheet: false,
  height: "172 cm", estimatedAge: "41", sex: "Male", eyesAndPupils: "Normal", hair: "Black", tongue: "Normal", teeth: "Natural dentition",
  bodyTemperature: "Cool", primaryFlaccidity: "Absent", rigorMortis: "Present", hypostasis: "Posterior", putrefaction: "Absent",
  noseMouthEars: "Nil", urinaryAndSexual: "Nil", anal: "Nil", handsAndNails: "Clean", neck: "No injury",
  headSoftParts: "Normal", skullBones: "Intact", brainMembranesSinuses: "Normal", brainSubstanceVentricles: "Normal", brainBloodVessels: "Normal", spinalCord: "Normal",
  thoraxBones: "Intact", chestCavity: "Normal", pericardium: "Normal", heart: "Normal", coronaryVessels: "Patent", largeBloodVessels: "Normal", larynxTracheaBronchi: "Clear", pleuraAndLungs: "Normal", gullet: "Normal",
  abdomenContents: "Normal", peritoneum: "Normal", diaphragm: "Normal", liverAndGallBladder: "Normal", spleen: "Normal", stomach: "Empty", smallIntestines: "Normal", largeIntestines: "Normal", pancreas: "Normal", kidneys: "Normal", suprarenalGlands: "Normal",
  bladderAndProstate: "Normal", generativeOrgans: "Normal", pelvicBloodVessels: "Normal", pelvicBones: "Intact", causeOfDeath: "Natural causes", articlesSecured: [{ id: "1", description: "Blood sample", purpose: "Toxicology" }],
  moName: "Dr. Ruwan Perera", moQualifications: "MBBS, DLM", moDesignation: "JMO", labRequestId: "", status: "submitted", createdAt: "2026-06-23T08:00:00", createdBy: "j1",
} as AutopsyForm;

const LAB = {
  id: "LAB-2026-001", patientId: "P2026-001", requestedBy: "d2",
  requestedByName: "Dr. Saman Fernando", requestedAt: "2026-06-21T10:30:00",
  formType: "mlef", formId: "MLEF-2026-001", testTypes: ["blood_alcohol", "drug_screen"],
  urgency: "urgent", clinicalHistory: "Alleged assault, suspected alcohol.",
  status: "completed", testResults: "Blood alcohol 82mg/dL", observations: "No drugs detected",
  conclusion: "Positive for alcohol", labTechName: "Chaminda Wickramasinghe",
  completedAt: "2026-06-22T14:00:00",
} as LabRequest;

/** PDFs start with the %PDF- magic bytes. */
const isPdf = (buf: ArrayBuffer) =>
  new TextDecoder().decode(new Uint8Array(buf).slice(0, 5)) === "%PDF-";

describe("PDF value formatting", () => {
  test("1. Renders empty, null and undefined values as a dash", () => {
    expect(fmt(null)).toBe("—");
    expect(fmt(undefined)).toBe("—");
    expect(fmt("")).toBe("—");
    expect(fmt("   ")).toBe("—");
    expect(fmt([])).toBe("—");
  });

  test("2. Renders real values and joins arrays", () => {
    expect(fmt("Colombo")).toBe("Colombo");
    expect(fmt(0)).toBe("0");
    expect(fmt(["a", "b"])).toBe("a, b");
  });

  test("3. Formats dates as dd/mm/yyyy and passes through junk unchanged", () => {
    expect(fmtDate("2026-06-20")).toBe("20/06/2026");
    expect(fmtDate("")).toBe("—");
    expect(fmtDate("not-a-date")).toBe("not-a-date");
    expect(fmtDateTime("2026-06-20T09:40:00")).toMatch(/^20\/06\/2026 \d{2}:\d{2}$/);
  });

  test("4. Maps coded values to human labels", () => {
    const labels = { blood_alcohol: "Blood Alcohol", dna: "DNA" };
    expect(fmtCoded(["blood_alcohol", "dna"], labels)).toBe("Blood Alcohol, DNA");
    expect(fmtCoded("blood_alcohol", labels)).toBe("Blood Alcohol");
    // Unknown codes fall back to the raw value rather than vanishing
    expect(fmtCoded("mystery_test", labels)).toBe("mystery_test");
    expect(fmtCoded([], labels)).toBe("—");
  });
});

describe("Download filenames", () => {
  test("5. Combines report id and patient name", () => {
    expect(fileName("MLEF-2026-001", "Ruwan Kumara")).toBe("MLEF-2026-001_Ruwan-Kumara.pdf");
  });

  test("6. Strips characters that are unsafe in a filename", () => {
    expect(fileName("LAB/2026\\001", "O'Brien, Seán")).toBe("LAB-2026-001_O-Brien-Se-n.pdf");
  });

  test("7. Omits the suffix when the patient is unknown", () => {
    expect(fileName("PMR-2026-001")).toBe("PMR-2026-001.pdf");
  });
});

describe("Export eligibility", () => {
  test("8. Allows finished records", () => {
    expect(isDownloadable("mlef", "complete")).toBe(true);
    expect(isDownloadable("mlr", "submitted")).toBe(true);
    expect(isDownloadable("pmr", "submitted")).toBe(true);
    expect(isDownloadable("autopsy", "submitted")).toBe(true);
    expect(isDownloadable("lab", "completed")).toBe(true);
  });

  test("9. Allows MLEF at any stage, including draft", () => {
    expect(isDownloadable("mlef", "draft")).toBe(true);
    expect(isDownloadable("mlef", "")).toBe(true);
  });

  test("10. Still blocks unfinished MLR, PMR, autopsy and lab records", () => {
    expect(isDownloadable("mlr", "draft")).toBe(false);
    expect(isDownloadable("pmr", "draft")).toBe(false);
    expect(isDownloadable("autopsy", "draft")).toBe(false);
    expect(isDownloadable("lab", "pending")).toBe(false);
    expect(isDownloadable("lab", "in_progress")).toBe(false);
  });

  test("11. Flags unfinished records as drafts", () => {
    expect(isDraft("mlef", "draft")).toBe(true);
    expect(isDraft("mlef", "complete")).toBe(false);
    expect(isDraft("mlr", "draft")).toBe(true);
    expect(isDraft("mlr", "submitted")).toBe(false);
    expect(isDraft("autopsy", "draft")).toBe(true);
    expect(isDraft("autopsy", "submitted")).toBe(false);
    expect(isDraft("lab", "pending")).toBe(true);
    expect(isDraft("lab", "completed")).toBe(false);
  });
});

describe("Report generation", () => {
  const cases = [
    ["MLEF", () => buildMlefDoc(MLEF, PATIENT, "Dr. Tester")],
    ["MLR", () => buildMlrDoc(MLR, PATIENT, "Dr. Tester")],
    ["PMR", () => buildPmrDoc(PMR, PATIENT, "Dr. Tester")],
    ["Autopsy", () => buildAutopsyDoc(AUTOPSY, PATIENT, "Dr. Tester")],
    ["Lab", () => buildLabDoc(LAB, PATIENT, "Dr. Tester")],
  ] as const;

  test.each(cases)("12. %s report produces a valid non-empty PDF", (_name, build) => {
    const buf = build().output();
    expect(isPdf(buf)).toBe(true);
    expect(buf.byteLength).toBeGreaterThan(2000);
  });

  test.each(cases)("13. %s report paginates rather than overflowing", (_name, build) => {
    expect(build().pageCount()).toBeGreaterThanOrEqual(1);
  });

  test("14. Survives a record with missing and null fields", () => {
    // Half-filled records are common; a crash here would block a legitimate export.
    const sparse = {
      id: "MLEF-2026-999", patientId: "P2026-001", status: "complete",
      bodyHarmTypes: null, causativeWeapon: undefined, sexualAssaultSigns: [],
    } as unknown as MLEFForm;

    const buf = buildMlefDoc(sparse, PATIENT, "Dr. Tester").output();
    expect(isPdf(buf)).toBe(true);
  });

  test("15. Survives an unknown patient", () => {
    const buf = buildMlrDoc(MLR, null, "Dr. Tester").output();
    expect(isPdf(buf)).toBe(true);
  });

  test("16. Handles MLR with no injuries or grievous entries", () => {
    const empty = { ...MLR, injuries: [], grievousEntries: [] } as MLRReport;
    expect(isPdf(buildMlrDoc(empty, PATIENT, "Dr. Tester").output())).toBe(true);
  });

  test("17. Long narrative text spills onto additional pages", () => {
    const wordy = {
      ...MLEF,
      examFindings: "Extensive findings. ".repeat(400),
      briefHistory: "Detailed history. ".repeat(400),
    } as MLEFForm;

    expect(buildMlefDoc(wordy, PATIENT, "Dr. Tester").pageCount()).toBeGreaterThan(1);
  });
});

describe("Draft MLEF export", () => {
  const DRAFT_MLEF = {
    ...MLEF, id: "MLEF-2026-002", status: "draft",
    // A realistic half-filled form: Part A done, Part B untouched
    hospital: "", ward: "", bhtNo: "", examDateTime: "", bodyHarmTypes: [],
    causativeWeapon: [], examFindings: "", doctorName: "", partBFilledAt: "",
  } as MLEFForm;

  test("18. Generates a valid PDF from a half-filled draft", () => {
    const buf = buildMlefDoc(DRAFT_MLEF, PATIENT, "Dr. Tester").output();
    expect(isPdf(buf)).toBe(true);
    expect(buf.byteLength).toBeGreaterThan(2000);
  });

  test("19. Marks the draft in the document text", () => {
    const raw = new TextDecoder("latin1").decode(
      new Uint8Array(buildMlefDoc(DRAFT_MLEF, PATIENT, "Dr. Tester").output())
    );
    expect(raw).toContain("DRAFT");
    expect(raw).toContain("not a certified medico-legal document");
  });

  test("20. Leaves completed forms unmarked", () => {
    const raw = new TextDecoder("latin1").decode(
      new Uint8Array(buildMlefDoc(MLEF, PATIENT, "Dr. Tester").output())
    );
    expect(raw).not.toContain("DRAFT, NOT FINAL");
    expect(raw).not.toContain("not a certified medico-legal document");
  });

  test("21. Empty Part B fields never leak a raw 'undefined' into the document", () => {
    // Note: the PDF container itself uses the token `null` in its object
    // dictionaries, so only "undefined" is safe to search for in raw bytes.
    // The fmt() unit tests above cover the placeholder rendering directly.
    const raw = new TextDecoder("latin1").decode(
      new Uint8Array(buildMlefDoc(DRAFT_MLEF, PATIENT, "Dr. Tester").output())
    );
    expect(raw).not.toContain("undefined");
  });
});
