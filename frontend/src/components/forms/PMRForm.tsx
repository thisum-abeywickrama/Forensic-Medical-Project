import { useState, useEffect } from "react";
import { Save, FlaskConical, Eye, Plus, X, Download } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { FormSection } from "@/components/ui/FormSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { PdfUpload } from "@/components/ui/PdfUpload";
import { genId, downloadFileFromUrl } from "@/lib/utils";
import { downloadPmrPdf } from "@/lib/pdf";
import { toast } from "sonner";
import type { PMRForm as PMRFormType, Patient, AppUser, LabRequest, BodyIdentifier } from "@/types";

interface Props {
  form: PMRFormType | null;
  patient: Patient | null;
  allPatients: Patient[];
  currentUser: AppUser;
  labRequest: LabRequest | null;
  readOnly?: boolean;
  onSave: (f: PMRFormType) => void;
  onBack: () => void;
  onRequestLab: (patientId: string, formId: string, formType: string, onLink: (labReqId: string) => void) => void;
}

export function PMRForm({ form: initForm, patient: initPatient, allPatients, currentUser, labRequest, readOnly = false, onSave, onBack, onRequestLab }: Props) {
  const isNew = !initForm;
  const now = new Date().toISOString();

  const [selectedPatientId, setSelectedPatientId] = useState(initPatient?.id ?? initForm?.patientId ?? "");
  const patient = allPatients?.find(p => p.id === selectedPatientId) ?? initPatient;

  const [f, setF] = useState<PMRFormType>(initForm ?? {
    id: genId("PMR"), patientId: patient?.id ?? "",
    inquestNo: "", place: "", courts: "", date: new Date().toISOString().slice(0, 10), caseNo: "",
    deceasedName: patient?.name ?? "",
    dateTimeOfDeath: "",
    doctorConducting: currentUser.name,
    dateTimeOfExam: "",
    requestorName: "",
    requestorDesignation: "",
    district: "",
    placeOfExam: "",
    identifiers: [{ id: "1", name: "", address: "" }],
    jmoName: currentUser.role === "jmo" ? currentUser.name : "",
    labRequestId: "", status: "draft", createdAt: now, createdBy: currentUser.id,
  });

  useEffect(() => {
    if (initForm) {
      setF({
        ...initForm,
        pdfUrl: initForm.pdfUrl || (initForm as any).pdf_url || "",
      });
    }
  }, [initForm]);

  const handleSelectPatient = (pId: string) => {
    setSelectedPatientId(pId);
    const p = allPatients.find(x => x.id === pId);
    if (p) {
      setF(prev => ({ ...prev, patientId: p.id, deceasedName: p.name }));
    }
  };

  const s = (k: keyof PMRFormType) => (v: string) => setF(prev => ({ ...prev, [k]: v }));

  const addIdentifier = () => {
    const newId = String(f.identifiers.length + 1);
    setF(prev => ({ ...prev, identifiers: [...prev.identifiers, { id: newId, name: "", address: "" }] }));
  };

  const updateIdentifier = (id: string, field: keyof BodyIdentifier, val: string) => {
    setF(prev => ({
      ...prev,
      identifiers: prev.identifiers.map(item => item.id === id ? { ...item, [field]: val } : item),
    }));
  };

  const removeIdentifier = (id: string) => {
    setF(prev => ({
      ...prev,
      identifiers: prev.identifiers.filter(item => item.id !== id),
    }));
  };

  const handleDownloadUploadedDocs = () => {
    const pdf = f.pdfUrl || (f as any).pdf_url;

    if (!pdf) {
      toast.info("No uploaded document available for this PMR report yet.");
      return;
    }

    downloadFileFromUrl(pdf, `${f.id}_Uploaded_Copy.pdf`);
    toast.success("Downloading uploaded document…");
  };

  return (
    <div>
      <PageHeader
        title={isNew ? "New PMR Form" : `Post-Mortem Report — ${f.id}`}
        subtitle={patient ? `Patient: ${patient.name} · ${patient.id}` : undefined}
        onBack={onBack}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" icon={<Download size={13} />} onClick={handleDownloadUploadedDocs}>
              Download Documents
            </Btn>
            {!isNew && (
              <Btn variant="secondary" size="sm" icon={<Download size={13} />}
                onClick={async () => {
                  try {
                    await downloadPmrPdf(f, patient, currentUser.name);
                    toast.success("Generated report PDF downloaded.");
                  } catch (err) {
                    console.error("Failed to generate PMR PDF:", err);
                    toast.error("Failed to generate PDF.");
                  }
                }}>
                Generate Report PDF
              </Btn>
            )}
            {!readOnly && !f.labRequestId && (
              <Btn variant="secondary" size="sm" icon={<FlaskConical size={13} />}
                disabled={!f.patientId}
                onClick={() => onRequestLab(f.patientId, f.id, "pmr", (labReqId) => setF(prev => ({ ...prev, labRequestId: labReqId })))}>
                Request Lab Report
              </Btn>
            )}
            {!readOnly && (
              <Btn variant="primary" icon={<Save size={14} />}
                disabled={!f.patientId}
                onClick={() => { onSave({ ...f, pdfUrl: f.pdfUrl || (f as any).pdf_url || "", status: "submitted" }); onBack(); }}>
                Save PMR Report
              </Btn>
            )}
          </div>
        }
      />

      {readOnly && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          <Eye size={13} /> This form is read-only. Only JMO users can create or edit PMR forms.
        </div>
      )}

      {f.labRequestId && labRequest && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          <FlaskConical size={15} /> Lab Requested · Status: <Badge status={labRequest.status} />
        </div>
      )}

      {isNew && !initPatient && allPatients && (
        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-3xl">
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
            Select Deceased Patient <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedPatientId}
            onChange={handleSelectPatient}
            placeholder="— Choose a patient —"
            options={allPatients.map(p => ({ value: p.id, label: `${p.name} (${p.id}) · NIC: ${p.nic}` }))}
          />
        </div>
      )}

      <div className="max-w-3xl space-y-0">
        <FormSection title="Case & Inquest Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField label="INQUEST No."><Input value={f.inquestNo} onChange={s("inquestNo")} disabled={readOnly} placeholder="e.g. INQ/2026/89" /></FormField>
            <FormField label="CASE No."><Input value={f.caseNo} onChange={s("caseNo")} disabled={readOnly} placeholder="e.g. CR/556/26" /></FormField>
            <FormField label="Place of Inquest"><Input value={f.place} onChange={s("place")} disabled={readOnly} /></FormField>
            <FormField label="Courts"><Input value={f.courts} onChange={s("courts")} disabled={readOnly} placeholder="e.g. Magistrate Court Colombo" /></FormField>
            <FormField label="Date of Inquest/Request"><Input type="date" value={f.date} onChange={s("date")} disabled={readOnly} /></FormField>
          </div>
        </FormSection>

        <FormSection title="Deceased Particulars">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField label="Name of Deceased Person"><Input value={f.deceasedName} onChange={s("deceasedName")} disabled={readOnly} /></FormField>
            <FormField label="Date & Time of Death (if known)"><Input type="datetime-local" value={f.dateTimeOfDeath} onChange={s("dateTimeOfDeath")} disabled={readOnly} /></FormField>
          </div>
        </FormSection>

        <FormSection title="Post-Mortem Examination Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField label="Medical Officer conducting Post-Mortem"><Input value={f.doctorConducting} onChange={s("doctorConducting")} disabled={readOnly} /></FormField>
            <FormField label="Date & Time of Post-Mortem"><Input type="datetime-local" value={f.dateTimeOfExam} onChange={s("dateTimeOfExam")} disabled={readOnly} /></FormField>
            <FormField label="Place of Examination"><Input value={f.placeOfExam} onChange={s("placeOfExam")} disabled={readOnly} /></FormField>
            <FormField label="District"><Input value={f.district} onChange={s("district")} disabled={readOnly} /></FormField>
          </div>
        </FormSection>

        <FormSection title="Requestor Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField label="Name of Requestor"><Input value={f.requestorName} onChange={s("requestorName")} disabled={readOnly} /></FormField>
            <FormField label="Designation of Requestor"><Input value={f.requestorDesignation} onChange={s("requestorDesignation")} disabled={readOnly} /></FormField>
          </div>
        </FormSection>

        <FormSection title="Body Identification Details (Persons who identified the body)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">Person's Name</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">Address</th>
                  <th className="border border-slate-200 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {f.identifiers.map(item => (
                  <tr key={item.id}>
                    <td className="border border-slate-200 p-1">
                      <Input value={item.name} onChange={v => updateIdentifier(item.id, "name", v)} disabled={readOnly} placeholder="Name" />
                    </td>
                    <td className="border border-slate-200 p-1">
                      <Input value={item.address} onChange={v => updateIdentifier(item.id, "address", v)} disabled={readOnly} placeholder="Address" />
                    </td>
                    <td className="border border-slate-200 px-2 py-1 text-center">
                      {!readOnly && f.identifiers.length > 1 && (
                        <button onClick={() => removeIdentifier(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!readOnly && (
            <button onClick={addIdentifier} className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-blue-800 transition-colors">
              <Plus size={13} /> Add Person
            </button>
          )}
        </FormSection>

        <FormSection title="Conducting Judicial Medical Officer">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField label="JMO Conducting Name"><Input value={f.jmoName} disabled={true} className="bg-slate-50 border-slate-200 text-slate-500 font-semibold" /></FormField>
          </div>
          <PdfUpload
            label="Upload PMR Form PDF Copy"
            formType="pmr"
            pdfUrl={f.pdfUrl || (f as any).pdf_url}
            disabled={readOnly}
            onUploadComplete={url => {
              setF(prev => ({ ...prev, pdfUrl: url, pdf_url: url }));
              toast.success("PMR Form PDF attached! Click 'Save' to persist to database.");
            }}
            onRemove={() => setF(prev => ({ ...prev, pdfUrl: "", pdf_url: "" }))}
          />
        </FormSection>
      </div>
    </div>
  );
}
