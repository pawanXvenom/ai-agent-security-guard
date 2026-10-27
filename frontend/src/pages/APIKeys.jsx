import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import {
  Activity,
  AlertCircle,
  ArrowDownUp,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  X,
  Zap,
} from "lucide-react";

const ENVIRONMENTS = ["DEVELOPMENT", "STAGING", "PRODUCTION"];

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const getKeyId = (item) => item?.id ?? item?._id;

const getKeyName = (item) => item?.name || item?.key_name || "Unnamed key";

const getEnvironment = (item) =>
  String(item?.environment || "DEVELOPMENT").toUpperCase();

const getStatus = (item) => String(item?.status || "ACTIVE").toUpperCase();

const getMaskedKey = (item) =>
  item?.key_prefix
    ? `${item.key_prefix}••••••••`
    : item?.masked_key || "••••••••••••••••";

const formatDate = (value) => {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function StatCard({ title, value, subtitle, icon: Icon, accent }) {
  const accents = {
    sky: "border-sky-500/20 bg-sky-500/10 text-sky-300",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0D1420] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{title}</p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
            accents[accent]
          }`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toUpperCase();

  const active = normalized === "ACTIVE";
  const revoked =
    normalized === "REVOKED" ||
    normalized === "DISABLED" ||
    normalized === "INACTIVE";

  const classes = active
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : revoked
      ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
      : "border-amber-500/20 bg-amber-500/10 text-amber-300";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized || "UNKNOWN"}
    </span>
  );
}

function EnvironmentBadge({ environment }) {
  const normalized = String(environment || "").toUpperCase();

  const classes =
    normalized === "PRODUCTION"
      ? "border-violet-500/20 bg-violet-500/10 text-violet-300"
      : normalized === "STAGING"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
        : "border-sky-500/20 bg-sky-500/10 text-sky-300";

  return (
    <span
      className={`inline-flex rounded-lg border px-2 py-1 text-[10px] font-medium ${classes}`}
    >
      {normalized || "DEVELOPMENT"}
    </span>
  );
}

export default function APIKeys() {
  const navigate = useNavigate();

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [environmentFilter, setEnvironmentFilter] = useState("ALL");

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const [selectedKey, setSelectedKey] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const [keyName, setKeyName] = useState("");
  const [environment, setEnvironment] = useState("PRODUCTION");

  const [generatedSecret, setGeneratedSecret] = useState("");
  const [revealSecret, setRevealSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      // The backend must return only the authenticated user's API keys.
      const response = await api.get("/api/v1/api-keys");

      const data = response.data;

      const items = Array.isArray(data)
        ? data
        : data?.items || data?.api_keys || data?.results;

      if (!Array.isArray(items)) {
        throw new Error(
          "The API keys endpoint returned an unexpected response.",
        );
      }

      setKeys(items);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!actionError) return;

    const timer = window.setTimeout(() => {
      setActionError("");
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [actionError]);

  const activeCount = keys.filter(
    (item) => getStatus(item) === "ACTIVE",
  ).length;

  const revokedCount = keys.filter((item) =>
    ["REVOKED", "DISABLED", "INACTIVE"].includes(getStatus(item)),
  ).length;

  const filteredKeys = keys.filter((item) => {
    const searchable = [
      getKeyName(item),
      item?.key_prefix,
      item?.masked_key,
      getEnvironment(item),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchable.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || getStatus(item) === statusFilter;

    const matchesEnvironment =
      environmentFilter === "ALL" || getEnvironment(item) === environmentFilter;

    return matchesSearch && matchesStatus && matchesEnvironment;
  });

  const closeGenerateModal = () => {
    if (generating) return;

    setShowGenerateModal(false);
    setKeyName("");
    setEnvironment("PRODUCTION");
    setActionError("");
  };

  const handleGenerate = async (event) => {
    event.preventDefault();

    const trimmedName = keyName.trim();

    if (!trimmedName) {
      setActionError("Enter a name for this API key.");
      return;
    }

    if (trimmedName.length > 80) {
      setActionError("The key name must be 80 characters or fewer.");
      return;
    }

    setGenerating(true);
    setActionError("");
    setSuccessMessage("");
    setGeneratedSecret("");
    setCopied(false);

    try {
      const response = await api.post("/api/v1/api-keys", {
        name: trimmedName,
        environment,
      });

      const data = response.data;

      // Backend returns api_key as an object and secret_key as the actual secret.
      const secret = data?.secret_key || data?.secret || data?.key;

      if (typeof secret !== "string" || !secret) {
        throw new Error(
          "The key was created, but no secret was returned. Check the API response before generating another key.",
        );
      }

      setGeneratedSecret(secret);
      setRevealSecret(false);
      setCopied(false);
      setShowGenerateModal(false);
      setKeyName("");
      setEnvironment("PRODUCTION");

      // Refresh the API key list after successful creation.
      await loadKeys();

      setSuccessMessage(
        "API key generated. Copy the secret now; it may not be shown again.",
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (value) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setActionError(
        "Clipboard access failed. Use a secure HTTPS page or copy the key manually.",
      );
    }
  };

  const handleRevoke = async () => {
    if (!selectedKey) return;

    const id = getKeyId(selectedKey);

    if (id === undefined || id === null) {
      setActionError("This API key has no valid ID.");
      return;
    }

    setRevoking(true);
    setActionError("");

    try {
      await api.post(`/api/v1/api-keys/${encodeURIComponent(id)}/revoke`);

      setShowRevokeModal(false);
      setSelectedKey(null);

      setSuccessMessage("API key revoked successfully.");
      await loadKeys();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setRevoking(false);
    }
  };

  const clearGeneratedSecret = () => {
    setGeneratedSecret("");
    setRevealSecret(false);
    setCopied(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-6">
      {/* Page heading */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#111B2A] via-[#0D1420] to-[#0B111C] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-sky-500/[0.07] blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-300">
                <KeyRound size={17} />
              </div>

              <span className="text-[10px] font-bold tracking-[1.8px] text-sky-300">
                CREDENTIAL MANAGEMENT
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              API Key Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Create and manage API credentials for your applications and
              AI-powered security workflows.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadKeys}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setActionError("");
                setShowGenerateModal(true);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white shadow-lg shadow-sky-950/30 transition hover:bg-sky-400"
            >
              <Plus size={16} />
              Generate New Key
            </button>
          </div>
        </div>
      </section>

      {/* Alerts */}
      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4 sm:flex-row sm:items-start"
        >
          <AlertCircle size={18} className="shrink-0 text-rose-300" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-rose-200">
              Unable to load API keys
            </p>
            <p className="mt-1 break-words text-xs leading-5 text-rose-200/70">
              {loadError}
            </p>
          </div>

          <button
            type="button"
            onClick={loadKeys}
            className="self-start rounded-lg border border-rose-500/20 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-500/10"
          >
            Retry
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-300" />
          <p className="flex-1 break-words text-xs leading-5 text-rose-200">
            {actionError}
          </p>
          <button
            type="button"
            onClick={() => setActionError("")}
            aria-label="Dismiss error"
            className="text-rose-300 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4"
        >
          <CheckCircle2 size={18} className="shrink-0 text-emerald-300" />
          <p className="text-xs leading-5 text-emerald-200">{successMessage}</p>
        </div>
      )}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total API Keys"
          value={loading && keys.length === 0 ? "—" : keys.length}
          subtitle="Credentials in your account"
          icon={KeyRound}
          accent="sky"
        />

        <StatCard
          title="Active Keys"
          value={loading && keys.length === 0 ? "—" : activeCount}
          subtitle="Currently enabled"
          icon={ShieldCheck}
          accent="emerald"
        />

        <StatCard
          title="Revoked Keys"
          value={loading && keys.length === 0 ? "—" : revokedCount}
          subtitle="Disabled credentials"
          icon={ShieldAlert}
          accent="rose"
        />
      </section>

      {/* Key table */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0D1420]">
        <div className="border-b border-slate-800 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Your API Credentials
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Manage credentials associated with your account.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-auto">
              <div className="relative sm:col-span-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search keys..."
                  aria-label="Search API keys"
                  className="h-10 w-full rounded-xl border border-slate-800 bg-[#080C14] pl-9 pr-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-sky-500/50 sm:w-48"
                />
              </div>

              <div className="relative">
                <ArrowDownUp
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                  className="h-10 w-full appearance-none rounded-xl border border-slate-800 bg-[#080C14] pl-9 pr-8 text-xs text-slate-300 outline-none focus:border-sky-500/50"
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="REVOKED">Revoked</option>
                  <option value="DISABLED">Disabled</option>
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>

              <div className="relative">
                <select
                  value={environmentFilter}
                  onChange={(event) => setEnvironmentFilter(event.target.value)}
                  aria-label="Filter by environment"
                  className="h-10 w-full appearance-none rounded-xl border border-slate-800 bg-[#080C14] px-3 pr-8 text-xs text-slate-300 outline-none focus:border-sky-500/50"
                >
                  <option value="ALL">All environments</option>
                  {ENVIRONMENTS.map((item) => (
                    <option key={item} value={item}>
                      {item.charAt(0) + item.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {loading && keys.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center">
            <LoaderCircle size={25} className="animate-spin text-sky-400" />
            <p className="text-sm font-medium text-slate-300">
              Loading API keys...
            </p>
            <p className="text-xs text-slate-500">
              Retrieving credentials for your account.
            </p>
          </div>
        ) : loadError && keys.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <AlertCircle size={28} className="text-rose-300" />
            <p className="mt-3 text-sm font-medium text-slate-200">
              Your API keys could not be loaded
            </p>
            <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">
              Check your connection and authentication, then try again.
            </p>
            <button
              type="button"
              onClick={loadKeys}
              className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-400">
              <KeyRound size={24} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-white">
              {keys.length === 0 ? "No API keys yet" : "No matching API keys"}
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
              {keys.length === 0
                ? "Create your first API key to start connecting your applications to AgentGuard."
                : "Try changing your search or filters to find a key."}
            </p>

            {keys.length === 0 && (
              <button
                type="button"
                onClick={() => setShowGenerateModal(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sky-400"
              >
                <Plus size={15} />
                Generate your first key
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Key
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Environment
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Created
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Last Used
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80">
                  {filteredKeys.map((item) => {
                    const status = getStatus(item);
                    const active = status === "ACTIVE";

                    return (
                      <tr
                        key={getKeyId(item)}
                        className="transition hover:bg-slate-900/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-sky-300">
                              <KeyRound size={17} />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-48 truncate text-xs font-semibold text-slate-200">
                                {getKeyName(item)}
                              </p>

                              <p className="mt-1 font-mono text-[10px] text-slate-500">
                                {getMaskedKey(item)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <EnvironmentBadge
                            environment={getEnvironment(item)}
                          />
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-400">
                          {formatDate(item?.created_at || item?.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-400">
                          {formatDate(item?.last_used_at || item?.lastUsedAt)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={status} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setActionError("");
                                setSelectedKey(item);
                                setShowRevokeModal(true);
                              }}
                              disabled={!active}
                              title={
                                active
                                  ? "Revoke API key"
                                  : "This key is not active"
                              }
                              aria-label={`Revoke ${getKeyName(item)}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {filteredKeys.map((item) => {
                const status = getStatus(item);
                const active = status === "ACTIVE";

                return (
                  <article
                    key={getKeyId(item)}
                    className="rounded-xl border border-slate-800 bg-[#080C14]/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-sky-300">
                        <KeyRound size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-semibold text-slate-200">
                          {getKeyName(item)}
                        </h3>

                        <p className="mt-1 break-all font-mono text-[10px] text-slate-500">
                          {getMaskedKey(item)}
                        </p>
                      </div>

                      <StatusBadge status={status} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <EnvironmentBadge environment={getEnvironment(item)} />
                      <span className="text-[10px] text-slate-500">
                        Created:{" "}
                        {formatDate(item?.created_at || item?.createdAt)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                      <div>
                        <p className="text-[10px] text-slate-500">Last used</p>
                        <p className="mt-1 text-xs text-slate-300">
                          {formatDate(item?.last_used_at || item?.lastUsedAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!active}
                        onClick={() => {
                          setActionError("");
                          setSelectedKey(item);
                          setShowRevokeModal(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-500/20 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                        Revoke
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 border-t border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-[10px] text-slate-500">
            Showing {filteredKeys.length} of {keys.length} keys
          </p>

          <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck size={13} className="text-emerald-400" />
            Keys are scoped to your account
          </p>
        </div>
      </section>

      {/* Security guidance */}
      <section className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.035] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-300">
            <ShieldCheck size={18} />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-200">
              Protect your API credentials
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Keep secret keys private. Store them in a secure server-side
              secret manager, never commit them to source control, and revoke
              any key that may have been exposed.
            </p>
          </div>
        </div>
      </section>

      {/* Generate modal */}
      {showGenerateModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeGenerateModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="generate-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-slate-700 bg-[#101722] shadow-2xl shadow-black/50"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-300">
                  <KeyRound size={19} />
                </div>

                <div>
                  <h2
                    id="generate-title"
                    className="text-base font-semibold text-white"
                  >
                    Generate API Key
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Create a credential for your application.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeGenerateModal}
                disabled={generating}
                aria-label="Close generate form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="api-key-name"
                  className="mb-2 block text-xs font-medium text-slate-300"
                >
                  Key name <span className="text-rose-400">*</span>
                </label>

                <input
                  id="api-key-name"
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                  maxLength={80}
                  required
                  autoFocus
                  placeholder="e.g. Production API"
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#080C14] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500/60"
                />

                <p className="mt-1.5 text-[10px] text-slate-500">
                  Use a descriptive name so you can identify this key later.
                </p>
              </div>

              <div>
                <label
                  htmlFor="api-key-environment"
                  className="mb-2 block text-xs font-medium text-slate-300"
                >
                  Environment
                </label>

                <select
                  id="api-key-environment"
                  value={environment}
                  onChange={(event) => setEnvironment(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#080C14] px-3 text-sm text-slate-200 outline-none focus:border-sky-500/60"
                >
                  <option value="DEVELOPMENT">Development</option>
                  <option value="STAGING">Staging</option>
                  <option value="PRODUCTION">Production</option>
                </select>
              </div>

              <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.05] p-3.5">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert
                    size={17}
                    className="mt-0.5 shrink-0 text-amber-300"
                  />

                  <div>
                    <p className="text-xs font-semibold text-amber-200">
                      Secret key handling
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-amber-100/60">
                      The backend should generate a cryptographically secure
                      secret, store only its hash, and return the secret only
                      once. Do not share or commit it.
                    </p>
                  </div>
                </div>
              </div>

              {actionError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-xs leading-5 text-rose-200"
                >
                  {actionError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeGenerateModal}
                  disabled={generating}
                  className="h-10 rounded-xl border border-slate-700 px-4 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={generating || !keyName.trim()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <LoaderCircle size={15} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      Generate Key
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated secret modal */}
      {generatedSecret && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="generated-secret-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-emerald-500/20 bg-[#101722] shadow-2xl shadow-black/50"
          >
            <div className="border-b border-slate-800 p-5 sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                <CheckCircle2 size={22} />
              </div>

              <h2
                id="generated-secret-title"
                className="mt-4 text-lg font-semibold text-white"
              >
                API key generated
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Copy and save this secret in a secure location. For security,
                you should not be able to retrieve the full secret again.
              </p>
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              <label
                htmlFor="generated-secret"
                className="block text-xs font-medium text-slate-300"
              >
                Your secret key
              </label>

              <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-700 bg-[#080C14]">
                <input
                  id="generated-secret"
                  type={revealSecret ? "text" : "password"}
                  readOnly
                  value={generatedSecret}
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-xs text-emerald-200 outline-none"
                />

                <button
                  type="button"
                  onClick={() => setRevealSecret((value) => !value)}
                  aria-label={
                    revealSecret ? "Hide secret key" : "Reveal secret key"
                  }
                  className="shrink-0 px-3 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  {revealSecret ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(generatedSecret)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/15"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied to clipboard" : "Copy API key"}
              </button>

              <div className="flex items-start gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] p-3">
                <AlertCircle
                  size={15}
                  className="mt-0.5 shrink-0 text-amber-300"
                />
                <p className="text-[11px] leading-5 text-amber-200/80">
                  Do not put this secret in frontend source code, public
                  repositories, screenshots, or client-side application
                  configuration.
                </p>
              </div>

              <button
                type="button"
                onClick={clearGeneratedSecret}
                className="mt-2 h-10 w-full rounded-xl bg-emerald-500 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                I have saved my key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke confirmation modal */}
      {showRevokeModal && selectedKey && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !revoking) {
              setShowRevokeModal(false);
              setSelectedKey(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-title"
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#101722] p-5 shadow-2xl shadow-black/50 sm:p-6"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
              <ShieldAlert size={21} />
            </div>

            <h2
              id="revoke-title"
              className="mt-4 text-base font-semibold text-white"
            >
              Revoke this API key?
            </h2>

            <p className="mt-2 break-words text-sm leading-6 text-slate-400">
              You are about to revoke{" "}
              <span className="font-semibold text-slate-200">
                {getKeyName(selectedKey)}
              </span>
              . Applications using this key may stop working. This action should
              not be reversible.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={revoking}
                onClick={() => {
                  setShowRevokeModal(false);
                  setSelectedKey(null);
                }}
                className="h-10 rounded-xl border border-slate-700 px-4 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={revoking}
                onClick={handleRevoke}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-50"
              >
                {revoking ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Revoke Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
