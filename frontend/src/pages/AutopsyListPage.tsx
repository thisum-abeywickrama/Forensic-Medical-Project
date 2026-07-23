import { useNavigate } from "react-router";
import { FileSearch } from "lucide-react";
import { FormList } from "@/components/forms/FormList";
import { useApp } from "@/context/AppContext";
import { downloadAutopsyPdf } from "@/lib/pdf";
import { isDownloadable } from "@/lib/pdf/status";
import { toast } from "sonner";

export function AutopsyListPage() {
  const { currentUser, patients, autopsyForms } = useApp();
  const navigate = useNavigate();
  const isJmo = currentUser?.role === "jmo";

  const handleDownload = async (form: typeof autopsyForms[number]) => {
    try {
      const patient = patients.find(p => p.id === form.patientId) ?? null;
      await downloadAutopsyPdf(form, patient, currentUser?.name ?? "Unknown user");
      toast.success(`Downloaded ${form.id}.`);
    } catch (err) {
      console.error("Failed to generate autopsy PDF:", err);
      toast.error(`Could not generate PDF for ${form.id}.`);
    }
  };

  return <FormList
    title="Autopsy Forms"
    icon={<FileSearch size={18} />}
    items={autopsyForms}
    patients={patients}
    onOpen={id => navigate(`/autopsy/${id}`)}
    onNew={isJmo ? () => navigate("/autopsy/new") : undefined}
    newLabel="New Autopsy Form"
    onDownload={handleDownload}
    canDownload={item => isDownloadable("autopsy", item.status)}
  />;
}
