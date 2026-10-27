
import axios from "axios";

// ============================================================
// AXIOS CONFIGURATION
// Shared Axios instance for all AgentGuard frontend pages.
// ============================================================

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// ============================================================
// REQUEST INTERCEPTOR
// Automatically attaches the logged-in user's JWT token.
// ============================================================

api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR
// Handles unauthorized API responses.
// ============================================================

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear expired or invalid authentication data.
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");

            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("user");
        }

        return Promise.reject(error);
    }
);

// ============================================================
// AUTHENTICATION APIs
// ============================================================

// Signup Page: Registers a new user account using name, email, and password.
export const signupUser = async ({ name, email, password }) => {
    const response = await api.post("/api/v1/auth/signup", {
        name,
        email,
        password,
    });

    return response.data;
};

// Login Page: Authenticates a registered user using email and password.
export const loginUser = async ({ email, password }) => {
    const response = await api.post("/api/v1/auth/login", {
        email,
        password,
    });

    return response.data;
};

// ============================================================
// DASHBOARD APIs
// ============================================================

// Dashboard Page: Retrieves security statistics for summary cards and charts.
export const getAuditStats = async () => {
    const response = await api.get("/api/v1/audit-logs/stats");

    return response.data;
};

// Dashboard / Audit Logs Page: Retrieves recent security events with a configurable limit.
export const getAuditLogs = async (limit = 50) => {
    const response = await api.get("/api/v1/audit-logs", {
        params: { limit },
    });

    return response.data;
};

// ============================================================
// THREAT DETECTION APIs
// ============================================================

// Threat Detection Page: Sends text to the backend for potential threat analysis.
export const analyzeThreat = async (text) => {
    const response = await api.post("/api/v1/analyze", {
        text,
    });

    return response.data;
};

// ============================================================
// APPROVAL CENTER APIs
// ============================================================

// Approvals Page: Retrieves approval requests filtered by status.
export const getApprovals = async (status = "PENDING") => {
    const response = await api.get("/api/v1/approvals", {
        params: { status },
    });

    return response.data;
};

// Approvals Page: Approves or rejects a specific approval request.
export const decideApproval = async (approvalId, decision) => {
    const response = await api.post(
        `/api/v1/approvals/${approvalId}/decision`,
        { decision }
    );

    return response.data;
};

// ============================================================
// SANDBOX / FILE MANAGEMENT APIs
// ============================================================

// Sandbox / Files Page: Retrieves files available to the authenticated user.
export const getSandboxFiles = async () => {
    const response = await api.get("/api/v1/files");

    return response.data;
};

// Sandbox / Files Page: Requests the backend to read a specified sandbox resource.
export const readSandboxFile = async (resource) => {
    const response = await api.post("/api/v1/files/read", {
        resource,
    });

    return response.data;
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

// Shared Axios instance: Allows other pages to call additional backend endpoints.
export default api;
