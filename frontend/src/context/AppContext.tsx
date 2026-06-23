import { createContext, useContext, useState } from "react";
import type { AppUser, Patient, MLEFForm, MLRReport, LabRequest, PMRForm } from "@/types";
import { USERS, INIT_PATIENTS, INIT_MLEF, INIT_LAB } from "@/data/mockData";

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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>(USERS);
  const [patients, setPatients] = useState<Patient[]>(INIT_PATIENTS);
  const [mlefForms, setMlefForms] = useState<MLEFForm[]>(INIT_MLEF);
  const [mlrReports, setMlrReports] = useState<MLRReport[]>([]);
  const [labRequests, setLabRequests] = useState<LabRequest[]>(INIT_LAB);
  const [pmrForms, setPmrForms] = useState<PMRForm[]>([]);

  const addUser = (u: AppUser) => setUsers(prev => [...prev, u]);
  const addPatient = (p: Patient) => setPatients(prev => [...prev, p]);

  const saveMlefForm = (f: MLEFForm) =>
    setMlefForms(prev => prev.some(x => x.id === f.id) ? prev.map(x => x.id === f.id ? f : x) : [...prev, f]);

  const saveMlrReport = (r: MLRReport) =>
    setMlrReports(prev => prev.some(x => x.id === r.id) ? prev.map(x => x.id === r.id ? r : x) : [...prev, r]);

  const addLabRequest = (r: LabRequest) => setLabRequests(prev => [...prev, r]);

  const updateLabRequest = (id: string, data: Partial<LabRequest>) =>
    setLabRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));

  const linkLabRequest = (formType: string, formId: string, labRequestId: string) => {
    if (formType === "mlef")
      setMlefForms(prev => prev.map(f => f.id === formId ? { ...f, labRequestId } : f));
    else if (formType === "mlr")
      setMlrReports(prev => prev.map(r => r.id === formId ? { ...r, labRequestId } : r));
    else if (formType === "pmr")
      setPmrForms(prev => prev.map(f => f.id === formId ? { ...f, labRequestId } : f));
  };

  const savePmrForm = (f: PMRForm) =>
    setPmrForms(prev => prev.some(x => x.id === f.id) ? prev.map(x => x.id === f.id ? f : x) : [...prev, f]);

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      users, addUser,
      patients, addPatient,
      mlefForms, saveMlefForm,
      mlrReports, saveMlrReport,
      labRequests, addLabRequest, updateLabRequest, linkLabRequest,
      pmrForms, savePmrForm,
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
