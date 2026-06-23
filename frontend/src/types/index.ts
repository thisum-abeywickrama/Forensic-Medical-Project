export type Role = "doctor" | "admin" | "lab" | "jmo";
export type Urgency = "routine" | "urgent" | "stat";
export type MlefStatus = "draft" | "complete";
export type FormStatus = "draft" | "submitted";
export type LabStatus = "pending" | "in_progress" | "completed";

export interface AppUser {
  id: string;
  name: string;
  role: Role;
  designation: string;
  username: string;
  password: string;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  age: number;
  sex: string;
  address: string;
  nic: string;
  registeredAt: string;
  registeredBy: string;
}

export interface MLEFForm {
  id: string;
  patientId: string;
  // Part A — Police/Admin
  policeStation: string;
  mlefNo: string;
  dateOfIssue: string;
  examineeName: string;
  examineeAddress: string;
  examineeAge: string;
  examineeSex: string;
  reasonForReferring: string;
  officerName: string;
  officerRank: string;
  officerRegNo: string;
  officerPoliceStation: string;
  partAFilledBy: string;
  partAFilledAt: string;
  // Part B — Medical Officer
  hospital: string;
  ward: string;
  bhtNo: string;
  admissionDate: string;
  examDateTime: string;
  dischargeDate: string;
  examPlace: string;
  bodyHarmTypes: string[];
  internalInjuries: string;
  causativeWeapon: string[];
  causativeWeaponOther: string;
  hurtCategory: string;
  endangersLife: string;
  alcoholExam: string;
  drugsExam: string;
  sexualAssaultSigns: string[];
  briefHistory: string;
  examFindings: string;
  investigations: string;
  referrals: string;
  otherOpinions: string;
  remarks: string;
  doctorName: string;
  doctorQualifications: string;
  slmcRegNo: string;
  doctorDesignation: string;
  refNo: string;
  partBFilledBy: string;
  partBFilledAt: string;
  labRequestId: string;
  status: MlefStatus;
  createdAt: string;
  createdBy: string;
}

export interface InjuryEntry {
  id: string;
  no: string;
  description: string;
}

export interface GrievousEntry {
  id: string;
  injuryNo: string;
  limb: string;
  remarks: string;
}

export interface MLRReport {
  id: string;
  patientId: string;
  injuries: InjuryEntry[];
  specialInvestigations: string;
  nonGrievousNos: string[];
  grievousEntries: GrievousEntry[];
  deathCausingCount: string;
  bluntWeaponNos: string;
  bluntContusionNos: string;
  cutNos: string;
  sharpCuttingNos: string;
  stabNos: string;
  firearmsNos: string;
  burnsNos: string;
  biteNos: string;
  furtherNotes: string;
  patientSmellLiquor: string;
  underInfluenceLiquor: string;
  doctorName: string;
  doctorQualifications: string;
  designation: string;
  station: string;
  dateOfDespatch: string;
  labRequestId: string;
  status: FormStatus;
  createdAt: string;
  createdBy: string;
}

export interface LabRequest {
  id: string;
  patientId: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  formType: string;
  formId: string;
  testTypes: string[];
  urgency: Urgency;
  clinicalHistory: string;
  status: LabStatus;
  testResults: string;
  observations: string;
  conclusion: string;
  labTechName: string;
  completedAt: string;
}

export interface BodyIdentifier {
  id: string;
  name: string;
  address: string;
}

export interface PMRForm {
  id: string;
  patientId: string;
  inquestNo: string;
  place: string;
  courts: string;
  date: string;
  caseNo: string;
  deceasedName: string;
  dateTimeOfDeath: string;
  doctorConducting: string;
  dateTimeOfExam: string;
  placeOfExam: string;
  district: string;
  requestorName: string;
  requestorDesignation: string;
  identifiers: BodyIdentifier[];
  jmoName: string;
  labRequestId: string;
  status: FormStatus;
  createdAt: string;
  createdBy: string;
}

