import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useApp } from "@/context/AppContext";
import { MLRForm } from "@/components/forms/MLRForm";
import { LabRequestModal } from "@/components/lab/LabRequestModal";
import type { LabRequest } from "@/types";

export function MLRFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, patients, mlrReports, saveMlrReport, labRequests, addLabRequest, linkLabRequest } = useApp();

  const isNew = id === "new";
  const form = isNew ? null : mlrReports.find(r => r.id === id) ?? null;
  const patientId = searchParams.get("patientId") ?? form?.patientId ?? "";
  const patient = patients.find(p => p.id === patientId) ?? null;

  const labRequest = form?.labRequestId
    ? labRequests.find(r => r.id === form.labRequestId) ?? null
    : null;

  const [showLabModal, setShowLabModal] = useState(false);
  const [labCtx, setLabCtx] = useState<{ patientId: string; formId: string; formType: string } | null>(null);

  if (!currentUser) return null;
  const readOnly = currentUser.role === "admin" || currentUser.role === "doctor";

  const handleSaveLabRequest = (req: LabRequest) => {
    addLabRequest(req);
    if (labCtx) linkLabRequest(labCtx.formType, labCtx.formId, req.id);
    setShowLabModal(false);
  };

  return (
    <>
      <MLRForm
        form={form}
        patient={patient}
        patients={patients}
        currentUser={currentUser}
        labRequest={labRequest}
        readOnly={readOnly}
        onSave={async r => { await saveMlrReport(r); navigate("/mlr"); }}
        onBack={() => navigate("/mlr")}
        onRequestLab={(pid, fid, ftype) => { setLabCtx({ patientId: pid, formId: fid, formType: ftype }); setShowLabModal(true); }}
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
