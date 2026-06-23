import { NavLink, useNavigate } from "react-router";
import {
  Activity, Users, ClipboardList, FileText, Clipboard,
  BookOpen, FlaskConical, LogOut, Plus, Calendar, BarChart2, User,
} from "lucide-react";
import { cls } from "@/lib/utils";
import type { AppUser, Role } from "@/types";

interface NavItem { to: string; label: string; icon: React.ReactNode }

const DOCTOR_NAV: NavItem[] = [
  { to: "/dashboard",           label: "Dashboard",        icon: <Activity size={16} /> },
  { to: "/patients",            label: "Patients",         icon: <Users size={16} /> },
  { to: "/patients/register",   label: "Register Patient", icon: <Plus size={16} /> },
  { to: "/mlef",                label: "MLEF Forms",       icon: <ClipboardList size={16} /> },
  { to: "/mlr",              label: "MLR Reports",      icon: <FileText size={16} /> },
  { to: "/autopsy",          label: "Autopsy Forms",    icon: <Clipboard size={16} /> },
  { to: "/lab-requests",     label: "Lab Requests",     icon: <FlaskConical size={16} /> },
  { to: "/reports/daily",    label: "Daily Case Report",icon: <Calendar size={16} /> },
  { to: "/reports/monthly",  label: "Monthly Statistics", icon: <BarChart2 size={16} /> },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/dashboard",        label: "Dashboard",          icon: <Activity size={16} /> },
  { to: "/patients/register",label: "Register Patient",   icon: <Plus size={16} /> },
  { to: "/patients",         label: "Patient Records",    icon: <Users size={16} /> },
  { to: "/staff",            label: "Staff Management",   icon: <User size={16} /> },
  { to: "/mlef",             label: "MLEF Forms",         icon: <ClipboardList size={16} /> },
  { to: "/mlr",              label: "MLR Reports",        icon: <FileText size={16} /> },
  { to: "/autopsy",          label: "Autopsy Forms",      icon: <Clipboard size={16} /> },
  { to: "/lab-requests",     label: "Lab Reports",        icon: <FlaskConical size={16} /> },
  { to: "/reports/daily",    label: "Daily Case Report",  icon: <Calendar size={16} /> },
  { to: "/reports/monthly",  label: "Monthly Statistics", icon: <BarChart2 size={16} /> },
];

const LAB_NAV: NavItem[] = [
  { to: "/dashboard",    label: "Dashboard",    icon: <Activity size={16} /> },
  { to: "/lab-requests", label: "Lab Requests", icon: <FlaskConical size={16} /> },
];

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  doctor: DOCTOR_NAV,
  admin:  ADMIN_NAV,
  lab:    LAB_NAV,
};

const ROLE_COLORS: Record<Role, string> = {
  doctor: "bg-blue-500",
  admin:  "bg-slate-500",
  lab:    "bg-emerald-500",
};

interface SidebarProps {
  user: AppUser;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user.role];

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <aside className="w-56 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-screen">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={18} className="text-blue-400" />
          <span className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-family-heading)" }}>FMD System</span>
        </div>
        <p className="text-xs text-slate-500">Medico-Legal Records</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) => cls(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors",
              isActive
                ? "bg-sidebar-primary text-white font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2 mb-2">
          <div className={cls("w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0", ROLE_COLORS[user.role])}>
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user.name}</div>
            <div className="text-xs text-slate-500 truncate">{user.designation}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-sidebar-accent transition-colors text-sm"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
