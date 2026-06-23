import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Eye } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Btn } from "@/components/ui/Btn";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export function PatientsPage() {
  const { currentUser, patients, mlefForms, mlrReports, autopsyForms, labRequests } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.nic.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin  = currentUser?.role === "admin";
  const isDoctor = currentUser?.role === "doctor";

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
          const pAutopsy  = autopsyForms.filter(f => f.patientId === p.id);
          const pLab      = labRequests.filter(r => r.patientId === p.id);

          return (
            <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Patient header */}
              <div className="px-5 py-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.id} · {p.sex}, {p.age} yrs · NIC: {p.nic}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.address}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  <div>Registered</div>
                  <div>{new Date(p.registeredAt).toLocaleDateString("en-GB")}</div>
                  <div>by {p.registeredBy}</div>
                </div>
              </div>

              {/* Forms row */}
              <div className="px-5 pb-4 border-t border-border pt-3 space-y-2">

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

                {/* MLR — doctor creates; admin views */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-slate-400 w-16 flex-shrink-0">MLR</span>
                  {pMlr.map(r => (
                    <Btn key={r.id} variant="secondary" size="sm" icon={<Eye size={12} />}
                      onClick={() => navigate(`/mlr/${r.id}`)}>
                      {r.id} <Badge status={r.status} />
                    </Btn>
                  ))}
                  {isDoctor && (
                    <Btn variant="ghost" size="sm" icon={<Plus size={12} />}
                      onClick={() => navigate(`/mlr/new?patientId=${p.id}`)}>
                      New MLR
                    </Btn>
                  )}
                  {pMlr.length === 0 && <span className="text-xs text-slate-400 italic">None</span>}
                </div>

                {/* Autopsy — doctor creates; admin views */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-slate-400 w-16 flex-shrink-0">Autopsy</span>
                  {pAutopsy.map(f => (
                    <Btn key={f.id} variant="secondary" size="sm" icon={<Eye size={12} />}
                      onClick={() => navigate(`/autopsy/${f.id}`)}>
                      {f.id} <Badge status={f.status} />
                    </Btn>
                  ))}
                  {isDoctor && (
                    <Btn variant="ghost" size="sm" icon={<Plus size={12} />}
                      onClick={() => navigate(`/autopsy/new?patientId=${p.id}`)}>
                      New Autopsy
                    </Btn>
                  )}
                  {pAutopsy.length === 0 && <span className="text-xs text-slate-400 italic">None</span>}
                </div>

                {/* Lab Reports — doctor requests; admin views results */}
                {pLab.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-slate-400 w-16 flex-shrink-0">Lab</span>
                    {pLab.map(r => (
                      <Btn key={r.id} variant="secondary" size="sm" icon={<Eye size={12} />}
                        onClick={() => navigate("/lab-requests")}>
                        {r.id} <Badge status={r.status} />
                      </Btn>
                    ))}
                  </div>
                )}


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
