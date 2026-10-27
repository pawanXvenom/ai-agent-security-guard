import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Bell,
  Search,
  ShieldCheck,
  Menu,
  ChevronDown,
  UserRound,
  Mail,
  Settings,
  LogOut,
  CircleUserRound,
  Check,
  X,
} from "lucide-react";

const pageNames = {
  "/dashboard": "Security Dashboard",
  "/monitoring": "Live Monitoring",
  "/threats": "Threat Detection",
  "/agents": "AI Agents",
  "/approvals": "Approval Center",
  "/audit-logs": "Audit Logs",
  "/settings": "Settings",
  "/api-keys": "API Key Management",
  "/documentation": "API Documentation",
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();

  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const pageTitle = pageNames[location.pathname] || "Security Center";

  // Read logged-in user details.
  const getLoggedInUser = () => {
    let storedUser = null;

    try {
      const rawUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");

      if (rawUser) {
        storedUser = JSON.parse(rawUser);
      }
    } catch {
      storedUser = null;
    }

    const name =
      storedUser?.name ||
      storedUser?.full_name ||
      storedUser?.fullName ||
      storedUser?.username ||
      storedUser?.email?.split("@")[0] ||
      "Security User";

    const email = storedUser?.email || "";

    const role =
      storedUser?.role ||
      storedUser?.user_role ||
      storedUser?.designation ||
      "Security Admin";

    return { name, email, role };
  };

  const user = getLoggedInUser();

  const getInitials = (name) => {
    const words = String(name || "U")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!words.length) return "U";

    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // Close menus when clicking outside or pressing Escape.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
        setSearchOpen(false);
        setLogoutConfirm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Close menus after changing pages.
  useEffect(() => {
    setProfileOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSettings = () => {
    setProfileOpen(false);
    navigate("/settings");
  };

  // Frontend logout: clear credentials and redirect to login.
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setProfileOpen(false);
    setLogoutConfirm(false);

    navigate("/login", { replace: true });
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchText.trim();
    if (!query) return;

    const searchablePages = [
      { title: "Security Dashboard", path: "/dashboard" },
      { title: "Live Monitoring", path: "/monitoring" },
      { title: "Threat Detection", path: "/threats" },
      { title: "AI Agents", path: "/agents" },
      { title: "Approval Center", path: "/approvals" },
      { title: "Audit Logs", path: "/audit-logs" },
      { title: "Settings", path: "/settings" },
      { title: "API Key Management", path: "/api-keys" },
      { title: "API Documentation", path: "/documentation" },
    ];

    const matchedPage = searchablePages.find((page) =>
      page.title.toLowerCase().includes(query.toLowerCase()),
    );

    if (matchedPage) {
      navigate(matchedPage.path);
      setSearchText("");
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[68px] w-full items-center justify-between gap-2 border-b border-slate-800/80 bg-[#080C14]/95 px-3 backdrop-blur-xl sm:h-[72px] sm:px-5 lg:px-8">
        {/* LEFT: Menu and page title */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <Menu size={19} />
          </button>

          <div className="min-w-0">
            <div className="hidden items-center gap-2 text-[10px] text-slate-500 sm:flex">
              <span>Workspace</span>
              <span className="text-slate-700">/</span>
              <span className="text-sky-400">Security Center</span>
            </div>

            <h2 className="truncate text-sm font-semibold tracking-tight text-slate-100 sm:mt-1 sm:text-base">
              {pageTitle}
            </h2>
          </div>
        </div>

        {/* RIGHT: Actions and user profile */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Environment status */}
          <div className="hidden items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-2 lg:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>

            <span className="text-[11px] font-medium text-emerald-300">
              Demo Environment
            </span>
          </div>

          {/* Search */}
          <div ref={searchRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setSearchOpen((open) => !open);
                setNotificationsOpen(false);
                setProfileOpen(false);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                searchOpen
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                  : "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900 hover:text-white"
              }`}
              aria-label="Search pages"
              title="Search pages"
              aria-expanded={searchOpen}
            >
              <Search size={18} />
            </button>

            {searchOpen && (
              <div className="absolute right-0 top-12 z-50 w-[min(320px,calc(100vw-24px))] rounded-2xl border border-slate-700/80 bg-[#101722] p-3 shadow-2xl shadow-black/40">
                <form onSubmit={handleSearch}>
                  <label
                    htmlFor="navbar-search"
                    className="mb-2 block text-xs font-medium text-slate-300"
                  >
                    Search workspace pages
                  </label>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#080C14] px-3 focus-within:border-sky-500/60">
                    <Search size={16} className="shrink-0 text-slate-500" />

                    <input
                      id="navbar-search"
                      autoFocus
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Dashboard, threats..."
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setSearchText("");
                        setSearchOpen(false);
                      }}
                      className="text-slate-500 hover:text-white"
                      aria-label="Close search"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-500">
                    Search matches available page names.
                  </p>

                  <button
                    type="submit"
                    className="mt-3 w-full rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-400"
                  >
                    Open matching page
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((open) => !open);
                setProfileOpen(false);
                setSearchOpen(false);
              }}
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                notificationsOpen
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                  : "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900 hover:text-white"
              }`}
              aria-label="Notifications"
              title="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell size={18} />

              <span className="absolute right-[7px] top-[6px] h-2 w-2 rounded-full border-2 border-[#080C14] bg-rose-400" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-12 z-50 w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-700/80 bg-[#101722] shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Notifications
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Workspace updates
                    </p>
                  </div>

                  <Bell size={17} className="text-sky-400" />
                </div>

                <div className="px-4 py-5 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400">
                    <Bell size={17} />
                  </div>

                  <p className="mt-3 text-sm font-medium text-slate-200">
                    No notifications loaded
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Connect this panel to your security events API to show real
                    notifications.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mx-0.5 hidden h-8 w-px bg-slate-800 sm:block" />

          {/* User profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((open) => !open);
                setNotificationsOpen(false);
                setSearchOpen(false);
              }}
              className={`group flex items-center gap-2 rounded-xl border p-1.5 pr-1.5 transition sm:gap-2.5 sm:pr-2 ${
                profileOpen
                  ? "border-sky-500/30 bg-sky-500/[0.08]"
                  : "border-transparent hover:border-slate-800 hover:bg-slate-900/80"
              }`}
              aria-label="Open user profile menu"
              aria-expanded={profileOpen}
              title="User profile"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-gradient-to-br from-sky-400/20 to-indigo-500/20 text-[11px] font-bold text-sky-200 sm:h-9 sm:w-9">
                {getInitials(user.name)}
              </div>

              <div className="hidden min-w-0 text-left sm:block">
                <p className="max-w-[130px] truncate text-xs font-semibold text-slate-100">
                  {user.name}
                </p>

                <p className="mt-0.5 max-w-[130px] truncate text-[10px] text-slate-500">
                  {user.role}
                </p>
              </div>

              <ChevronDown
                size={15}
                className={`hidden text-slate-500 transition-transform sm:block ${
                  profileOpen ? "rotate-180 text-sky-400" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-700/80 bg-[#101722] shadow-2xl shadow-black/50">
                {/* Profile heading */}
                <div className="relative overflow-hidden border-b border-slate-800 px-4 pb-4 pt-5">
                  <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-sky-500/[0.08] blur-2xl" />

                  <div className="relative flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-400/20 to-indigo-500/20 text-sm font-bold text-sky-200">
                      {getInitials(user.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-white">
                        {user.name}
                      </h3>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {user.email || "Email not available"}
                      </p>

                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-medium text-emerald-300">
                          Signed in
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User information */}
                <div className="space-y-1 p-2.5">
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                      <UserRound size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500">Full name</p>
                      <p className="truncate text-xs font-medium text-slate-200">
                        {user.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                      <Mail size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500">
                        Email address
                      </p>
                      <p className="break-all text-xs font-medium text-slate-200">
                        {user.email || "Not available"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                      <ShieldCheck size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500">Account role</p>
                      <p className="truncate text-xs font-medium text-slate-200">
                        {user.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-800 p-2.5">
                  <button
                    type="button"
                    onClick={handleSettings}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-slate-800/80 hover:text-white"
                  >
                    <Settings size={17} className="text-slate-400" />
                    <span className="flex-1 text-xs font-medium">
                      Account settings
                    </span>
                    <span className="text-slate-600">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogoutConfirm(true)}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl border border-rose-500/10 bg-rose-500/[0.04] px-3 py-2.5 text-left text-sm text-rose-300 transition hover:border-rose-500/25 hover:bg-rose-500/10"
                  >
                    <LogOut size={17} />
                    <span className="flex-1 text-xs font-semibold">
                      Sign out
                    </span>
                  </button>
                </div>

                <div className="border-t border-slate-800/80 px-4 py-2.5">
                  <p className="text-center text-[10px] text-slate-600">
                    AgentGuard Security Workspace
                  </p>
                </div>
              </div>
            )}
          </div>

          <ShieldCheck
            size={17}
            className="ml-0.5 hidden text-sky-400 xl:block"
          />
        </div>
      </header>

      {/* Logout confirmation modal */}
      {logoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setLogoutConfirm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#101722] p-5 shadow-2xl shadow-black/50 sm:p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
              <LogOut size={21} />
            </div>

            <h3
              id="logout-title"
              className="mt-4 text-lg font-semibold text-white"
            >
              Sign out of AgentGuard?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              You will be signed out of this session and redirected to the login
              page.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
