import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useApp } from "@/context/AppContext";
import { PMRForm } from "@/components/forms/PMRForm";
import { LabRequestModal } from "@/components/lab/LabRequestModal";
import type { LabRequest } from "@/types";

export function PMRFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, patients, pmrForms, savePmrForm, labRequests, addLabRequest, linkLabRequest } = useApp();

  const isNew = id === "new";
  const form = isNew ? null : pmrForms.find(f => f.id === id) ?? null;
  const patientId = searchParams.get("patientId") ?? form?.patientId ?? "";
  const patient = patients.find(p => p.id === patientId) ?? null;

  const labRequest = form?.labRequestId
    ? labRequests.find(r => r.id === form.labRequestId) ?? null
    : null;

  const [showLabModal, setShowLabModal] = useState(false);
  const [labCtx, setLabCtx] = useState<{
    patientId: string;
    formId: string;
    formType: string;
    onLink: (labReqId: string) => void;
  } | null>(null);

  if (!currentUser) return null;
  const readOnly = currentUser.role !== "jmo";

  const handleSaveLabRequest = (req: LabRequest) => {
    addLabRequest(req);
    if (labCtx) {
      linkLabRequest(labCtx.formType, labCtx.formId, req.id);
      labCtx.onLink(req.id);
    }
    setShowLabModal(false);
  };

  return (
    <>
      <PMRForm
        form={form}
        patient={patient}
        allPatients={patients}
        currentUser={currentUser}
        labRequest={labRequest}
        readOnly={readOnly}
        onSave={async f => { await savePmrForm(f); navigate("/pmr"); }}
        onBack={() => navigate("/pmr")}
        onRequestLab={(pid, fid, ftype, onLink) => {
          setLabCtx({ patientId: pid, formId: fid, formType: ftype, onLink });
          setShowLabModal(true);
        }}
      />
      {showLabModal && labCtx && (
        <LabRequestModal
          patientId={labCtx.patientId} formId={labCtx.formId} formType={labCtx.formType}
          currentUser={currentUser} patients={patients}
          onSave={handleSaveLabRequest} onClose={() => setShowLabModal(false)}
        />
      )}
    </>
  );
}
