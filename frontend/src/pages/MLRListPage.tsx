import { useNavigate } from "react-router";
import { FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FormList } from "@/components/forms/FormList";
import { downloadMlrPdf } from "@/lib/pdf";
import { isDownloadable } from "@/lib/pdf/status";
import { toast } from "sonner";

export function MLRListPage() {
  const { currentUser, patients, mlrReports } = useApp();
  const navigate = useNavigate();
  const isJmo = currentUser?.role === "jmo";

  const handleDownload = async (report: typeof mlrReports[number]) => {
    try {
      const patient = patients.find(p => p.id === report.patientId) ?? null;
      await downloadMlrPdf(report, patient, currentUser?.name ?? "Unknown user");
      toast.success(`Downloaded ${report.id}.`);
    } catch (err) {
      console.error("Failed to generate MLR PDF:", err);
      toast.error(`Could not generate PDF for ${report.id}.`);
    }
  };

  return (
    <FormList
      title="MLR Reports"
      icon={<FileText size={18} />}
      items={mlrReports}
      patients={patients}
      onOpen={id => navigate(`/mlr/${id}`)}
      onNew={isJmo ? () => navigate("/mlr/new") : undefined}
      newLabel="New MLR Report"
      onDownload={handleDownload}
      canDownload={item => isDownloadable("mlr", item.status)}
    />
  );
}
