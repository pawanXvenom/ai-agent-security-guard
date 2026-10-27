import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  X,
  ShieldCheck,
  AlertCircle,
  FolderOpen,
  LoaderCircle,
  Copy,
  Check,
  LockKeyhole,
  Files as FilesIcon,
} from "lucide-react";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const getAuthToken = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("token") ||
  "";

const formatFileSize = (content) => {
  const bytes = new Blob([content]).size;

  if (bytes < 1024) return `${bytes} B`;

  return `${(bytes / 1024).toFixed(1)} KB`;
};

export default function Files() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [reading, setReading] = useState(false);
  const [copied, setCopied] = useState(false);

  const request = useCallback(async (endpoint, options = {}) => {
    const token = getAuthToken();

    if (!token) {
      throw new Error("Session not found. Please log in again.");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.reason ||
          "Unable to complete the request."
      );
    }

    return data;
  }, []);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await request("/api/v1/files");

      if (data.decision && data.decision !== "ALLOW") {
        throw new Error(
          data.reason || "File access was denied."
        );
      }

      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (err) {
      setFiles([]);
      setError(err.message || "Unable to load files.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return files;

    return files.filter((file) =>
      file.toLowerCase().includes(query)
    );
  }, [files, search]);

  const openFile = async (fileName) => {
    setReading(true);
    setError("");
    setSelectedFile(null);

    try {
      const data = await request("/api/v1/files/read", {
        method: "POST",
        body: JSON.stringify({ resource: fileName }),
      });

      if (data.decision !== "ALLOW") {
        throw new Error(
          data.reason || "File access was denied."
        );
      }

      setSelectedFile({
        name: fileName,
        content: data.content ?? "",
      });
    } catch (err) {
      setError(err.message || "Unable to read this file.");
    } finally {
      setReading(false);
    }
  };

  const copyContent = async () => {
    if (!selectedFile) return;

    try {
      await navigator.clipboard.writeText(
        selectedFile.content
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Unable to copy file content.");
    }
  };

  const getFileType = (fileName) => {
    const extension = fileName.split(".").pop();

    return fileName.includes(".")
      ? extension.toUpperCase()
      : "FILE";
  };

  return (
    <div className="min-h-full bg-[#080D16] p-4 text-slate-200 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* Breadcrumb and page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm">
              <FolderOpen size={15} className="text-slate-500" />

              <span className="text-slate-500">
                AgentGuard
              </span>

              <span className="text-slate-700">/</span>

              <span className="text-sky-400">Files</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              File Explorer
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Browse files and securely inspect their contents.
            </p>
          </div>

          <button
            type="button"
            onClick={loadFiles}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#263449] bg-[#0D1523] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-sky-500/40 hover:bg-[#121E30] hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />

            Refresh
          </button>
        </div>

        {/* Security banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4 sm:p-5">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">
            <ShieldCheck
              size={21}
              className="text-emerald-400"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-emerald-300">
              Protected file access
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              File requests are checked by the backend before
              their contents are returned.
            </p>
          </div>

          <LockKeyhole
            size={18}
            className="mt-1 hidden shrink-0 text-emerald-500/60 sm:block"
          />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Files count */}
          <div className="rounded-2xl border border-[#1E293B] bg-[#0D1523] p-5 transition hover:border-[#2B3D55] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Available files
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
                  {loading ? (
                    <span className="text-2xl text-slate-500">
                      —
                    </span>
                  ) : (
                    files.length
                  )}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Files returned by the backend
                </p>
              </div>

              <div className="rounded-xl border border-sky-500/15 bg-sky-500/10 p-3.5">
                <FilesIcon
                  size={24}
                  className="text-sky-400"
                />
              </div>
            </div>
          </div>

          {/* Security status */}
          <div className="rounded-2xl border border-[#1E293B] bg-[#0D1523] p-5 transition hover:border-[#2B3D55] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Security status
                </p>

                <p className="mt-3 text-2xl font-bold text-emerald-400">
                  Protected
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Sandbox path validation enabled
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/10 p-3.5">
                <ShieldCheck
                  size={24}
                  className="text-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* File explorer table */}
        <section className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0D1523] shadow-lg shadow-black/10">

          {/* Table heading and search */}
          <div className="flex flex-col gap-4 border-b border-[#1E293B] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Sandbox files
              </h2>

              <p className="mt-1.5 text-sm text-slate-400">
                Select a file to inspect its contents.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search files..."
                aria-label="Search files"
                className="w-full rounded-xl border border-[#263449] bg-[#080D16] py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-sky-500/60 focus:ring-4 focus:ring-sky-500/10"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-300 sm:mx-6">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  Unable to complete request
                </p>

                <p className="mt-1 break-words text-red-300/80">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
                className="rounded-lg p-1 text-red-300 transition hover:bg-red-500/10"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">

              <thead className="border-b border-[#1E293B] bg-[#0A111D]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-5 py-4 sm:px-6">
                    File name
                  </th>

                  <th className="px-5 py-4">
                    Type
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right sm:px-6">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E293B]/80">

                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-16 text-center"
                    >
                      <LoaderCircle
                        size={28}
                        className="mx-auto animate-spin text-sky-400"
                      />

                      <p className="mt-3 text-sm text-slate-400">
                        Loading files...
                      </p>
                    </td>
                  </tr>
                ) : filteredFiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#263449] bg-[#111C2D]">
                        <FolderOpen
                          size={27}
                          className="text-slate-500"
                        />
                      </div>

                      <p className="mt-4 font-semibold text-slate-200">
                        {search
                          ? "No matching files"
                          : "No files found"}
                      </p>

                      <p className="mt-1.5 text-sm text-slate-500">
                        {search
                          ? "Try a different search term."
                          : "Add supported files to the configured sandbox."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((fileName) => (
                    <tr
                      key={fileName}
                      className="transition-colors hover:bg-[#111C2D]/70"
                    >
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/15 bg-sky-500/[0.07]">
                            <FileText
                              size={19}
                              className="text-sky-400"
                            />
                          </div>

                          <span className="break-all text-sm font-medium text-slate-200">
                            {fileName}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-md border border-[#263449] bg-[#080D16] px-2 py-1 text-[11px] font-semibold tracking-wide text-slate-400">
                          {getFileType(fileName)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.07] px-2.5 py-1 text-xs font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Available
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right sm:px-6">
                        <button
                          type="button"
                          onClick={() => openFile(fileName)}
                          disabled={reading}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#263449] bg-[#111C2D] px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {!loading && files.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[#1E293B] bg-[#0A111D] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-300">
                  {filteredFiles.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-300">
                  {files.length}
                </span>{" "}
                files
              </p>

              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck
                  size={14}
                  className="text-emerald-400"
                />
                Sandbox protection enabled
              </span>
            </div>
          )}
        </section>
      </div>

      {/* File preview modal */}
      {selectedFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedFile(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="file-viewer-title"
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#263449] bg-[#0D1523] shadow-2xl shadow-black/40"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#1E293B] px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/15 bg-sky-500/10">
                  <FileText
                    size={20}
                    className="text-sky-400"
                  />
                </div>

                <div className="min-w-0">
                  <h2
                    id="file-viewer-title"
                    className="break-all text-sm font-semibold text-slate-100 sm:text-base"
                  >
                    {selectedFile.name}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatFileSize(selectedFile.content)}
                    {" · "}
                    Read-only preview
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={copyContent}
                  title="Copy file content"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#263449] bg-[#111C2D] px-3 py-2 text-sm text-slate-300 transition hover:border-sky-500/40 hover:text-sky-300"
                >
                  {copied ? (
                    <Check
                      size={16}
                      className="text-emerald-400"
                    />
                  ) : (
                    <Copy size={16} />
                  )}

                  <span className="hidden sm:inline">
                    {copied ? "Copied" : "Copy"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  aria-label="Close file viewer"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-[#1B293C] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* File content */}
            <pre className="min-h-48 flex-1 overflow-auto whitespace-pre-wrap break-words bg-[#070B12] p-4 font-mono text-xs leading-6 text-slate-300 sm:p-6 sm:text-sm">
              {selectedFile.content || "(This file is empty.)"}
            </pre>

            {/* Modal footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[#1E293B] px-4 py-3.5 sm:px-5">
              <span className="hidden text-xs text-slate-500 sm:block">
                File contents are displayed without editing.
              </span>

              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="ml-auto rounded-lg border border-[#263449] bg-[#152135] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-[#1C2B42]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File loading overlay */}
      {reading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-2xl border border-[#263449] bg-[#0D1523] px-5 py-4 shadow-2xl">
            <LoaderCircle
              size={21}
              className="animate-spin text-sky-400"
            />

            <span className="text-sm font-medium text-slate-200">
              Checking access and reading file...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
