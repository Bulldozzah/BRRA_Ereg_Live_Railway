import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, Building2, Users, Newspaper, MessageSquare,
  HelpCircle, Image, FileCog, Shield, BookOpen, Bell, Search, LogOut, ChevronDown
} from "lucide-react";
import { mockAuth, MOCK_ADMIN_USER } from "@/lib/mockAuth";

const sections = [
  {
    label: "Overview",
    items: [
      { to: "/login-admin/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/login-admin/search", label: "Search", icon: Search },
    ],
  },
  {
    label: "eRegistry",
    items: [
      { to: "/login-admin/managelicenses", label: "Business Licenses", icon: FileText },
      { to: "/login-admin/manageagencies", label: "Issuing Authorities", icon: Building2 },
      { to: "/login-admin/managelocations", label: "Jurisdictions", icon: Building2 },
      { to: "/login-admin/manageindustries", label: "Industries", icon: BookOpen },
      { to: "/login-admin/managebusinesstypes", label: "Business Types", icon: BookOpen },
      { to: "/login-admin/manageactivities", label: "Business Activities", icon: BookOpen },
      { to: "/login-admin/manageworkflows", label: "Workflows", icon: FileCog },
    ],
  },
  {
    label: "Notice & Comment",
    items: [
      { to: "/login-admin/regulations/admin", label: "Regulations Dashboard", icon: LayoutDashboard },
      { to: "/login-admin/manageregulations", label: "Regulations", icon: FileText },
      { to: "/login-admin/managecomments", label: "Moderate Comments", icon: MessageSquare },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/login-admin/managenews", label: "News", icon: Newspaper },
      { to: "/login-admin/managepages", label: "Pages", icon: FileText },
      { to: "/login-admin/managefaq", label: "FAQs", icon: HelpCircle },
      { to: "/login-admin/managebanners", label: "Banners", icon: Image },
      { to: "/login-admin/managepolicy", label: "Policies", icon: Shield },
      { to: "/login-admin/managefeedback", label: "Feedback", icon: MessageSquare },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/login-admin/manageusers", label: "Users", icon: Users },
      { to: "/login-admin/managegroups", label: "Roles & Permissions", icon: Shield },
    ],
  },
];

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const user = mockAuth.getUser() ?? MOCK_ADMIN_USER;
  const handleLogout = () => {
    mockAuth.logout();
    navigate("/login-admin", { replace: true });
  };
  return (
    <div className="min-h-dvh bg-sand-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-sand-200 bg-sidebar sticky top-0 h-dvh overflow-y-auto">
        <Link to="/login-admin/admin/dashboard" className="flex items-center gap-2.5 px-6 h-20 border-b border-sand-200 shrink-0">
          <div className="size-7 rounded-full bg-gradient-to-br from-copper-500 to-copper-600" />
          <div className="flex flex-col leading-none">
            <span className="font-serif text-lg font-medium">eRegistry</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Admin Console</span>
          </div>
        </Link>
        <nav className="flex-1 py-4 px-3 space-y-6">
          {sections.map((s) => (
            <div key={s.label}>
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {s.label}
              </div>
              <div className="space-y-0.5">
                {s.items.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-copper-50 text-copper-600 font-medium"
                          : "text-foreground hover:bg-sand-100"
                      }`
                    }
                  >
                    <it.icon size={16} className="shrink-0" />
                    <span>{it.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-sand-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full px-3 py-2"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 h-16 border-b border-sand-200 bg-sand-50/90 backdrop-blur flex items-center px-6 gap-4">
          <div className="flex items-center flex-1 max-w-md bg-white border border-sand-200 rounded-full px-4 h-10">
            <Search size={16} className="text-muted-foreground mr-2" />
            <input
              placeholder="Search licenses, issuing authorities, users…"
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          <button className="relative p-2 rounded-full hover:bg-sand-100 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-copper-500" />
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-sand-200">
            <div className="size-8 rounded-full bg-gradient-to-br from-copper-500 to-copper-600 flex items-center justify-center text-white text-xs font-semibold">
              {user.initials}
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-[11px] text-muted-foreground">{user.role}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-md hover:bg-sand-100 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
};
