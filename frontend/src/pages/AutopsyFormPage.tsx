import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { AutopsyForm } from "@/components/forms/AutopsyForm";
import { LabRequestModal } from "@/components/lab/LabRequestModal";
import { useApp } from "@/context/AppContext";
import type { LabRequest } from "@/types";

export function AutopsyFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, patients, autopsyForms, saveAutopsyForm, labRequests, addLabRequest, linkLabRequest } = useApp();
  const isNew = id === "new";
  const form = isNew ? null : autopsyForms.find(f => f.id === id) ?? null;
  const patientId = searchParams.get("patientId") ?? form?.patientId ?? "";
  const patient = patients.find(p => p.id === patientId) ?? null;
  const labRequest = form?.labRequestId ? labRequests.find(r => r.id === form.labRequestId) ?? null : null;
  const [showLabModal, setShowLabModal] = useState(false);
  const [labCtx, setLabCtx] = useState<{ patientId: string; formId: string; formType: string; onLink: (labReqId: string) => void } | null>(null);

  if (!currentUser) return null;
  const readOnly = currentUser.role !== "jmo";

  const handleSaveLabRequest = (request: LabRequest) => {
    addLabRequest(request);
    if (labCtx) {
      linkLabRequest(labCtx.formType, labCtx.formId, request.id);
      labCtx.onLink(request.id);
    }
    setShowLabModal(false);
  };

  return <>
    <AutopsyForm
      form={form} patient={patient} allPatients={patients} currentUser={currentUser} labRequest={labRequest} readOnly={readOnly}
      onSave={async formToSave => { await saveAutopsyForm(formToSave); navigate("/autopsy"); }}
      onBack={() => navigate("/autopsy")}
      onRequestLab={(pid, formId, formType, onLink) => { setLabCtx({ patientId: pid, formId, formType, onLink }); setShowLabModal(true); }}
    />
    {showLabModal && labCtx && <LabRequestModal patientId={labCtx.patientId} formId={labCtx.formId} formType={labCtx.formType} currentUser={currentUser} patients={patients} onSave={handleSaveLabRequest} onClose={() => setShowLabModal(false)} />}
  </>;
}
