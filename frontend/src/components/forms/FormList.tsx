import { useState } from "react";
import { Eye, Download } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import type { Patient } from "@/types";

interface ListItem {
  id: string;
  patientId: string;
  status: string;
  createdAt: string;
}

interface FormListProps<T extends ListItem> {
  title: string;
  icon: React.ReactNode;
  items: T[];
  patients: Patient[];
  onOpen: (id: string) => void;
  onNew?: () => void;
  newLabel?: string;
  renderExtra?: (item: T) => React.ReactNode;
  /** Generate a PDF for this record. Omit to hide the download action entirely. */
  onDownload?: (item: T) => void;
  /** Whether this particular record is finished enough to export. */
  canDownload?: (item: T) => boolean;
}

export function FormList<T extends ListItem>({ title, icon, items, patients, onOpen, onNew, newLabel, renderExtra, onDownload, canDownload }: FormListProps<T>) {
  const [search, setSearch] = useState("");
  const patientMap = Object.fromEntries(patients.map(p => [p.id, p]));

  const filtered = items.filter(item => {
    const p = patientMap[item.patientId];
    const patientName = p ? p.name.toLowerCase() : "";
    const patientId = item.patientId.toLowerCase();
    const formId = item.id.toLowerCase();
    const status = item.status.toLowerCase();
    const query = search.toLowerCase();
    return formId.includes(query) || patientId.includes(query) || patientName.includes(query) || status.includes(query);
  });

  return (
    <div>
      <PageHeader
        title={title}
        actions={onNew
          ? <Btn variant="primary" icon={icon} onClick={onNew}>{newLabel ?? `New ${title.replace(/s$/, "")}`}</Btn>
          : undefined
        }
      />

      <div className="mb-4">
        <Input value={search} onChange={setSearch} placeholder="Search by ID, patient name, patient ID or status..." />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0
          ? <div className="px-5 py-10 text-center text-slate-400 text-sm">No records found.</div>
          : (
            <div className="divide-y divide-border">
              {filtered.map(item => {
                const p = patientMap[item.patientId];
                return (
                  <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">{icon}</div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{item.id}</div>
                        <div className="text-xs text-slate-500">{p ? `${p.name} · ${p.id}` : item.patientId}</div>
                        {renderExtra?.(item)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={item.status} />
                      <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString("en-GB")}</div>
                      {onDownload && canDownload?.(item) && (
                        <Btn variant="secondary" size="sm" icon={<Download size={12} />} onClick={() => onDownload(item)}>PDF</Btn>
                      )}
                      <Btn variant="secondary" size="sm" icon={<Eye size={12} />} onClick={() => onOpen(item.id)}>Open</Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}
