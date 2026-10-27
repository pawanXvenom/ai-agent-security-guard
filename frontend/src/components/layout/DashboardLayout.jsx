
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Desktop par sidebar open; mobile/tablet par closed.
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#080C14] text-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onClose={closeSidebar}
      />

      {/* Main application */}
      <div
        className={`flex h-screen min-w-0 flex-col transition-[margin] duration-300 ${
          sidebarOpen
            ? "ml-0 lg:ml-[260px]"
            : "ml-0 lg:ml-[76px]"
        }`}
      >
        {/* Navbar */}
        <div className="shrink-0">
          <Navbar onMenuClick={toggleSidebar} />
        </div>

        {/* Scrollable page content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="box-border min-w-0 p-4 sm:p-6 lg:p-8">
            <Outlet />

            <footer className="mt-8 flex flex-col gap-2 border-t border-slate-800 px-2 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 AgentGuard Security Platform</p>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Team SNAKE · Security Demo</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
