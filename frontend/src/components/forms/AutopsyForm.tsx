import { useEffect, useState } from "react";
import { Download, Eye, FlaskConical, Plus, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { CheckGroup } from "@/components/ui/CheckGroup";
import { FormField } from "@/components/ui/FormField";
import { FormSection } from "@/components/ui/FormSection";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { downloadAutopsyPdf } from "@/lib/pdf";
import { genId } from "@/lib/utils";
import { toast } from "sonner";
import type { AppUser, ArticleSecured, AutopsyForm as AutopsyFormType, LabRequest, Patient } from "@/types";

interface Props {
  form: AutopsyFormType | null;
  patient: Patient | null;
  allPatients: Patient[];
  currentUser: AppUser;
  labRequest: LabRequest | null;
  readOnly?: boolean;
  onSave: (form: AutopsyFormType) => Promise<void>;
  onBack: () => void;
  onRequestLab: (patientId: string, formId: string, formType: string, onLink: (labReqId: string) => void) => void;
}

export function AutopsyForm({ form: initForm, patient: initPatient, allPatients, currentUser, labRequest, readOnly = false, onSave, onBack, onRequestLab }: Props) {
  const isNew = !initForm;
  const now = new Date().toISOString();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(initPatient?.id ?? initForm?.patientId ?? "");
  const patient = allPatients.find(p => p.id === selectedPatientId) ?? initPatient;
  const [f, setF] = useState<AutopsyFormType>(initForm ?? {
    id: genId("AUTOPSY"), patientId: patient?.id ?? "", pmRegisterSerialNo: "", date: new Date().toISOString().slice(0, 10), verdict: "",
    locusExamination: "", externalExamination: "", injuries: "", injuriesOnContinuationSheet: false,
    height: "", estimatedAge: "", sex: "", eyesAndPupils: "", hair: "", tongue: "", teeth: "",
    bodyTemperature: "", primaryFlaccidity: "", rigorMortis: "", hypostasis: "", putrefaction: "",
    noseMouthEars: "", urinaryAndSexual: "", anal: "", handsAndNails: "", neck: "",
    headSoftParts: "", skullBones: "", brainMembranesSinuses: "", brainSubstanceVentricles: "", brainBloodVessels: "", spinalCord: "",
    thoraxBones: "", chestCavity: "", pericardium: "", heart: "", coronaryVessels: "", largeBloodVessels: "", larynxTracheaBronchi: "", pleuraAndLungs: "", gullet: "",
    abdomenContents: "", peritoneum: "", diaphragm: "", liverAndGallBladder: "", spleen: "", stomach: "", smallIntestines: "", largeIntestines: "", pancreas: "", kidneys: "", suprarenalGlands: "",
    bladderAndProstate: "", generativeOrgans: "", pelvicBloodVessels: "", pelvicBones: "", causeOfDeath: "", articlesSecured: [],
    moName: currentUser.role === "jmo" ? currentUser.name : "", moQualifications: "", moDesignation: currentUser.designation,
    labRequestId: "", status: "draft", createdAt: now, createdBy: currentUser.id,
  });

  useEffect(() => {
    if (initForm) setF(initForm);
  }, [initForm]);

  const s = (key: keyof AutopsyFormType) => (value: string) => setF(prev => ({ ...prev, [key]: value }));
  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setF(prev => ({ ...prev, patientId }));
  };
  const addArticle = () => setF(prev => ({ ...prev, articlesSecured: [...prev.articlesSecured, { id: String(prev.articlesSecured.length + 1), description: "", purpose: "" }] }));
  const updateArticle = (id: string, key: keyof ArticleSecured, value: string) => setF(prev => ({ ...prev, articlesSecured: prev.articlesSecured.map(article => article.id === id ? { ...article, [key]: value } : article) }));
  const removeArticle = (id: string) => setF(prev => ({ ...prev, articlesSecured: prev.articlesSecured.filter(article => article.id !== id) }));
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ ...f, status: "submitted" });
    } catch {
      // The context displays the API error and leaves this form open for correction.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isNew ? "New Autopsy Form" : `Autopsy Form — ${f.id}`}
        subtitle={patient ? `Patient: ${patient.name} · ${patient.id}` : undefined}
        onBack={onBack}
        actions={<div className="flex gap-2">
          {!isNew && <Btn variant="secondary" size="sm" icon={<Download size={13} />} onClick={async () => {
            try { await downloadAutopsyPdf(f, patient, currentUser.name); toast.success("Generated autopsy PDF downloaded."); }
            catch (err) { console.error("Failed to generate autopsy PDF:", err); toast.error("Failed to generate PDF."); }
          }}>Generate Report PDF</Btn>}
          {!readOnly && !f.labRequestId && <Btn variant="secondary" size="sm" icon={<FlaskConical size={13} />} disabled={!f.patientId} onClick={() => onRequestLab(f.patientId, f.id, "autopsy", labReqId => setF(prev => ({ ...prev, labRequestId: labReqId })))}>Request Lab Report</Btn>}
          {!readOnly && <Btn variant="primary" icon={<Save size={14} />} disabled={!f.patientId || isSaving} onClick={handleSave}>{isSaving ? "Saving..." : "Save Autopsy Form"}</Btn>}
        </div>}
      />

      {readOnly && <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700"><Eye size={13} /> This form is read-only. Only JMO users can create or edit autopsy forms.</div>}
      {f.labRequestId && labRequest && <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800"><FlaskConical size={15} /> Lab Requested · Status: <Badge status={labRequest.status} /></div>}

      {isNew && !initPatient && allPatients && <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-3xl">
        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Select Deceased Patient <span className="text-red-500">*</span></label>
        <Select value={selectedPatientId} onChange={handleSelectPatient} placeholder="— Choose a patient —" options={allPatients.map(p => ({ value: p.id, label: `${p.name} (${p.id}) · NIC: ${p.nic}` }))} />
      </div>}

      <div className="max-w-4xl space-y-0">
        <FormSection title="Post-Mortem Register" collapsible><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField label="PM Register Serial No."><Input value={f.pmRegisterSerialNo} onChange={s("pmRegisterSerialNo")} disabled={readOnly} /></FormField>
          <FormField label="Date"><Input type="date" value={f.date} onChange={s("date")} disabled={readOnly} /></FormField>
          <FormField label="Verdict"><Select value={f.verdict} onChange={s("verdict")} disabled={readOnly} placeholder="Select verdict…" options={["Natural", "Accidental", "Suicidal", "Homicidal", "Open/Undetermined"].map(value => ({ value, label: value }))} /></FormField>
        </div></FormSection>
        <FormSection title="Examination of the Locus" collapsible><FormField label="Site and Position of the Body"><Textarea value={f.locusExamination} onChange={s("locusExamination")} disabled={readOnly} rows={3} /></FormField></FormSection>
        <FormSection title="External Examination" collapsible><FormField label="Clothing, Nourishment, Colour, Marks and Products of Disease"><Textarea value={f.externalExamination} onChange={s("externalExamination")} disabled={readOnly} rows={4} /></FormField></FormSection>
        <FormSection title="Injuries" collapsible><FormField label="Injuries Inflicted Before or After Death"><Textarea value={f.injuries} onChange={s("injuries")} disabled={readOnly} rows={5} /></FormField><CheckGroup label="Recorded on continuation sheet (Health 1135A)" checked={f.injuriesOnContinuationSheet} onChange={value => setF(prev => ({ ...prev, injuriesOnContinuationSheet: value }))} disabled={readOnly} /></FormSection>
        <FormSection title="Identification & Measurements" collapsible><div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
          <FormField label="Height"><Input value={f.height} onChange={s("height")} disabled={readOnly} /></FormField><FormField label="Estimated Age"><Input value={f.estimatedAge} onChange={s("estimatedAge")} disabled={readOnly} /></FormField><FormField label="Sex"><Select value={f.sex} onChange={s("sex")} disabled={readOnly} placeholder="Select…" options={["Male", "Female", "Undetermined"].map(value => ({ value, label: value }))} /></FormField>
        </div></FormSection>
        <FormSection title="Head & Facial Features (External)" collapsible><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField label="Eyes and Pupils"><Textarea value={f.eyesAndPupils} onChange={s("eyesAndPupils")} disabled={readOnly} /></FormField><FormField label="Hair"><Textarea value={f.hair} onChange={s("hair")} disabled={readOnly} /></FormField><FormField label="Tongue"><Textarea value={f.tongue} onChange={s("tongue")} disabled={readOnly} /></FormField><FormField label="Teeth"><Textarea value={f.teeth} onChange={s("teeth")} disabled={readOnly} /></FormField>
        </div></FormSection>
        <FormSection title="Signs of Death" collapsible><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField label="Body Temperature"><Input value={f.bodyTemperature} onChange={s("bodyTemperature")} disabled={readOnly} placeholder="Record where necessary" /></FormField><FormField label="Primary Flaccidity"><Textarea value={f.primaryFlaccidity} onChange={s("primaryFlaccidity")} disabled={readOnly} /></FormField><FormField label="Rigor Mortis"><Textarea value={f.rigorMortis} onChange={s("rigorMortis")} disabled={readOnly} /></FormField><FormField label="Hypostasis"><Textarea value={f.hypostasis} onChange={s("hypostasis")} disabled={readOnly} /></FormField><FormField label="Putrefaction"><Textarea value={f.putrefaction} onChange={s("putrefaction")} disabled={readOnly} /></FormField>
        </div></FormSection>
        <FormSection title="Natural Openings" collapsible><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField label="Nose, Mouth and Ears"><Textarea value={f.noseMouthEars} onChange={s("noseMouthEars")} disabled={readOnly} placeholder="Foreign substances or poisons present" /></FormField><FormField label="Urinary and Sexual Organs"><Textarea value={f.urinaryAndSexual} onChange={s("urinaryAndSexual")} disabled={readOnly} placeholder="Signs of virginity or recent injury" /></FormField><FormField label="Anal Opening"><Textarea value={f.anal} onChange={s("anal")} disabled={readOnly} placeholder="Foreign substances or recent injury" /></FormField>
        </div></FormSection>
        <FormSection title="Hands & Nails" collapsible><FormField label="Hands and Nails"><Textarea value={f.handsAndNails} onChange={s("handsAndNails")} disabled={readOnly} /></FormField></FormSection>
        <FormSection title="Neck" collapsible><FormField label="Soft Tissues, Blood Vessels and Cervical Vertebrae"><Textarea value={f.neck} onChange={s("neck")} disabled={readOnly} placeholder="Pay special attention to signs of strangulation" /></FormField></FormSection>
        <FormSection title="Head (Internal Examination)" collapsible><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField label="Soft Parts"><Textarea value={f.headSoftParts} onChange={s("headSoftParts")} disabled={readOnly} /></FormField><FormField label="Skull Bones"><Textarea value={f.skullBones} onChange={s("skullBones")} disabled={readOnly} /></FormField><FormField label="Brain Membranes and Sinuses"><Textarea value={f.brainMembranesSinuses} onChange={s("brainMembranesSinuses")} disabled={readOnly} /></FormField><FormField label="Brain Substance and Ventricles"><Textarea value={f.brainSubstanceVentricles} onChange={s("brainSubstanceVentricles")} disabled={readOnly} /></FormField><FormField label="Brain Blood Vessels"><Textarea value={f.brainBloodVessels} onChange={s("brainBloodVessels")} disabled={readOnly} /></FormField>
        </div></FormSection>
        <FormSection title="Spinal Cord" collapsible><FormField label="Spinal Cord"><Textarea value={f.spinalCord} onChange={s("spinalCord")} disabled={readOnly} /></FormField></FormSection>
        <FormSection title="Thorax" collapsible><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField label="Thorax Bones"><Textarea value={f.thoraxBones} onChange={s("thoraxBones")} disabled={readOnly} /></FormField><FormField label="Chest Cavity"><Textarea value={f.chestCavity} onChange={s("chestCavity")} disabled={readOnly} /></FormField><FormField label="Pericardium"><Textarea value={f.pericardium} onChange={s("pericardium")} disabled={readOnly} /></FormField><FormField label="Heart"><Textarea value={f.heart} onChange={s("heart")} disabled={readOnly} /></FormField><FormField label="Coronary Vessels"><Textarea value={f.coronaryVessels} onChange={s("coronaryVessels")} disabled={readOnly} /></FormField><FormField label="Large Blood Vessels"><Textarea value={f.largeBloodVessels} onChange={s("largeBloodVessels")} disabled={readOnly} /></FormField><FormField label="Larynx, Trachea and Bronchi"><Textarea value={f.larynxTracheaBronchi} onChange={s("larynxTracheaBronchi")} disabled={readOnly} /></FormField><FormField label="Pleura and Lungs"><Textarea value={f.pleuraAndLungs} onChange={s("pleuraAndLungs")} disabled={readOnly} /></FormField><FormField label="Gullet"><Textarea value={f.gullet} onChange={s("gullet")} disabled={readOnly} /></FormField>
        </div></FormSection>
        <FormSection title="Abdomen" collapsible><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField label="Abdomen Contents"><Textarea value={f.abdomenContents} onChange={s("abdomenContents")} disabled={readOnly} /></FormField><FormField label="Peritoneum"><Textarea value={f.peritoneum} onChange={s("peritoneum")} disabled={readOnly} /></FormField><FormField label="Diaphragm"><Textarea value={f.diaphragm} onChange={s("diaphragm")} disabled={readOnly} /></FormField><FormField label="Liver and Gall Bladder"><Textarea value={f.liverAndGallBladder} onChange={s("liverAndGallBladder")} disabled={readOnly} /></FormField><FormField label="Spleen"><Textarea value={f.spleen} onChange={s("spleen")} disabled={readOnly} /></FormField><FormField label="Stomach"><Textarea value={f.stomach} onChange={s("stomach")} disabled={readOnly} /></FormField><FormField label="Duodenum, Jejunum, Ileum"><Textarea value={f.smallIntestines} onChange={s("smallIntestines")} disabled={readOnly} /></FormField><FormField label="Large Intestines"><Textarea value={f.largeIntestines} onChange={s("largeIntestines")} disabled={readOnly} /></FormField><FormField label="Pancreas"><Textarea value={f.pancreas} onChange={s("pancreas")} disabled={readOnly} /></FormField><FormField label="Kidneys"><Textarea value={f.kidneys} onChange={s("kidneys")} disabled={readOnly} /></FormField><FormField label="Suprarenal Glands"><Textarea value={f.suprarenalGlands} onChange={s("suprarenalGlands")} disabled={readOnly} /></FormField>
        </div></FormSection>
        <FormSection title="Pelvis" collapsible><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField label="Bladder and Prostate"><Textarea value={f.bladderAndProstate} onChange={s("bladderAndProstate")} disabled={readOnly} /></FormField><FormField label="Generative Organs"><Textarea value={f.generativeOrgans} onChange={s("generativeOrgans")} disabled={readOnly} /></FormField><FormField label="Pelvic Blood Vessels"><Textarea value={f.pelvicBloodVessels} onChange={s("pelvicBloodVessels")} disabled={readOnly} /></FormField><FormField label="Pelvic Bones"><Textarea value={f.pelvicBones} onChange={s("pelvicBones")} disabled={readOnly} /></FormField>
        </div></FormSection>
        <FormSection title="Cause of Death & Opinion" collapsible><FormField label="Cause of Death and Other Relevant Opinion"><Textarea value={f.causeOfDeath} onChange={s("causeOfDeath")} disabled={readOnly} rows={5} /></FormField></FormSection>
        <FormSection title="Articles Secured" collapsible><div className="overflow-x-auto"><table className="w-full text-sm border-collapse"><thead><tr className="bg-slate-50"><th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">Article / Specimen</th><th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">Sent To / Purpose For Analysis</th><th className="border border-slate-200 w-8"></th></tr></thead><tbody>{f.articlesSecured.map(article => <tr key={article.id}><td className="border border-slate-200 p-1"><Input value={article.description} onChange={value => updateArticle(article.id, "description", value)} disabled={readOnly} placeholder="Article or specimen" /></td><td className="border border-slate-200 p-1"><Input value={article.purpose} onChange={value => updateArticle(article.id, "purpose", value)} disabled={readOnly} placeholder="Purpose for analysis" /></td><td className="border border-slate-200 px-2 py-1 text-center">{!readOnly && <button onClick={() => removeArticle(article.id)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={14} /></button>}</td></tr>)}</tbody></table></div>{!readOnly && <button onClick={addArticle} className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-blue-800 transition-colors"><Plus size={13} /> Add Article</button>}</FormSection>
        <FormSection title="Certifying Judicial Medical Officer" collapsible><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4"><FormField label="Conducting Officer"><Input value={f.moName} disabled={true} className="bg-slate-50 border-slate-200 text-slate-500 font-semibold" /></FormField><FormField label="Qualifications"><Input value={f.moQualifications} onChange={s("moQualifications")} disabled={readOnly} /></FormField><FormField label="Designation"><Input value={f.moDesignation} onChange={s("moDesignation")} disabled={readOnly} /></FormField></div></FormSection>
      </div>
    </div>
  );
}
