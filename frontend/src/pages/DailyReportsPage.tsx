import { useState } from "react";
import { Calendar, Printer } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Btn } from "@/components/ui/Btn";
import { Badge } from "@/components/ui/Badge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { TEST_LABELS } from "@/data/mockData";
import { cls } from "@/lib/utils";

function ReportSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
      <div className="px-5 py-3 border-b border-border bg-slate-50 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <span className="text-xs font-medium text-slate-500">{count} record{count !== 1 ? "s" : ""}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function EmptyRow() {
  return <div className="px-5 py-4 text-center text-sm text-slate-400 italic">No records for this date.</div>;
}

export function DailyReportsPage() {
  const { patients, mlefForms, mlrReports, labRequests, autopsyForms } = useApp();
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));

  const on = (d: string) => d.startsWith(reportDate);
  const todayPatients  = patients.filter(p => on(p.registeredAt));
  const todayMlef      = mlefForms.filter(f => on(f.createdAt));
  const todayMlr       = mlrReports.filter(r => on(r.createdAt));
  const todayLab       = labRequests.filter(r => on(r.requestedAt));
  const todayAutopsy   = autopsyForms.filter(f => on(f.createdAt));

  const patientMap = Object.fromEntries(patients.map(p => [p.id, p]));

  const summaryCards = [
    { label: "Patients",     count: todayPatients.length,  color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "MLEF Forms",   count: todayMlef.length,      color: "bg-violet-50 text-violet-700 border-violet-200" },
    { label: "MLR Reports",  count: todayMlr.length,       color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { label: "Lab Requests", count: todayLab.length,       color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Autopsies",    count: todayAutopsy.length,   color: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  return (
    <div>
      <PageHeader
        title="Daily Case Report"
        subtitle="Summary of all cases for a selected date"
        actions={
          <div className="flex items-center gap-3">
            <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
              className="border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary" />
            <Btn variant="secondary" size="sm" icon={<Printer size={14} />} onClick={() => window.print()}>Print</Btn>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        {summaryCards.map(s => (
          <div key={s.label} className={cls("rounded-xl border px-4 py-3", s.color)}>
            <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-family-heading)" }}>{s.count}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl mb-4 px-5 py-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Calendar size={15} className="text-primary" />
        {new Date(reportDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </div>

      <ReportSection title="Patients Registered" count={todayPatients.length}>
        {todayPatients.length > 0 ? (
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-xs uppercase text-slate-500">
              {["Patient ID", "Full Name", "Age / Sex", "NIC", "Registered By", "Time"].map(h => (
                <th key={h} className="text-left px-3 py-2 border-b border-slate-200">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {todayPatients.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{p.id}</td>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 text-slate-600">{p.age} / {p.sex}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.nic}</td>
                  <td className="px-3 py-2 text-slate-600">{p.registeredBy}</td>
                  <td className="px-3 py-2 text-slate-500">{new Date(p.registeredAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyRow />}
      </ReportSection>

      <ReportSection title="MLEF Forms Created" count={todayMlef.length}>
        {todayMlef.length > 0 ? (
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-xs uppercase text-slate-500">
              {["MLEF ID", "MLEF No.", "Patient", "Police Part", "Medical Part", "Status"].map(h => (
                <th key={h} className="text-left px-3 py-2 border-b border-slate-200">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {todayMlef.map(f => {
                const p = patientMap[f.patientId];
                return (
                  <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">{f.id}</td>
                    <td className="px-3 py-2 text-slate-600">{f.mlefNo || "—"}</td>
                    <td className="px-3 py-2 font-medium">{p?.name ?? f.patientId}</td>
                    <td className="px-3 py-2">{f.partAFilledAt ? <span className="text-emerald-600 font-medium">✓ Complete</span> : <span className="text-amber-600">Pending</span>}</td>
                    <td className="px-3 py-2">{f.partBFilledAt ? <span className="text-emerald-600 font-medium">✓ Complete</span> : <span className="text-amber-600">Pending</span>}</td>
                    <td className="px-3 py-2"><Badge status={f.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <EmptyRow />}
      </ReportSection>

      <ReportSection title="Lab Requests" count={todayLab.length}>
        {todayLab.length > 0 ? (
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-xs uppercase text-slate-500">
              {["Request ID", "Patient", "Requested By", "Tests", "Urgency", "Status"].map(h => (
                <th key={h} className="text-left px-3 py-2 border-b border-slate-200">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {todayLab.map(r => {
                const p = patientMap[r.patientId];
                return (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">{r.id}</td>
                    <td className="px-3 py-2 font-medium">{p?.name ?? r.patientId}</td>
                    <td className="px-3 py-2 text-slate-600">{r.requestedByName}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{r.testTypes.map(t => TEST_LABELS[t] ?? t).join(", ")}</td>
                    <td className="px-3 py-2"><UrgencyBadge urgency={r.urgency} /></td>
                    <td className="px-3 py-2"><Badge status={r.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <EmptyRow />}
      </ReportSection>

      {todayAutopsy.length > 0 && (
        <ReportSection title="Autopsy Forms" count={todayAutopsy.length}>
          {todayAutopsy.map(f => (
            <div key={f.id} className="flex items-center justify-between px-3 py-2 border-b border-slate-100 text-sm">
              <span className="font-medium">{f.deceasedName || (patientMap[f.patientId]?.name ?? f.patientId)}</span>
              <Badge status={f.status} />
            </div>
          ))}
        </ReportSection>
      )}
    </div>
  );
}
