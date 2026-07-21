import { useState, useRef } from "react";
import { Upload, FileText, ExternalLink, Download, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cls, downloadFileFromUrl } from "@/lib/utils";

interface PdfUploadProps {
  label?: string;
  formType: "mlef" | "mlr" | "pmr";
  pdfUrl?: string;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export function PdfUpload({
  label = "Upload PDF Copy",
  formType,
  pdfUrl,
  onUploadComplete,
  onRemove,
  disabled = false,
}: PdfUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a valid PDF file.");
      return;
    }

    // Limit size to 25MB
    if (file.size > 25 * 1024 * 1024) {
      toast.error("PDF file size must be less than 25MB.");
      return;
    }

    setUploading(true);
    try {
      const url = await api.storage.uploadFormPdf(file, formType);
      onUploadComplete(url);
      toast.success("PDF uploaded successfully to storage!");
    } catch (err: any) {
      console.error("PDF upload failed:", err);
      toast.error(err.message || "Failed to upload PDF copy.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const parts = url.split("/");
      return parts[parts.length - 1] || "Uploaded_Document.pdf";
    } catch {
      return "Uploaded_Document.pdf";
    }
  };

  return (
    <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={14} className="text-primary" />
          {label}
        </label>
        {pdfUrl && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 size={12} /> Uploaded
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      {pdfUrl ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg flex-shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-800 truncate" title={getFileNameFromUrl(pdfUrl)}>
                {getFileNameFromUrl(pdfUrl)}
              </p>
              <p className="text-[11px] text-slate-400">Stored in Supabase Storage ({formType})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
            >
              <ExternalLink size={12} /> View
            </a>
            <button
              type="button"
              onClick={() => downloadFileFromUrl(pdfUrl, getFileNameFromUrl(pdfUrl))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
            >
              <Download size={12} /> Download
            </button>
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  disabled={uploading}
                >
                  Replace
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove PDF copy"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : disabled ? (
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-center text-xs text-slate-400 italic">
          No PDF copy uploaded for this section yet.
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 text-slate-600 rounded-lg p-4 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <Loader2 size={22} className="animate-spin text-primary" />
              <span className="text-xs font-medium text-slate-600">Uploading PDF to Supabase Storage…</span>
            </div>
          ) : (
            <>
              <div className="p-2.5 bg-white border border-slate-200 rounded-full shadow-xs text-primary">
                <Upload size={18} />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700">Click to upload PDF copy</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF files up to 25MB</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
