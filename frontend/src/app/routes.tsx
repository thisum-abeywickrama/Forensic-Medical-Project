import { createBrowserRouter, Navigate } from "react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoginPage } from "@/pages/LoginPage";
import { VerifyEmailPage } from "@/pages/VerifyEmailPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { PatientRegisterPage } from "@/pages/PatientRegisterPage";
import { MLEFListPage } from "@/pages/MLEFListPage";
import { MLEFFormPage } from "@/pages/MLEFFormPage";
import { MLRListPage } from "@/pages/MLRListPage";
import { MLRFormPage } from "@/pages/MLRFormPage";
import { PMRListPage } from "@/pages/PMRListPage";
import { PMRFormPage } from "@/pages/PMRFormPage";
import { AutopsyListPage } from "@/pages/AutopsyListPage";
import { AutopsyFormPage } from "@/pages/AutopsyFormPage";
import { LabRequestsPage } from "@/pages/LabRequestsPage";
import { DailyReportsPage } from "@/pages/DailyReportsPage";
import { MonthlyStatsPage } from "@/pages/MonthlyStatsPage";
import { StaffListPage } from "@/pages/StaffListPage";
import { StaffRegisterPage } from "@/pages/StaffRegisterPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/verify-email",
    Component: VerifyEmailPage,
  },
  {
    path: "/forgot-password",
    Component: ForgotPasswordPage,
  },
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true,                element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard",          Component: DashboardPage },
      { path: "patients",           Component: PatientsPage },
      { path: "patients/register",  Component: PatientRegisterPage },
      { path: "mlef",               Component: MLEFListPage },
      { path: "mlef/:id",           Component: MLEFFormPage },
      { path: "mlr",                Component: MLRListPage },
      { path: "mlr/:id",            Component: MLRFormPage },
      { path: "pmr",                Component: PMRListPage },
      { path: "pmr/:id",            Component: PMRFormPage },
      { path: "autopsy",            Component: AutopsyListPage },
      { path: "autopsy/:id",        Component: AutopsyFormPage },
      { path: "lab-requests",       Component: LabRequestsPage },
      { path: "staff",              Component: StaffListPage },
      { path: "staff/register",     Component: StaffRegisterPage },
      { path: "reports/daily",      Component: DailyReportsPage },
      { path: "reports/monthly",    Component: MonthlyStatsPage },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
