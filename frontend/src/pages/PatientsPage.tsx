import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Eye } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Btn } from "@/components/ui/Btn";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export function PatientsPage() {
  const { currentUser, patients, mlefForms, mlrReports, pmrForms, autopsyForms, labRequests } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.nic.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin  = currentUser?.role === "admin";
  const isDoctor = currentUser?.role === "doctor";
  const isJmo    = currentUser?.role === "jmo";

  return (
    <div>
      <PageHeader
        title="Patient Records"
        subtitle="All registered patients and their associated forms"
        actions={(isAdmin || isDoctor)
          ? <Btn variant="primary" icon={<Plus size={14} />} onClick={() => navigate("/patients/register")}>Register Patient</Btn>
          : undefined
        }
      />
      <div className="mb-4">
        <Input value={search} onChange={setSearch} placeholder="Search by name, ID or NIC..." />
      </div>

      <div className="space-y-3">
        {filtered.map(p => {
          const pMlef     = mlefForms.filter(f => f.patientId === p.id);
          const pMlr      = mlrReports.filter(r => r.patientId === p.id);
          const pPmr      = pmrForms.filter(f => f.patientId === p.id);
          const pAutopsy  = autopsyForms.filter(f => f.patientId === p.id);
          const pLab      = labRequests.filter(r => r.patientId === p.id);

          return (
            <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Patient header */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  {p.profilePictureUrl ? (
                    <img
                      src={p.profilePictureUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.id} · {p.sex}, {p.age} yrs · NIC: {p.nic} · Email: {p.email} · Phone: {p.phone}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.address}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 text-left sm:text-right flex-shrink-0 border-t border-slate-100 sm:border-t-0 pt-2 sm:pt-0">
                  <div>Registered</div>
                  <div>{new Date(p.registeredAt).toLocaleDateString("en-GB")}</div>
                  <div>by {p.registeredBy}</div>
                </div>
              </div>

              {/* Forms row grouped by Clinical and Autopsy sections */}
              <div className="px-5 pb-4 border-t border-border pt-3 space-y-3">
                {/* Clinical Section */}
                <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100/85 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Section</div>
                  
                  {/* MLEF — everyone can see; admin+doctor can create */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-slate-400 w-16 flex-shrink-0">MLEF</span>
                    {pMlef.map(f => (
                      <Btn key={f.id} variant="secondary" size="sm" icon={<Eye size={12} />}
                        onClick={() => navigate(`/mlef/${f.id}`)}>
                        {f.mlefNo || f.id} <Badge status={f.status} />
                      </Btn>
                    ))}
                    {(isAdmin || isDoctor) && (
                      <Btn variant="ghost" size="sm" icon={<Plus size={12} />}
                        onClick={() => navigate(`/mlef/new?patientId=${p.id}`)}>
                        New MLEF
                      </Btn>
                    )}
                    {pMlef.length === 0 && !isAdmin && !isDoctor && (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </div>

                  {/* MLR — JMO creates; admin/doctor views */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-slate-400 w-16 flex-shrink-0">MLR</span>
                    {pMlr.map(r => (
                      <Btn key={r.id} variant="secondary" size="sm" icon={<Eye size={12} />}
                        onClick={() => navigate(`/mlr/${r.id}`)}>
                        {r.id} <Badge status={r.status} />
                      </Btn>
                    ))}
                    {isJmo && (
                      <Btn variant="ghost" size="sm" icon={<Plus size={12} />}
                        onClick={() => navigate(`/mlr/new?patientId=${p.id}`)}>
                        New MLR
                      </Btn>
                    )}
                    {pMlr.length === 0 && <span className="text-xs text-slate-400 italic">None</span>}
                  </div>

                  {/* Lab Reports — doctor/JMO requests; admin views results */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-slate-400 w-16 flex-shrink-0">Lab Requests</span>
                    {pLab.map(r => (
                      <Btn key={r.id} variant="secondary" size="sm" icon={<Eye size={12} />}
                        onClick={() => navigate("/lab-requests")}>
                        {r.id} <Badge status={r.status} />
                      </Btn>
                    ))}
                    {pLab.length === 0 && <span className="text-xs text-slate-400 italic">None</span>}
                  </div>
                </div>

                {/* Autopsy Section */}
                <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100/85 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Autopsy Section</div>

                  {/* PMR — JMO creates; others view */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-slate-400 w-16 flex-shrink-0">PMR</span>
                    {pPmr.map(f => (
                      <Btn key={f.id} variant="secondary" size="sm" icon={<Eye size={12} />}
                        onClick={() => navigate(`/pmr/${f.id}`)}>
                        {f.id} <Badge status={f.status} />
                      </Btn>
                    ))}
                    {isJmo && (
                      <Btn variant="ghost" size="sm" icon={<Plus size={12} />}
                        onClick={() => navigate(`/pmr/new?patientId=${p.id}`)}>
                        New PMR
                      </Btn>
                    )}
                    {pPmr.length === 0 && <span className="text-xs text-slate-400 italic">None</span>}
                  </div>

                  {/* Autopsy â€” JMO creates; others view */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-slate-400 w-16 flex-shrink-0">Autopsy</span>
                    {pAutopsy.map(f => (
                      <Btn key={f.id} variant="secondary" size="sm" icon={<Eye size={12} />}
                        onClick={() => navigate(`/autopsy/${f.id}`)}>
                        {f.id} <Badge status={f.status} />
                      </Btn>
                    ))}
                    {isJmo && (
                      <Btn variant="ghost" size="sm" icon={<Plus size={12} />}
                        onClick={() => navigate(`/autopsy/new?patientId=${p.id}`)}>
                        New Autopsy
                      </Btn>
                    )}
                    {pAutopsy.length === 0 && <span className="text-xs text-slate-400 italic">None</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-card border border-border rounded-xl px-5 py-10 text-center text-slate-400 text-sm">
            {search ? "No patients match your search." : "No patients registered yet."}
          </div>
        )}
      </div>
    </div>
  );
}
