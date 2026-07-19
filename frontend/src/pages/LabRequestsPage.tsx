import { useState } from "react";
import { Microscope, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadLabPdf } from "@/lib/pdf";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { LabRequestModal } from "@/components/lab/LabRequestModal";
import { LabReportModal } from "@/components/lab/LabReportModal";
import { TEST_LABELS } from "@/data/mockData";
import type { LabRequest } from "@/types";

export function LabRequestsPage() {
  const { currentUser, patients, labRequests, addLabRequest, updateLabRequest } = useApp();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  if (!currentUser) return null;

  const isLab    = currentUser.role === "lab";
  const isDoctor = currentUser.role === "doctor";
  const isAdmin  = currentUser.role === "admin";

  // Lab sees all; admin sees all (read-only); doctor sees own requests
  const visible = (isLab || isAdmin)
    ? labRequests
    : labRequests.filter(r => r.requestedBy === currentUser.id);

  const patientMap = Object.fromEntries(patients.map(p => [p.id, p]));
  const activeReport = activeReportId ? labRequests.find(r => r.id === activeReportId) ?? null : null;

  const filtered = visible.filter(req => {
    const p = patientMap[req.patientId];
    const patientName = p ? p.name.toLowerCase() : "";
    const patientId = req.patientId.toLowerCase();
    const requestId = req.id.toLowerCase();
    const status = req.status.toLowerCase();
    const urgency = req.urgency.toLowerCase();
    const query = search.toLowerCase();
    return requestId.includes(query) || patientId.includes(query) || patientName.includes(query) || status.includes(query) || urgency.includes(query);
  });

  const handleSaveRequest = (req: LabRequest) => {
    addLabRequest(req);
    setShowRequestModal(false);
  };

  const handleDownload = async (req: LabRequest) => {
    try {
      await downloadLabPdf(req, patientMap[req.patientId] ?? null, currentUser.name);
      toast.success(`Downloaded ${req.id}.`);
    } catch (err) {
      console.error("Failed to generate lab PDF:", err);
      toast.error(`Could not generate PDF for ${req.id}.`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Lab Reports"
        subtitle={isLab ? "All pending and completed requests" : isAdmin ? "All lab requests — view only" : "Requests you have submitted"}
      />

      <div className="mb-4">
        <Input value={search} onChange={setSearch} placeholder="Search by ID, patient name, patient ID, status or urgency..." />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0
          ? <div className="px-5 py-10 text-center text-slate-400 text-sm">No lab requests found.</div>
          : (
            <div className="divide-y divide-border">
              {filtered.map(req => {
                const p = patientMap[req.patientId];
                return (
                  <div key={req.id} className="px-5 py-4 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Microscope size={18} /></div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{req.id}</div>
                          <div className="text-xs text-slate-500">{p ? `${p.name} · ${p.id}` : req.patientId}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            By {req.requestedByName} · {new Date(req.requestedAt).toLocaleString("en-GB")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <UrgencyBadge urgency={req.urgency} />
                        <Badge status={req.status} />
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1 ml-12">
                      {req.testTypes.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{TEST_LABELS[t] ?? t}</span>
                      ))}
                    </div>
                    {req.clinicalHistory && (
                      <div className="mt-1 ml-12 text-xs text-slate-500 italic">"{req.clinicalHistory}"</div>
                    )}

                    {req.status === "completed" && (
                      <div className="mt-3 ml-12 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                        <div className="font-semibold text-emerald-800 mb-1">Report — {req.labTechName}</div>
                        <div><span className="text-slate-600">Results:</span> {req.testResults}</div>
                        <div><span className="text-slate-600">Observations:</span> {req.observations}</div>
                        <div><span className="text-slate-600">Conclusion:</span> {req.conclusion}</div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xs text-slate-400">Completed: {new Date(req.completedAt).toLocaleString("en-GB")}</div>
                          <Btn variant="secondary" size="sm" icon={<Download size={12} />} onClick={() => handleDownload(req)}>
                            Download PDF
                          </Btn>
                        </div>
                      </div>
                    )}

                    {isLab && req.status !== "completed" && (
                      <div className="mt-2 ml-12">
                        <Btn variant="success" size="sm" onClick={() => { setActiveReportId(req.id); setShowReportModal(true); }}>
                          Fill Lab Report
                        </Btn>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="mt-1 ml-12">
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">View Only</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        }
      </div>

      {showRequestModal && (
        <LabRequestModal
          patientId={patients[0]?.id ?? ""} formId="" formType="general"
          currentUser={currentUser} patients={patients}
          onSave={handleSaveRequest} onClose={() => setShowRequestModal(false)}
        />
      )}

      {showReportModal && activeReport && (
        <LabReportModal
          request={activeReport} patients={patients} currentUser={currentUser}
          onSave={(id, data) => { updateLabRequest(id, data); setShowReportModal(false); }}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
