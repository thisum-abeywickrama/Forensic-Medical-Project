import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { cls } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function MonthlyStatsPage() {
  const { patients, mlefForms, mlrReports, labRequests, autopsyForms } = useApp();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const byMonth = (items: any[], dateKey: string) =>
    MONTHS.map((_, i) => {
      const m = String(i + 1).padStart(2, "0");
      return items.filter(x => (x[dateKey] as string)?.startsWith(`${year}-${m}`)).length;
    });

  const monthlyData = MONTHS.map((month, i) => ({
    month,
    Patients:     byMonth(patients,    "registeredAt")[i],
    MLEF:         byMonth(mlefForms,   "createdAt")[i],
    MLR:          byMonth(mlrReports,  "createdAt")[i],
    "Lab Req":    byMonth(labRequests, "requestedAt")[i],
  }));

  const totals = {
    Patients:     patients.filter(p => p.registeredAt.startsWith(String(year))).length,
    MLEF:         mlefForms.filter(f => f.createdAt.startsWith(String(year))).length,
    MLR:          mlrReports.filter(r => r.createdAt.startsWith(String(year))).length,
    "Lab Requests": labRequests.filter(r => r.requestedAt.startsWith(String(year))).length,
    Autopsies:    autopsyForms.filter(f => f.createdAt.startsWith(String(year))).length,
  };

  // Hurt category pie
  const hurtData = ["non-grievous","grievous","fatal"].map(c => ({
    name: c === "non-grievous" ? "Non-Grievous" : c === "grievous" ? "Grievous" : "Fatal",
    value: mlefForms.filter(f => f.hurtCategory === c).length,
  })).filter(d => d.value > 0);

  // Body harm bar
  const harmTypes = ["abrasion","contusion","laceration","stab","cut","fracture","bite","firearms_inj","burns"];
  const harmData = harmTypes.map(t => ({
    name: t.replace("_inj"," inj.").replace(/_/g," "),
    count: mlefForms.filter(f => f.bodyHarmTypes.includes(t)).length,
  })).filter(d => d.count > 0).sort((a,b) => b.count - a.count);

  // Lab status pie
  const labStatusData = [
    { name: "Pending",     value: labRequests.filter(r => r.status === "pending").length },
    { name: "In Progress", value: labRequests.filter(r => r.status === "in_progress").length },
    { name: "Completed",   value: labRequests.filter(r => r.status === "completed").length },
  ].filter(d => d.value > 0);



  const noData = <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data available.</div>;

  return (
    <div>
      <PageHeader
        title="Monthly Statistics"
        subtitle={`Case trends and distributions for ${year}`}
        actions={
          <Select value={String(year)} onChange={v => setYear(Number(v))}
            options={[2024, 2025, 2026].map(y => ({ value: String(y), label: String(y) }))}
            className="w-28" />
        }
      />

      {/* Totals */}
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {Object.entries(totals).map(([label, count], i) => (
          <div key={label} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-family-heading)", color: CHART_COLORS[i] }}>{count}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
            <div className="text-xs text-slate-400">in {year}</div>
          </div>
        ))}
      </div>

      {/* Monthly volume */}
      <div className="bg-card border border-border rounded-xl p-5 mb-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Case Volume — {year}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Patients"  fill="#3b82f6" radius={[2,2,0,0]} />
            <Bar dataKey="MLEF"      fill="#8b5cf6" radius={[2,2,0,0]} />
            <Bar dataKey="MLR"       fill="#10b981" radius={[2,2,0,0]} />
            <Bar dataKey="Lab Req"   fill="#f59e0b" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Body Harm Distribution (All MLEF)</h3>
          {harmData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={harmData} layout="vertical" margin={{ top: 0, right: 20, left: 70, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} width={80} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : noData}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Hurt Category (MLEF)</h3>
          {hurtData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={hurtData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                  labelLine={false} style={{ fontSize: 10 }}>
                  {hurtData.map((entry, i) => <Cell key={`hurt-${entry.name}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : noData}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Lab Request Status</h3>
          {labStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={labStatusData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: 11 }}>
                  {labStatusData.map((entry, i) => <Cell key={`lab-${entry.name}`} fill={["#f59e0b","#8b5cf6","#10b981"][i % 3]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : noData}
        </div>
      </div>
    </div>
  );
}
