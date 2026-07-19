import { useNavigate } from "react-router";
import { ClipboardList, Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FormList } from "@/components/forms/FormList";
import { downloadMlefPdf } from "@/lib/pdf";
import { isDownloadable } from "@/lib/pdf/status";
import { toast } from "sonner";

export function MLEFListPage() {
  const { currentUser, patients, mlefForms } = useApp();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === "admin";

  const handleDownload = async (form: typeof mlefForms[number]) => {
    try {
      const patient = patients.find(p => p.id === form.patientId) ?? null;
      await downloadMlefPdf(form, patient, currentUser?.name ?? "Unknown user");
      toast.success(`Downloaded ${form.id}.`);
    } catch (err) {
      console.error("Failed to generate MLEF PDF:", err);
      toast.error(`Could not generate PDF for ${form.id}.`);
    }
  };

  return (
    <FormList
      title="MLEF Forms"
      icon={<ClipboardList size={18} />}
      items={mlefForms}
      patients={patients}
      onOpen={id => navigate(`/mlef/${id}`)}
      onNew={isAdmin ? () => navigate("/mlef/new") : undefined}
      newLabel="New MLEF"
      onDownload={handleDownload}
      canDownload={item => isDownloadable("mlef", item.status)}
      renderExtra={item => (
        <div className="text-xs text-slate-400 mt-0.5">
          {item.mlefNo && <span>MLEF No: {item.mlefNo} · </span>}
          Police: {item.partAFilledAt
            ? <span className="text-emerald-600">✓ Filled</span>
            : <span className="text-amber-600">Pending</span>}
          {" · "}Medical: {item.partBFilledAt
            ? <span className="text-emerald-600">✓ Filled</span>
            : <span className="text-amber-600">Pending</span>}
        </div>
      )}
    />
  );
}
