import { NavLink } from "react-router-dom";

import {
  ShieldCheck,
  LayoutDashboard,
  Radar,
  Bot,
  ClipboardCheck,
  ScrollText,
  Activity,
  Settings,
  KeyRound,
  BookOpen,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Live Monitoring",
        path: "/monitoring",
        icon: Activity,
      },
    ],
  },
  {
    title: "SECURITY",
    items: [
      {
        label: "Threat Detection",
        path: "/threats",
        icon: Radar,
      },
      {
        label: "AI Agents",
        path: "/agents",
        icon: Bot,
      },
      {
        label: "Approvals",
        path: "/approvals",
        icon: ClipboardCheck,
      },
      {
        label: "Audit Logs",
        path: "/audit-logs",
        icon: ScrollText,
      },
      {
        label: "API Keys",
        path: "/api-keys",
        icon: KeyRound,
      },
      {
        label: "API Documentation",
        path: "/documentation",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar({ isOpen, onToggle, onClose }) {
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        flex flex-col overflow-hidden
        border-r border-slate-800
        bg-[#0B111C]
        transition-[width,transform] duration-300 ease-in-out
        ${
          isOpen
            ? "w-[260px] translate-x-0"
            : "w-[260px] -translate-x-full lg:w-[76px] lg:translate-x-0"
        }
      `}
    >
      {/* Brand */}
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-800 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/10 text-sky-300">
          <ShieldCheck size={24} />
        </div>

        <div
          className={`min-w-0 flex-1 transition-opacity ${
            isOpen ? "opacity-100" : "lg:opacity-0"
          }`}
        >
          <h1 className="whitespace-nowrap text-lg font-bold tracking-tight">
            Agent<span className="text-sky-400">Guard</span>
          </h1>

          <p className="whitespace-nowrap text-[9px] font-semibold tracking-[1.5px] text-slate-500">
            AI SECURITY PLATFORM
          </p>
        </div>

        {/* Close button: mobile/tablet only */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Workspace */}
      <div className="shrink-0 px-3 pt-6">
        {isOpen && (
          <p className="mb-3 px-2 text-[10px] font-bold tracking-[1.5px] text-slate-500">
            WORKSPACE
          </p>
        )}

        <div
          className={`flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 ${
            !isOpen && "justify-center"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/30 to-blue-700/20 text-sm font-bold text-sky-200">
            S
          </div>

          {isOpen && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">
                Team SNAKE
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Security workspace
              </p>
            </div>
          )}

          {isOpen && (
            <ChevronRight size={15} className="shrink-0 text-slate-500" />
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 space-y-7 overflow-x-hidden overflow-y-auto px-3 py-7">
        {navigation.map((group) => (
          <div key={group.title}>
            {isOpen && (
              <p className="mb-3 px-2 text-[10px] font-bold tracking-[1.5px] text-slate-500">
                {group.title}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  title={!isOpen ? label : undefined}
                  onClick={() => {
                    // Automatically close the drawer on mobile.
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={({ isActive }) =>
                    `group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-xs font-medium transition-colors ${
                      !isOpen && "justify-center px-0"
                    } ${
                      isActive
                        ? "border border-sky-400/15 bg-sky-400/10 text-sky-300"
                        : "border border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-sky-400" />
                      )}

                      <Icon size={19} strokeWidth={1.8} />

                      {isOpen && <span>{label}</span>}

                      {isOpen && label === "Approvals" && (
                        <span className="ml-auto rounded-md bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-300">
                          3
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Protection status */}
      <div className="shrink-0 border-t border-slate-800 p-3">
        {isOpen && (
          <div className="mb-3 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-xs font-semibold text-emerald-300">
                Protection Active
              </span>
            </div>

            <p className="mt-2 text-[10px] text-slate-500">
              Demo interface status
            </p>
          </div>
        )}

        {/* Desktop collapse button */}
        <button
          type="button"
          onClick={onToggle}
          className="hidden min-h-10 w-full items-center justify-center gap-3 rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white lg:flex"
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? (
            <>
              <PanelLeftClose size={18} />
              <span className="text-xs">Collapse sidebar</span>
            </>
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </button>
      </div>
    </aside>
  );
}
