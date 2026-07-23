import { useState, useEffect } from "react";
import { Save, FlaskConical, Plus, X, Eye, ChevronDown, Download } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { FormSection } from "@/components/ui/FormSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { PdfUpload } from "@/components/ui/PdfUpload";
import { genId, cls } from "@/lib/utils";
import { downloadMlrPdf } from "@/lib/pdf";
import { toast } from "sonner";
import type { MLRReport, InjuryEntry, GrievousEntry, Patient, AppUser, LabRequest } from "@/types";

interface Props {
  form: MLRReport | null;
  patient: Patient | null;
  patients: Patient[];
  currentUser: AppUser;
  labRequest: LabRequest | null;
  readOnly?: boolean;
  onSave: (r: MLRReport) => Promise<void>;
  onBack: () => void;
  onRequestLab: (patientId: string, formId: string, formType: string) => void;
}

// ── Multi-select for injury numbers ─────────────────────────────────────────
function InjuryMultiSelect({ selected, options, onChange, disabled }: {
  selected: string[];
  options: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (no: string) => {
    onChange(selected.includes(no) ? selected.filter(x => x !== no) : [...selected, no]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={cls(
          "w-full flex items-center justify-between border rounded px-3 py-1.5 text-sm text-left transition-colors",
          disabled
            ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
            : "bg-white border-slate-300 hover:border-slate-400 focus:outline-none focus:border-primary"
        )}
      >
        <span className={selected.length === 0 ? "text-slate-400" : "text-slate-900"}>
          {selected.length === 0
            ? "Select injury number(s)…"
            : selected.map(n => `Injury ${n}`).join(", ")
          }
        </span>
        <ChevronDown size={14} className="text-slate-400 flex-shrink-0 ml-2" />
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {options.length === 0
              ? <p className="px-3 py-3 text-xs text-slate-400 italic">No injuries added in Section C yet.</p>
              : options.map(no => (
                <label key={no}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(no)}
                    onChange={() => toggle(no)}
                    className="rounded border-slate-300 text-primary focus:ring-primary/30"
                  />
                  <span className="text-slate-700">Injury {no}</span>
                </label>
              ))
            }
          </div>
        </>
      )}
    </div>
  );
}

export function MLRForm({ form: initForm, patient, patients, currentUser, labRequest, readOnly = false, onSave, onBack, onRequestLab }: Props) {
  const isNew = !initForm;
  const now = new Date().toISOString();
  const [isSaving, setIsSaving] = useState(false);

  const [f, setF] = useState<MLRReport>(initForm ?? {
    id: genId("MLR"), patientId: patient?.id ?? "",
    injuries: [{ id: "1", no: "1", description: "" }],
    specialInvestigations: "",
    nonGrievousNos: [],
    grievousEntries: [],
    deathCausingCount: "",
    bluntWeaponNos: "", bluntContusionNos: "", cutNos: "", sharpCuttingNos: "",
    stabNos: "", firearmsNos: "", burnsNos: "", biteNos: "",
    furtherNotes: "", patientSmellLiquor: "", underInfluenceLiquor: "",
    doctorName: currentUser.name, doctorQualifications: "", designation: currentUser.designation,
    station: "", dateOfDespatch: "",
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

  const s = (k: keyof MLRReport) => (v: string) => setF(prev => ({ ...prev, [k]: v }));

  // Injury table helpers
  const addInjury = () => {
    const newId = String(f.injuries.length + 1);
    setF(prev => ({ ...prev, injuries: [...prev.injuries, { id: newId, no: newId, description: "" }] }));
  };
  const updateInjury = (id: string, field: keyof InjuryEntry, val: string) =>
    setF(prev => ({ ...prev, injuries: prev.injuries.map(inj => inj.id === id ? { ...inj, [field]: val } : inj) }));
  const removeInjury = (id: string) =>
    setF(prev => ({ ...prev, injuries: prev.injuries.filter(inj => inj.id !== id) }));

  // Grievous entry helpers
  const addGrievousEntry = () => {
    const entry: GrievousEntry = { id: genId("GE"), injuryNo: "", limb: "", remarks: "" };
    setF(prev => ({ ...prev, grievousEntries: [...prev.grievousEntries, entry] }));
  };
  const updateGrievousEntry = (id: string, field: keyof GrievousEntry, val: string) =>
    setF(prev => ({
      ...prev,
      grievousEntries: prev.grievousEntries.map(e => e.id === id ? { ...e, [field]: val } : e),
    }));
  const removeGrievousEntry = (id: string) =>
    setF(prev => ({ ...prev, grievousEntries: prev.grievousEntries.filter(e => e.id !== id) }));

  // Injury numbers available from Section C
  const injuryNos = f.injuries.map(inj => inj.no).filter(n => n.trim() !== "");
  const selectedPatient = patient ?? patients.find(p => p.id === f.patientId) ?? null;

  const handleDownloadUploadedDocs = () => {
    const pdf = f.pdfUrl || (f as any).pdf_url;

    if (!pdf) {
      toast.info("No uploaded document available for this MLR report yet.");
      return;
    }

    downloadFileFromUrl(pdf, `${f.id}_Uploaded_Copy.pdf`);
    toast.success("Downloading uploaded document…");
  };

  const handleSave = async () => {
    if (!f.patientId) {
      toast.error("Select a patient before saving the MLR report.");
      return;
    }

    const incompleteInjury = f.injuries.find(injury =>
      !injury.no?.trim() || !injury.description?.trim()
    );

    if (incompleteInjury) {
      toast.error("Each injury row must include both an injury number and description.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ ...f, pdfUrl: f.pdfUrl || (f as any).pdf_url || "", status: "submitted" });
    } catch {
      // saveMlrReport already reports the API error. Keep the form open for correction.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isNew ? "New MLR Report" : `MLR — ${f.id}`}
        subtitle={selectedPatient ? `Patient: ${selectedPatient.name} · ${selectedPatient.id}` : undefined}
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
                    await downloadMlrPdf(f, selectedPatient, currentUser.name);
                    toast.success("Generated report PDF downloaded.");
                  } catch (err) {
                    console.error("Failed to generate MLR PDF:", err);
                    toast.error("Failed to generate PDF.");
                  }
                }}>
                Generate Report PDF
              </Btn>
            )}
            {!readOnly && !f.labRequestId && (
              <Btn variant="secondary" size="sm" icon={<FlaskConical size={13} />}
                onClick={() => onRequestLab(f.patientId, f.id, "mlr")}>
                Request Lab Report
              </Btn>
            )}
            {!readOnly && (
              <Btn variant="primary" icon={<Save size={14} />}
                disabled={isSaving}
                onClick={handleSave}>
                {isSaving ? "Saving..." : "Save Report"}
              </Btn>
            )}
          </div>
        }
      />

      {readOnly && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          <Eye size={13} /> This report is read-only. Only JMO can edit it.
        </div>
      )}

      {f.labRequestId && labRequest && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          <FlaskConical size={15} /> Lab Report Requested · <Badge status={labRequest.status} />
        </div>
      )}

      <div className="max-w-4xl space-y-0">
        {/* Patient info */}
        {isNew && !patient && (
          <FormSection title="Patient Information">
            <FormField label="Patient">
              <Select
                value={f.patientId}
                onChange={patientId => setF(prev => ({ ...prev, patientId }))}
                disabled={readOnly}
                placeholder="Select a patient…"
                options={patients.map(p => ({ value: p.id, label: `${p.name} (${p.id})` }))}
              />
            </FormField>
          </FormSection>
        )}

        {selectedPatient && (
          <FormSection title="Patient Information">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div><span className="text-slate-500">Name:</span> <span className="font-medium">{selectedPatient.name}</span></div>
              <div><span className="text-slate-500">ID:</span> <span className="font-medium">{selectedPatient.id}</span></div>
              <div><span className="text-slate-500">NIC:</span> <span className="font-medium">{selectedPatient.nic}</span></div>
              <div><span className="text-slate-500">Age/Sex:</span> <span className="font-medium">{selectedPatient.age} yrs / {selectedPatient.sex}</span></div>
              <div className="col-span-1 sm:col-span-2"><span className="text-slate-500">Address:</span> <span className="font-medium">{selectedPatient.address}</span></div>
            </div>
          </FormSection>
        )}

        {/* C. Injuries table */}
        <FormSection title="C. Injuries — Nature, Size, Shape, Disposition and Site">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 w-16">No.</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">Nature, size, shape, disposition and site of injury</th>
                  <th className="border border-slate-200 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {f.injuries.map(inj => (
                  <tr key={inj.id}>
                    <td className="border border-slate-200 px-2 py-1">
                      <Input value={inj.no} onChange={v => updateInjury(inj.id, "no", v)} disabled={readOnly} className="text-center" />
                    </td>
                    <td className="border border-slate-200 px-2 py-1">
                      <Input value={inj.description} onChange={v => updateInjury(inj.id, "description", v)} disabled={readOnly} placeholder="Describe injury…" />
                    </td>
                    <td className="border border-slate-200 px-2 py-1 text-center">
                      {!readOnly && (
                        <button onClick={() => removeInjury(inj.id)} className="text-slate-400 hover:text-red-500 transition-colors">
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
            <button onClick={addInjury} className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-blue-800 transition-colors">
              <Plus size={13} /> Add Injury Row
            </button>
          )}
          <div className="mt-3">
            <FormField label="Special Investigations (X-Ray, etc.)">
              <Textarea value={f.specialInvestigations} onChange={s("specialInvestigations")} disabled={readOnly} rows={2} />
            </FormField>
          </div>
        </FormSection>

        {/* D. Opinion */}
        <FormSection title="D. Opinion">

          {/* 1. Non-grievous */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              1. Non-grievous Injuries — Select Injury Numbers
            </label>
            <InjuryMultiSelect
              selected={f.nonGrievousNos}
              options={injuryNos}
              onChange={nos => setF(prev => ({ ...prev, nonGrievousNos: nos }))}
              disabled={readOnly}
            />
            {f.nonGrievousNos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {f.nonGrievousNos.map(no => (
                  <span key={no} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full">
                    Injury {no}
                    {!readOnly && (
                      <button onClick={() => setF(prev => ({ ...prev, nonGrievousNos: prev.nonGrievousNos.filter(n => n !== no) }))}
                        className="hover:text-red-500 transition-colors ml-0.5">
                        <X size={10} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 2. Grievous */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">
              2. Grievous Injuries
            </div>
            {f.grievousEntries.length === 0 && (
              <p className="text-xs text-slate-400 italic mb-3">No grievous injury entries yet.</p>
            )}
            <div className="space-y-3">
              {f.grievousEntries.map((entry, idx) => (
                <div key={entry.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">Entry {idx + 1}</span>
                    {!readOnly && (
                      <button onClick={() => removeGrievousEntry(entry.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <FormField label="Injury No.">
                      <Select
                        value={entry.injuryNo}
                        onChange={v => updateGrievousEntry(entry.id, "injuryNo", v)}
                        disabled={readOnly}
                        placeholder="Select injury no…"
                        options={injuryNos.map(no => ({ value: no, label: `Injury ${no}` }))}
                      />
                    </FormField>
                    <FormField label="Limb under Sec. 311 Penal Code">
                      <Input
                        value={entry.limb}
                        onChange={v => updateGrievousEntry(entry.id, "limb", v)}
                        disabled={readOnly}
                        placeholder="e.g. Right forearm"
                      />
                    </FormField>
                    <FormField label="Explanatory Remarks" colSpan="full">
                      <Textarea
                        value={entry.remarks}
                        onChange={v => updateGrievousEntry(entry.id, "remarks", v)}
                        disabled={readOnly}
                        rows={2}
                        placeholder="Explain nature and extent of grievous injury…"
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
            {!readOnly && (
              <button onClick={addGrievousEntry}
                className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-blue-800 transition-colors">
                <Plus size={13} /> Add Grievous Injury Entry
              </button>
            )}
          </div>

          {/* 3. Death-causing */}
          <FormField label="3. Injuries Sufficient in Ordinary Course of Nature to Cause Death (Nos.)">
            <Input value={f.deathCausingCount} onChange={s("deathCausingCount")} disabled={readOnly} />
          </FormField>
        </FormSection>

        {/* 4. Caused by */}
        <FormSection title="4. Injuries Caused By">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-2">(a) Blunt Weapon</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <FormField label="Nos."><Input value={f.bluntWeaponNos} onChange={s("bluntWeaponNos")} disabled={readOnly} /></FormField>
                <FormField label="Contusions (Nos.)"><Input value={f.bluntContusionNos} onChange={s("bluntContusionNos")} disabled={readOnly} /></FormField>
              </div>
            </div>
            <FormField label="Cut — Nos."><Input value={f.cutNos} onChange={s("cutNos")} disabled={readOnly} /></FormField>
            <FormField label="(b) Sharp Cutting Instrument — Nos."><Input value={f.sharpCuttingNos} onChange={s("sharpCuttingNos")} disabled={readOnly} /></FormField>
            <FormField label="(b) Stab — Nos."><Input value={f.stabNos} onChange={s("stabNos")} disabled={readOnly} /></FormField>
            <FormField label="(c) Firearms — Nos."><Input value={f.firearmsNos} onChange={s("firearmsNos")} disabled={readOnly} /></FormField>
            <FormField label="(d) Burns — Nos."><Input value={f.burnsNos} onChange={s("burnsNos")} disabled={readOnly} /></FormField>
            <FormField label="(e) Bite Marks — Nos."><Input value={f.biteNos} onChange={s("biteNos")} disabled={readOnly} /></FormField>
          </div>
          <FormField label="Further Notes">
            <Textarea value={f.furtherNotes} onChange={s("furtherNotes")} disabled={readOnly} rows={3} />
          </FormField>
        </FormSection>

        {/* 5. Intoxication */}
        <FormSection title="5. Intoxication">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField label="Patient Smelling of Liquor">
              <Select value={f.patientSmellLiquor} onChange={s("patientSmellLiquor")} disabled={readOnly} placeholder="Select…"
                options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
            </FormField>
            <FormField label="Under Influence of Liquor">
              <Select value={f.underInfluenceLiquor} onChange={s("underInfluenceLiquor")} disabled={readOnly} placeholder="Select…"
                options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
            </FormField>
          </div>
        </FormSection>

        {/* Medical officer details */}
        <FormSection title="Medical Officer Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField label="Name"><Input value={f.doctorName} onChange={s("doctorName")} disabled={readOnly} /></FormField>
            <FormField label="Qualifications"><Input value={f.doctorQualifications} onChange={s("doctorQualifications")} disabled={readOnly} /></FormField>
            <FormField label="Designation"><Input value={f.designation} onChange={s("designation")} disabled={readOnly} /></FormField>
            <FormField label="Station"><Input value={f.station} onChange={s("station")} disabled={readOnly} /></FormField>
            <FormField label="Date of Despatch"><Input type="date" value={f.dateOfDespatch} onChange={s("dateOfDespatch")} disabled={readOnly} /></FormField>
          </div>
          <PdfUpload
            label="Upload MLR Report PDF Copy"
            formType="mlr"
            pdfUrl={f.pdfUrl || (f as any).pdf_url}
            disabled={readOnly}
            onUploadComplete={url => {
              setF(prev => ({ ...prev, pdfUrl: url, pdf_url: url }));
              toast.success("MLR Report PDF attached! Click 'Save' to persist to database.");
            }}
            onRemove={() => setF(prev => ({ ...prev, pdfUrl: "", pdf_url: "" }))}
          />
        </FormSection>
      </div>
    </div>
  );
}
