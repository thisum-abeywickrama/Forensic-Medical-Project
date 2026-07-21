import { useNavigate } from "react-router";
import { Clipboard, FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FormList } from "@/components/forms/FormList";
import { downloadPmrPdf } from "@/lib/pdf";
import { isDownloadable } from "@/lib/pdf/status";
import { toast } from "sonner";

export function PMRListPage() {
  const { currentUser, patients, pmrForms } = useApp();
  const navigate = useNavigate();
  const isJmo = currentUser?.role === "jmo";

  const handleDownload = async (form: typeof pmrForms[number]) => {
    try {
      const patient = patients.find(p => p.id === form.patientId) ?? null;
      await downloadPmrPdf(form, patient, currentUser?.name ?? "Unknown user");
      toast.success(`Downloaded ${form.id}.`);
    } catch (err) {
      console.error("Failed to generate PMR PDF:", err);
      toast.error(`Could not generate PDF for ${form.id}.`);
    }
  };

  return (
    <FormList
      title="Post-Mortem Reports (PMR)"
      icon={<Clipboard size={18} />}
      items={pmrForms}
      patients={patients}
      onOpen={id => navigate(`/pmr/${id}`)}
      onNew={isJmo ? () => navigate("/pmr/new") : undefined}
      newLabel="New PMR Form"
      onDownload={handleDownload}
      canDownload={item => isDownloadable("pmr", item.status)}
      renderExtra={item => {
        const pdf = item.pdfUrl || (item as any).pdf_url;
        return pdf ? (
          <div className="text-xs text-slate-400 mt-0.5">
            <a href={pdf} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
              <FileText size={11} /> View Uploaded PDF Copy
            </a>
          </div>
        ) : null;
      }}
    />
  );
}
