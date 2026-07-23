import { createContext, useContext, useState, useEffect } from "react";
import type { AppUser, Patient, MLEFForm, MLRReport, LabRequest, PMRForm, AutopsyForm } from "@/types";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface AppContextType {
  currentUser: AppUser | null;
  setCurrentUser: (u: AppUser | null) => void;
  users: AppUser[];
  addUser: (u: AppUser) => void;
  patients: Patient[];
  addPatient: (p: Patient) => void;
  mlefForms: MLEFForm[];
  saveMlefForm: (f: MLEFForm) => void;
  mlrReports: MLRReport[];
  saveMlrReport: (r: MLRReport) => void;
  labRequests: LabRequest[];
  addLabRequest: (r: LabRequest) => void;
  updateLabRequest: (id: string, data: Partial<LabRequest>) => void;
  linkLabRequest: (formType: string, formId: string, labRequestId: string) => void;
  pmrForms: PMRForm[];
  savePmrForm: (f: PMRForm) => void;
  autopsyForms: AutopsyForm[];
  saveAutopsyForm: (f: AutopsyForm) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const syncIdCache = (prefix: string, items: { id: string }[]) => {
  sessionStorage.setItem(`ids_${prefix}`, JSON.stringify(items.map(x => x.id)));
};

const syncGrievousCache = (reports: MLRReport[]) => {
  const ids = reports.flatMap(r => (r.grievousEntries || []).map((g: any) => g.id));
  sessionStorage.setItem("ids_GE", JSON.stringify(ids));
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [users, setUsers] = useState<AppUser[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [mlefForms, setMlefForms] = useState<MLEFForm[]>([]);
  const [mlrReports, setMlrReports] = useState<MLRReport[]>([]);
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [pmrForms, setPmrForms] = useState<PMRForm[]>([]);
  const [autopsyForms, setAutopsyForms] = useState<AutopsyForm[]>([]);

  const handleSetCurrentUser = (u: AppUser | null) => {
    if (u === null) {
      api.auth.logout();
    }
    setCurrentUser(u);
  };

  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      setPatients([]);
      setMlefForms([]);
      setMlrReports([]);
      setLabRequests([]);
      setPmrForms([]);
      setAutopsyForms([]);
      return;
    }

    const fetchData = async () => {
      const failures: string[] = [];

      // Each resource falls back to an empty list so one failure does not blank
      // the whole app — but the failure is always logged and surfaced, otherwise
      // "no records" is indistinguishable from "the server is down".
      const load = async <T,>(label: string, fn: () => Promise<T>): Promise<T | []> => {
        try {
          return await fn();
        } catch (err) {
          console.error(`Failed to load ${label}:`, err);
          failures.push(label);
          return [];
        }
      };

      try {
        const [usersData, patientsData, mlefData, mlrData, labData, pmrData, autopsyData] = await Promise.all([
          load("staff", () => api.auth.getUsers()),
          load("patients", () => api.patients.getAll()),
          load("MLEF forms", () => api.mlef.getAll()),
          load("MLR reports", () => api.mlr.getAll()),
          load("lab requests", () => api.lab.getAll()),
          load("PMR reports", () => api.pmr.getAll()),
          load("Autopsy forms", () => api.autopsy.getAll()),
        ]);

        setUsers(usersData || []);
        setPatients(patientsData || []);
        setMlefForms(mlefData || []);
        setMlrReports(mlrData || []);
        setLabRequests(labData || []);
        setPmrForms(pmrData || []);
        setAutopsyForms(autopsyData || []);

        syncIdCache("USR", usersData || []);
        syncIdCache("P", patientsData || []);
        syncIdCache("MLEF", mlefData || []);
        syncIdCache("MLR", mlrData || []);
        syncIdCache("LAB", labData || []);
        syncIdCache("PMR", pmrData || []);
        syncIdCache("AUTOPSY", autopsyData || []);
        syncGrievousCache(mlrData || []);

        if (failures.length) {
          toast.error(
            `Could not load ${failures.join(", ")}. Check that the backend is running — details are in the browser console.`,
            { duration: 8000 }
          );
        }
      } catch (err) {
        console.error("Error fetching application data from backend:", err);
        toast.error("Could not load data from the server. See the browser console for details.");
      }
    };

    fetchData();
  }, [currentUser]);

  const addUser = async (u: AppUser) => {
    try {
      const saved = await api.auth.register(u);
      setUsers(prev => {
        const next = [...prev, saved];
        syncIdCache("USR", next);
        return next;
      });
      toast.success(`User ${saved.name} (ID: ${saved.id}) created successfully!`);
    } catch (err) {
      console.error("Failed to add user:", err);
      toast.error(`Failed to create user ${u.name}`);
    }
  };

  const addPatient = async (p: Patient) => {
    try {
      const saved = await api.patients.create(p);
      setPatients(prev => {
        const next = [...prev, saved];
        syncIdCache("P", next);
        return next;
      });
      toast.success(`Patient ${saved.name} (ID: ${saved.id}) registered successfully!`);
    } catch (err) {
      console.error("Failed to add patient:", err);
      toast.error(`Failed to register patient ${p.name}`);
    }
  };

  const saveMlefForm = async (f: MLEFForm) => {
    try {
      setMlefForms(prev => {
        const next = prev.some(x => x.id === f.id) ? prev.map(x => x.id === f.id ? f : x) : [...prev, f];
        syncIdCache("MLEF", next);
        return next;
      });
      const saved = await api.mlef.save(f);
      const normalizedSaved = {
        ...saved,
        partAPdfUrl: saved.partAPdfUrl || (saved as any).part_a_pdf_url || f.partAPdfUrl,
        partBPdfUrl: saved.partBPdfUrl || (saved as any).part_b_pdf_url || f.partBPdfUrl,
      };
      setMlefForms(prev => {
        const next = prev.map(x => x.id === normalizedSaved.id ? normalizedSaved : x);
        syncIdCache("MLEF", next);
        return next;
      });
      toast.success(`MLEF Form ${saved.id} saved successfully!`);
      return normalizedSaved;
    } catch (err) {
      console.error("Failed to save MLEF form:", err);
      toast.error(`Failed to save MLEF Form ${f.id}`);
      throw err;
    }
  };

  const saveMlrReport = async (r: MLRReport) => {
    try {
      const saved = await api.mlr.save(r);
      const normalizedSaved = {
        ...saved,
        pdfUrl: saved.pdfUrl || (saved as any).pdf_url || r.pdfUrl,
      };
      setMlrReports(prev => {
        const next = prev.some(x => x.id === normalizedSaved.id)
          ? prev.map(x => x.id === normalizedSaved.id ? normalizedSaved : x)
          : [...prev, normalizedSaved];
        syncIdCache("MLR", next);
        syncGrievousCache(next);
        return next;
      });
      toast.success(`MLR Report ${saved.id} saved successfully!`);
      return normalizedSaved;
    } catch (err) {
      console.error("Failed to save MLR report:", err);
      const message = err instanceof Error ? err.message : `Failed to save MLR Report ${r.id}`;
      toast.error(`Failed to save MLR Report ${r.id}: ${message}`);
      throw err;
    }
  };

  const addLabRequest = async (r: LabRequest) => {
    try {
      const saved = await api.lab.create(r);
      setLabRequests(prev => {
        const next = [...prev, saved];
        syncIdCache("LAB", next);
        return next;
      });
    } catch (err) {
      console.error("Failed to add lab request:", err);
    }
  };

  const updateLabRequest = async (id: string, data: Partial<LabRequest>) => {
    try {
      const saved = await api.lab.update(id, data);
      setLabRequests(prev => {
        const next = prev.map(r => r.id === id ? saved : r);
        syncIdCache("LAB", next);
        return next;
      });
    } catch (err) {
      console.error("Failed to update lab request:", err);
    }
  };

  const linkLabRequest = async (formType: string, formId: string, labRequestId: string) => {
    if (formType === "mlef") {
      const form = mlefForms.find(f => f.id === formId);
      if (form) {
        const updated = { ...form, labRequestId };
        try {
          const saved = await api.mlef.save(updated);
          setMlefForms(prev => {
            const next = prev.map(f => f.id === formId ? saved : f);
            syncIdCache("MLEF", next);
            return next;
          });
        } catch (err) {
          console.error("Failed to link lab request to MLEF form:", err);
        }
      }
    } else if (formType === "mlr") {
      const report = mlrReports.find(r => r.id === formId);
      if (report) {
        const updated = { ...report, labRequestId };
        try {
          const saved = await api.mlr.save(updated);
          setMlrReports(prev => {
            const next = prev.map(r => r.id === formId ? saved : r);
            syncIdCache("MLR", next);
            return next;
          });
        } catch (err) {
          console.error("Failed to link lab request to MLR report:", err);
        }
      }
    } else if (formType === "pmr") {
      const form = pmrForms.find(f => f.id === formId);
      if (form) {
        const updated = { ...form, labRequestId };
        try {
          const saved = await api.pmr.save(updated);
          setPmrForms(prev => {
            const next = prev.map(f => f.id === formId ? saved : f);
            syncIdCache("PMR", next);
            return next;
          });
        } catch (err) {
          console.error("Failed to link lab request to PMR form:", err);
        }
      }
    } else if (formType === "autopsy") {
      const form = autopsyForms.find(f => f.id === formId);
      if (form) {
        const updated = { ...form, labRequestId };
        try {
          const saved = await api.autopsy.save(updated);
          setAutopsyForms(prev => {
            const next = prev.map(f => f.id === formId ? saved : f);
            syncIdCache("AUTOPSY", next);
            return next;
          });
        } catch (err) {
          console.error("Failed to link lab request to autopsy form:", err);
        }
      }
    }
  };

  const savePmrForm = async (f: PMRForm) => {
    try {
      setPmrForms(prev => {
        const next = prev.some(x => x.id === f.id) ? prev.map(x => x.id === f.id ? f : x) : [...prev, f];
        syncIdCache("PMR", next);
        return next;
      });
      const saved = await api.pmr.save(f);
      const normalizedSaved = {
        ...saved,
        pdfUrl: saved.pdfUrl || (saved as any).pdf_url || f.pdfUrl,
      };
      setPmrForms(prev => {
        const next = prev.map(x => x.id === normalizedSaved.id ? normalizedSaved : x);
        syncIdCache("PMR", next);
        return next;
      });
      toast.success(`PMR Form ${saved.id} saved successfully!`);
      return normalizedSaved;
    } catch (err) {
      console.error("Failed to save PMR form:", err);
      toast.error(`Failed to save PMR Form ${f.id}`);
      throw err;
    }
  };

  const saveAutopsyForm = async (f: AutopsyForm) => {
    try {
      const saved = await api.autopsy.save(f);
      setAutopsyForms(prev => {
        const next = prev.some(x => x.id === saved.id)
          ? prev.map(x => x.id === saved.id ? saved : x)
          : [...prev, saved];
        syncIdCache("AUTOPSY", next);
        return next;
      });
      toast.success(`Autopsy Form ${saved.id} saved successfully!`);
      return saved;
    } catch (err) {
      console.error("Failed to save autopsy form:", err);
      const message = err instanceof Error ? err.message : `Failed to save Autopsy Form ${f.id}`;
      toast.error(`Failed to save Autopsy Form ${f.id}: ${message}`);
      throw err;
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser: handleSetCurrentUser,
      users, addUser,
      patients, addPatient,
      mlefForms, saveMlefForm,
      mlrReports, saveMlrReport,
      labRequests, addLabRequest, updateLabRequest, linkLabRequest,
      pmrForms, savePmrForm,
      autopsyForms, saveAutopsyForm,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
