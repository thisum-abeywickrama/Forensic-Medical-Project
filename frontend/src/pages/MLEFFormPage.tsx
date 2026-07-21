import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useApp } from "@/context/AppContext";
import { MLEFForm } from "@/components/forms/MLEFForm";
import { LabRequestModal } from "@/components/lab/LabRequestModal";
import type { MLEFForm as MLEFFormType, LabRequest } from "@/types";

export function MLEFFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, patients, mlefForms, saveMlefForm, labRequests, addLabRequest, linkLabRequest } = useApp();

  const isNew = id === "new";
  const form = isNew ? null : mlefForms.find(f => f.id === id) ?? null;
  const patientId = searchParams.get("patientId") ?? form?.patientId ?? "";
  const patient = patients.find(p => p.id === patientId) ?? null;

  const labRequest = form?.labRequestId
    ? labRequests.find(r => r.id === form.labRequestId) ?? null
    : null;

  const [showLabModal, setShowLabModal] = useState(false);
  const [labCtx, setLabCtx] = useState<{ patientId: string; formId: string; formType: string } | null>(null);

  if (!currentUser) return null;

  const handleRequestLab = (pid: string, fid: string, ftype: string) => {
    setLabCtx({ patientId: pid, formId: fid, formType: ftype });
    setShowLabModal(true);
  };

  const handleSaveLabRequest = (req: LabRequest) => {
    addLabRequest(req);
    if (labCtx) linkLabRequest(labCtx.formType, labCtx.formId, req.id);
    setShowLabModal(false);
  };

  return (
    <>
      <MLEFForm
        form={form}
        patient={patient}
        allPatients={patients}
        userRole={currentUser.role}
        currentUser={currentUser}
        labRequest={labRequest}
        onSave={async (f: MLEFFormType) => { await saveMlefForm(f); navigate("/mlef"); }}
        onBack={() => navigate("/mlef")}
        onRequestLab={handleRequestLab}
      />

      {showLabModal && labCtx && (
        <LabRequestModal
          patientId={labCtx.patientId}
          formId={labCtx.formId}
          formType={labCtx.formType}
          currentUser={currentUser}
          patients={patients}
          onSave={handleSaveLabRequest}
          onClose={() => setShowLabModal(false)}
        />
      )}
    </>
  );
}
