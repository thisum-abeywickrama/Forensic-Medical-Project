import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { Btn } from "@/components/ui/Btn";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { TEST_LABELS } from "@/data/mockData";
import type { LabRequest, Patient, AppUser } from "@/types";

interface Props {
  request: LabRequest;
  patients: Patient[];
  currentUser: AppUser;
  onSave: (id: string, data: Partial<LabRequest>) => void;
  onClose: () => void;
}

export function LabReportModal({ request, patients, currentUser, onSave, onClose }: Props) {
  const patient = patients.find(p => p.id === request.patientId);
  const [testResults, setTestResults] = useState(request.testResults);
  const [observations, setObservations] = useState(request.observations);
  const [conclusion, setConclusion] = useState(request.conclusion);

  const handleSave = () => {
    onSave(request.id, {
      testResults: testResults, observations: observations, conclusion: conclusion,
      labTechId: currentUser.id,
      completedAt: new Date().toISOString(),
      status: "completed",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="font-bold text-slate-800" style={{ fontFamily: "var(--font-family-heading)" }}>Fill Lab Report</h2>
            {patient && <p className="text-xs text-slate-500">{patient.name} · {request.id}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
            <div className="font-semibold text-slate-700 mb-1">
              Tests: <UrgencyBadge urgency={request.urgency} />
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {request.testTypes.map(t => (
                <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{TEST_LABELS[t] ?? t}</span>
              ))}
            </div>
            {request.clinicalHistory && (
              <div className="mt-2 text-xs text-slate-500">History: "{request.clinicalHistory}"</div>
            )}
          </div>

          <FormField label="Test Results">
            <Textarea value={testResults} onChange={setTestResults} rows={4} placeholder="Enter results for each test..." />
          </FormField>
          <FormField label="Observations">
            <Textarea value={observations} onChange={setObservations} rows={3} />
          </FormField>
          <FormField label="Conclusion">
            <Textarea value={conclusion} onChange={setConclusion} rows={3} />
          </FormField>
          <p className="text-xs text-slate-400">Signed as: <strong>{currentUser.name}</strong> — {currentUser.designation}</p>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 sticky bottom-0 bg-white">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="success" icon={<CheckCircle size={14} />} onClick={handleSave}>Submit Report</Btn>
        </div>
      </div>
    </div>
  );
}
