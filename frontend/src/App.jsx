import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { useEffect, useState } from "react";

import DashboardLayout from "./components/layout/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import ThreatDetection from "./pages/ThreatDetection";
import Agents from "./pages/Agents";
import Approvals from "./pages/Approvals";
import AuditLogs from "./pages/AuditLogs";
import LiveMonitoring from "./pages/LiveMonitoring";
import Settings from "./pages/Settings";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import APIKeys from "./pages/APIKeys";
import Files from "./pages/Files";
import Documentation from "./pages/Documentation";

// ---------------------------------------------
// AUTHENTICATION CHECK
// ---------------------------------------------

function isAuthenticated() {
  // Remember Me checked ho to localStorage,
  // unchecked ho to sessionStorage se token milega.
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  if (!token) {
    return false;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    const payload = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
    );

    // Agar expiry missing hai ya token expire ho gaya hai,
    // to session clear kar do.
    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("user");

      return false;
    }

    return true;
  } catch {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");

    return false;
  }
}

// ---------------------------------------------
// PROTECTED ROUTE
// ---------------------------------------------

function ProtectedRoute() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

// ---------------------------------------------
// PUBLIC ROUTE
// ---------------------------------------------

function PublicRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// ---------------------------------------------
// APP
// ---------------------------------------------

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes: sidebar nahi dikhega */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Protected routes: login required */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/threats" element={<ThreatDetection />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/monitoring" element={<LiveMonitoring />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/api-keys" element={<APIKeys />} />
            <Route path="/documentation" element={<Documentation />} />

            <Route path="/files" element={<Files />} />
          </Route>
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
