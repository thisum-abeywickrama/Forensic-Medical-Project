import { useState } from "react";
import { Save, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { FormSection } from "@/components/ui/FormSection";
import { CheckGroup } from "@/components/ui/CheckGroup";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { genId } from "@/lib/utils";
import { BODY_HARM_OPTIONS, WEAPON_OPTIONS, SEXUAL_ASSAULT_OPTIONS } from "@/data/mockData";
import type { MLEFForm as MLEFFormType, Patient, AppUser, LabRequest, Role } from "@/types";

interface Props {
  form: MLEFFormType | null;
  patient: Patient | null;
  allPatients: Patient[];
  userRole: Role;
  currentUser: AppUser;
  labRequest: LabRequest | null;
  onSave: (f: MLEFFormType) => void;
  onBack: () => void;
  onRequestLab: (patientId: string, formId: string, formType: string) => void;
}

export function MLEFForm({ form: initForm, patient: initPatient, allPatients, userRole, currentUser, labRequest, onSave, onBack, onRequestLab }: Props) {
  const isNew = !initForm;
  const now = new Date().toISOString();

  const [selectedPatientId, setSelectedPatientId] = useState(initPatient?.id ?? initForm?.patientId ?? "");
  const patient = allPatients.find(p => p.id === selectedPatientId) ?? initPatient;

  const [f, setF] = useState<MLEFFormType>(initForm ?? {
    id: genId("MLEF"),
    patientId: initPatient?.id ?? "",
    policeStation: "", mlefNo: "", dateOfIssue: new Date().toISOString().slice(0, 10),
    examineeName: initPatient?.name ?? "",
    examineeAddress: initPatient?.address ?? "",
    examineeAge: initPatient ? String(initPatient.age) : "", examineeSex: initPatient?.sex ?? "Male",
    reasonForReferring: "", officerName: "", officerRank: "", officerRegNo: "", officerPoliceStation: "",
    partAFilledBy: "", partAFilledAt: "",
    hospital: "", ward: "", bhtNo: "", admissionDate: "", examDateTime: "", dischargeDate: "", examPlace: "",
    bodyHarmTypes: [], internalInjuries: "", causativeWeapon: [], causativeWeaponOther: "", hurtCategory: "", endangersLife: "",
    alcoholExam: "", drugsExam: "", sexualAssaultSigns: [],
    briefHistory: "", examFindings: "", investigations: "", referrals: "", otherOpinions: "", remarks: "",
    doctorName: "", doctorQualifications: "", slmcRegNo: "", doctorDesignation: "", refNo: "",
    partBFilledBy: "", partBFilledAt: "", labRequestId: "",
    status: "draft", createdAt: now, createdBy: currentUser.id,
  });

  const s = (k: keyof MLEFFormType) => (v: string) => setF(prev => ({ ...prev, [k]: v }));

  const toggleArr = (key: "bodyHarmTypes" | "causativeWeapon" | "sexualAssaultSigns", val: string) => {
    setF(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  const isAdminEditA = userRole === "admin";
  const isDoctorEditB = userRole === "doctor" || userRole === "jmo";
  const hasPartA = !!f.partAFilledAt;
  const hasPartB = !!f.partBFilledAt;

  const handleSave = () => {
    const updated: MLEFFormType = {
      ...f,
      patientId: selectedPatientId || f.patientId,
      ...(isAdminEditA && { partAFilledBy: currentUser.id, partAFilledAt: new Date().toISOString() }),
      ...(isDoctorEditB && { partBFilledBy: currentUser.id, partBFilledAt: new Date().toISOString(), status: "complete" as const }),
    };
    onSave(updated);
    onBack();
  };

  return (
    <div>
      <PageHeader
        title={isNew ? "New MLEF Form" : `MLEF — ${f.id}`}
        subtitle={patient ? `Patient: ${patient.name} · ${patient.id}` : undefined}
        onBack={onBack}
        actions={
          <div className="flex gap-2">
            {isDoctorEditB && !f.labRequestId && (
              <Btn variant="secondary" size="sm" icon={<FlaskConical size={13} />}
                onClick={() => onRequestLab(f.patientId, f.id, "mlef")}>
                Request Lab Report
              </Btn>
            )}
            <Btn variant="primary" icon={<Save size={14} />} onClick={handleSave}>
              {isAdminEditA ? "Save Police Section" : "Save Medical Section"}
            </Btn>
          </div>
        }
      />

      {isNew && isAdminEditA && !initPatient && (
        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
            Select Patient <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedPatientId}
            onChange={v => {
              setSelectedPatientId(v);
              const p = allPatients.find(x => x.id === v);
              if (p) setF(prev => ({ ...prev, patientId: p.id, examineeName: p.name, examineeAddress: p.address, examineeAge: String(p.age), examineeSex: p.sex }));
            }}
            placeholder="— Choose a patient —"
            options={allPatients.map(p => ({ value: p.id, label: `${p.name} (${p.id}) · NIC: ${p.nic}` }))}
          />
        </div>
      )}

      {f.labRequestId && labRequest && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          <FlaskConical size={15} /> Lab Report Requested · Status: <Badge status={labRequest.status} />
          {labRequest.status === "completed" && <span className="font-medium">— Results available</span>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PART A */}
        <div>
          <FormSection title="Part A — Police Section (1–8)" badge={<Badge status={hasPartA ? "complete" : "draft"} />}>
            {!isAdminEditA && <ReadOnlyBanner text="This section is filled by Admin/Police staff. View only." />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormField label="Police Station" required={isAdminEditA}>
                <Input value={f.policeStation} onChange={s("policeStation")} disabled={!isAdminEditA} />
              </FormField>
              <FormField label="MLEF No.">
                <Input value={f.mlefNo} onChange={s("mlefNo")} disabled={!isAdminEditA} />
              </FormField>
              <FormField label="Date of Issue">
                <Input type="date" value={f.dateOfIssue} onChange={s("dateOfIssue")} disabled={!isAdminEditA} />
              </FormField>
              <FormField label="Sex of Examinee">
                <Select value={f.examineeSex} onChange={s("examineeSex")} disabled={!isAdminEditA}
                  options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
              </FormField>
            </div>
            <FormField label="Full Name of Examinee" required={isAdminEditA}>
              <Input value={f.examineeName} onChange={s("examineeName")} disabled={!isAdminEditA} placeholder="Full name of examinee" />
            </FormField>
            <FormField label="Address of Examinee" required={isAdminEditA}>
              <Textarea value={f.examineeAddress} onChange={s("examineeAddress")} disabled={!isAdminEditA} rows={2} placeholder="Residential address" />
            </FormField>
            <FormField label="Age of Examinee">
              <Input value={f.examineeAge} onChange={s("examineeAge")} disabled={!isAdminEditA} />
            </FormField>
            <FormField label="Reason for Referring" required={isAdminEditA}>
              <Textarea value={f.reasonForReferring} onChange={s("reasonForReferring")} disabled={!isAdminEditA} rows={2} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormField label="Officer Name"><Input value={f.officerName} onChange={s("officerName")} disabled={!isAdminEditA} /></FormField>
              <FormField label="Rank"><Input value={f.officerRank} onChange={s("officerRank")} disabled={!isAdminEditA} /></FormField>
              <FormField label="Reg. No."><Input value={f.officerRegNo} onChange={s("officerRegNo")} disabled={!isAdminEditA} /></FormField>
              <FormField label="Police Station"><Input value={f.officerPoliceStation} onChange={s("officerPoliceStation")} disabled={!isAdminEditA} /></FormField>
            </div>
            {hasPartA && <p className="text-xs text-slate-400 mt-1">Filled by {f.partAFilledBy} on {new Date(f.partAFilledAt).toLocaleString("en-GB")}</p>}
          </FormSection>
        </div>

        {/* PART B */}
        <div>
          <FormSection title="Part B — Medical Officer Section (9–22)" badge={<Badge status={hasPartB ? "complete" : "draft"} />}>
            {!isDoctorEditB && <ReadOnlyBanner text="This section is filled by Medical Officers. View only." />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormField label="Hospital"><Input value={f.hospital} onChange={s("hospital")} disabled={!isDoctorEditB} /></FormField>
              <FormField label="Ward"><Input value={f.ward} onChange={s("ward")} disabled={!isDoctorEditB} /></FormField>
              <FormField label="BHT No."><Input value={f.bhtNo} onChange={s("bhtNo")} disabled={!isDoctorEditB} /></FormField>
              <FormField label="Date of Admission"><Input type="date" value={f.admissionDate} onChange={s("admissionDate")} disabled={!isDoctorEditB} /></FormField>
              <FormField label="Date & Time of Exam"><Input type="datetime-local" value={f.examDateTime} onChange={s("examDateTime")} disabled={!isDoctorEditB} /></FormField>
              <FormField label="Date of Discharge"><Input type="date" value={f.dischargeDate} onChange={s("dischargeDate")} disabled={!isDoctorEditB} /></FormField>
              <FormField label="Place of Examination" colSpan="full"><Input value={f.examPlace} onChange={s("examPlace")} disabled={!isDoctorEditB} /></FormField>
            </div>

            <FormField label="13. Nature of Body Harm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                {BODY_HARM_OPTIONS.map(o => (
                  <CheckGroup key={o.value} label={o.label}
                    checked={f.bodyHarmTypes.includes(o.value)}
                    onChange={() => isDoctorEditB && toggleArr("bodyHarmTypes", o.value)}
                    disabled={!isDoctorEditB} />
                ))}
              </div>
            </FormField>
            <FormField label="Internal Injuries">
              <Input value={f.internalInjuries} onChange={s("internalInjuries")} disabled={!isDoctorEditB} />
            </FormField>

            <FormField label="14. Nature of Causative Weapon">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                {WEAPON_OPTIONS.map(o => (
                  <CheckGroup key={o.value} label={o.label}
                    checked={f.causativeWeapon.includes(o.value)}
                    onChange={() => isDoctorEditB && toggleArr("causativeWeapon", o.value)}
                    disabled={!isDoctorEditB} />
                ))}
              </div>
              {f.causativeWeapon.includes("others") && (
                <div className="mt-2">
                  <FormField label="Others — please specify">
                    <Input
                      value={f.causativeWeaponOther}
                      onChange={s("causativeWeaponOther")}
                      disabled={!isDoctorEditB}
                      placeholder="Describe other causative weapon..."
                    />
                  </FormField>
                </div>
              )}
            </FormField>

            <FormField label="15. Category of Hurt">
              <RadioGroup name="hurtCategory" value={f.hurtCategory}
                options={[{ value: "non-grievous", label: "Non-grievous" }, { value: "grievous", label: "Grievous" }, { value: "fatal", label: "Fatal" }]}
                onChange={isDoctorEditB ? s("hurtCategory") : undefined} disabled={!isDoctorEditB} />
            </FormField>
            <FormField label="Endangers Life?">
              <RadioGroup name="endangersLife" value={f.endangersLife}
                options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "na", label: "N/A" }]}
                onChange={isDoctorEditB ? s("endangersLife") : undefined} disabled={!isDoctorEditB} />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormField label="16. Alcohol Exam">
                <Select value={f.alcoholExam} onChange={isDoctorEditB ? s("alcoholExam") : undefined} disabled={!isDoctorEditB}
                  placeholder="Select..." options={[{ value: "negative", label: "Negative" }, { value: "smell", label: "Smell" }, { value: "under_influence", label: "Under Influence" }]} />
              </FormField>
              <FormField label="17. Drugs Exam">
                <Select value={f.drugsExam} onChange={isDoctorEditB ? s("drugsExam") : undefined} disabled={!isDoctorEditB}
                  placeholder="Select..." options={[{ value: "negative", label: "Negative" }, { value: "positive", label: "Positive" }, { value: "under_influence", label: "Under Influence" }]} />
              </FormField>
            </div>

            <FormField label="18. Sexual Assault Examination">
              <div className="space-y-1 mt-1">
                {SEXUAL_ASSAULT_OPTIONS.map(o => (
                  <CheckGroup key={o.value} label={o.label}
                    checked={f.sexualAssaultSigns.includes(o.value)}
                    onChange={() => isDoctorEditB && toggleArr("sexualAssaultSigns", o.value)}
                    disabled={!isDoctorEditB} />
                ))}
              </div>
            </FormField>

            <FormField label="Brief History"><Textarea value={f.briefHistory} onChange={s("briefHistory")} disabled={!isDoctorEditB} rows={3} /></FormField>
            <FormField label="19. Findings of Examination"><Textarea value={f.examFindings} onChange={s("examFindings")} disabled={!isDoctorEditB} rows={3} /></FormField>
            <FormField label="20. Investigations"><Textarea value={f.investigations} onChange={s("investigations")} disabled={!isDoctorEditB} rows={2} /></FormField>
            <FormField label="21. Referrals"><Input value={f.referrals} onChange={s("referrals")} disabled={!isDoctorEditB} /></FormField>
            <FormField label="Other Opinions"><Textarea value={f.otherOpinions} onChange={s("otherOpinions")} disabled={!isDoctorEditB} rows={2} /></FormField>
            <FormField label="22. Remarks"><Textarea value={f.remarks} onChange={s("remarks")} disabled={!isDoctorEditB} rows={2} /></FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormField label="Doctor Name"><Input value={f.doctorName} onChange={s("doctorName")} disabled={!isDoctorEditB} placeholder={currentUser.name} /></FormField>
              <FormField label="Qualifications"><Input value={f.doctorQualifications} onChange={s("doctorQualifications")} disabled={!isDoctorEditB} /></FormField>
              <FormField label="SLMC Reg. No."><Input value={f.slmcRegNo} onChange={s("slmcRegNo")} disabled={!isDoctorEditB} /></FormField>
              <FormField label="Designation"><Input value={f.doctorDesignation} onChange={s("doctorDesignation")} disabled={!isDoctorEditB} /></FormField>
              <FormField label="Ref. No."><Input value={f.refNo} onChange={s("refNo")} disabled={!isDoctorEditB} /></FormField>
            </div>
            {hasPartB && <p className="text-xs text-slate-400 mt-1">Filled on {new Date(f.partBFilledAt).toLocaleString("en-GB")}</p>}
          </FormSection>
        </div>
      </div>
    </div>
  );
}
