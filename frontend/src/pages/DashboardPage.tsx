import { useNavigate } from "react-router";
import { Activity, Users, ClipboardList, FileText, FlaskConical, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Btn } from "@/components/ui/Btn";
import { cls } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export function DashboardPage() {
  const { currentUser, patients, mlefForms, labRequests, mlrReports, pmrForms } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const pendingLab = labRequests.filter(l => l.status === "pending").length;
  const inProgressLab = labRequests.filter(l => l.status === "in_progress").length;

  const stats =
    currentUser.role === "doctor"
      ? [
          { label: "Patients",     value: patients.length,    icon: <Users size={20} />,        color: "text-blue-600 bg-blue-100" },
          { label: "MLEF Forms",   value: mlefForms.length,   icon: <ClipboardList size={20} />, color: "text-violet-600 bg-violet-100" },
          { label: "MLR Reports",  value: mlrReports.length,  icon: <FileText size={20} />,      color: "text-emerald-600 bg-emerald-100" },
          { label: "Lab Requests", value: labRequests.length, icon: <FlaskConical size={20} />,  color: "text-amber-600 bg-amber-100" },
        ]
      : currentUser.role === "jmo"
      ? [
          { label: "Patients",     value: patients.length,    icon: <Users size={20} />,        color: "text-blue-600 bg-blue-100" },
          { label: "MLR Reports",  value: mlrReports.length,  icon: <FileText size={20} />,      color: "text-emerald-600 bg-emerald-100" },
          { label: "Draft MLRs",   value: mlrReports.filter(r => r.status === "draft").length, icon: <Clock size={20} />,       color: "text-amber-600 bg-amber-100" },
          { label: "Submitted MLRs", value: mlrReports.filter(r => r.status === "submitted").length, icon: <CheckCircle size={20} />, color: "text-emerald-600 bg-emerald-100" },
        ]
      : currentUser.role === "admin"
      ? [
          { label: "Patients",            value: patients.length,                           icon: <Users size={20} />,         color: "text-blue-600 bg-blue-100" },
          { label: "MLEF Forms",          value: mlefForms.length,                          icon: <ClipboardList size={20} />, color: "text-violet-600 bg-violet-100" },
          { label: "Pending Police Part", value: mlefForms.filter(f => !f.partAFilledAt).length, icon: <AlertCircle size={20} />, color: "text-amber-600 bg-amber-100" },
        ]
      : [
          { label: "Pending",    value: pendingLab,                                         icon: <Clock size={20} />,       color: "text-amber-600 bg-amber-100" },
          { label: "In Progress",value: inProgressLab,                                      icon: <Activity size={20} />,    color: "text-violet-600 bg-violet-100" },
          { label: "Completed",  value: labRequests.filter(l => l.status === "completed").length, icon: <CheckCircle size={20} />, color: "text-emerald-600 bg-emerald-100" },
        ];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${currentUser.name}`}
        subtitle={`${currentUser.designation} · ${new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className={cls("p-2 rounded-lg", s.color)}>{s.icon}</div>
            </div>
            <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-family-heading)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Recent Patients</h2>
          <Btn variant="ghost" size="sm" onClick={() => navigate("/patients")}>View All</Btn>
        </div>
        <div className="divide-y divide-border">
          {patients.slice(0, 5).map(p => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.id} · {p.sex}, {p.age} yrs · NIC: {p.nic}</div>
                </div>
              </div>
              <div className="text-xs text-slate-400">{new Date(p.registeredAt).toLocaleDateString("en-GB")}</div>
            </div>
          ))}
          {patients.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No patients registered yet.</div>
          )}
        </div>
      </div>

      {currentUser.role === "jmo" && (
        <div className="bg-card rounded-xl border border-border mt-6">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Recent MLR Reports</h2>
            <Btn variant="ghost" size="sm" onClick={() => navigate("/mlr")}>View All</Btn>
          </div>
          <div className="divide-y divide-border">
            {mlrReports.slice(0, 5).map(r => {
              const p = patients.find(patient => patient.id === r.patientId);
              return (
                <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-semibold">
                      <FileText size={15} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{r.id}</div>
                      <div className="text-xs text-slate-500">{p ? p.name : "Unknown Patient"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("en-GB")}</span>
                    <Badge status={r.status} />
                  </div>
                </div>
              );
            })}
            {mlrReports.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">No MLR reports created yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
