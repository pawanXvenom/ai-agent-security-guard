import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  KeyRound,
  Menu,
  Search,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

const sections = [
  { id: "getting-started", label: "Getting started", group: "GUIDE" },
  { id: "authentication", label: "Authentication", group: "GUIDE" },
  { id: "quickstart-python", label: "Python", group: "QUICKSTARTS" },
  { id: "quickstart-javascript", label: "JavaScript", group: "QUICKSTARTS" },
  { id: "analyze", label: "Analyze text", group: "ENDPOINTS" },
  { id: "check-action", label: "Check an action", group: "ENDPOINTS" },
  { id: "errors", label: "Errors & troubleshooting", group: "REFERENCE" },
];

const pythonExample = `import os
import requests

API_BASE_URL = os.getenv("AGENTGUARD_BASE_URL", "${API_BASE_URL}")
API_KEY = os.environ["AGENTGUARD_API_KEY"]

response = requests.post(
    f"{API_BASE_URL}/api/v1/analyze",
    headers={"X-API-Key": API_KEY},
    json={"text": "Please review this untrusted input"},
    timeout=15,
)
response.raise_for_status()
print(response.json())`;

const javascriptExample = `const API_BASE_URL =
  process.env.AGENTGUARD_BASE_URL || "${API_BASE_URL}";
const API_KEY = process.env.AGENTGUARD_API_KEY;

if (!API_KEY) {
  throw new Error("Set the AGENTGUARD_API_KEY environment variable");
}

const response = await fetch(API_BASE_URL + "/api/v1/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  },
  body: JSON.stringify({ text: "Please review this untrusted input" }),
});

const result = await response.json();
if (!response.ok) {
  throw new Error(result.detail || ("Request failed: " + response.status));
}
console.log(result);`;

const checkActionPython = `import os
import requests

base_url = os.getenv("AGENTGUARD_BASE_URL", "${API_BASE_URL}")
api_key = os.environ["AGENTGUARD_API_KEY"]

response = requests.post(
    f"{base_url}/api/v1/check-action",
    headers={"X-API-Key": api_key},
    json={
        "action": "send_email",
        "resource": "customer-report",
        "destination": "external-recipient@example.com",
        "payload": "Contains report data",
    },
    timeout=15,
)
response.raise_for_status()
print(response.json())`;

const checkActionJS = `const response = await fetch(
  (process.env.AGENTGUARD_BASE_URL || "http://localhost:8000") + "/api/v1/check-action",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.AGENTGUARD_API_KEY,
    },
    body: JSON.stringify({
      action: "send_email",
      resource: "customer-report",
      destination: "external-recipient@example.com",
      payload: "Contains report data",
    }),
  }
);

const result = await response.json();
if (!response.ok) throw new Error(result.detail || "Request failed");
console.log(result);`;

function CodeBlock({ code, language = "javascript" }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-[#080e18]">
      <div className="flex items-center justify-between border-b border-slate-700/70 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Code2 size={15} className="text-sky-400" />
          <span>{language}</span>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-sky-500/60 hover:text-white"
          aria-label="Copy code"
        >
          {copied ? (
            <Check size={13} className="text-emerald-400" />
          ) : (
            <Copy size={13} />
          )}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MethodBadge({ method = "POST" }) {
  const styles =
    method === "GET"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : "border-sky-500/30 bg-sky-500/10 text-sky-300";
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 font-mono text-[11px] font-bold ${styles}`}
    >
      {method}
    </span>
  );
}

function Endpoint({ method, path, description, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-[#0c1421]">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-700/70 px-4 py-4 sm:px-5">
        <MethodBadge method={method} />
        <code className="break-all text-sm font-semibold text-slate-100">
          {path}
        </code>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <p className="text-sm leading-6 text-slate-400">{description}</p>
        {children}
      </div>
    </div>
  );
}

function JsonBlock({ children }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-[#080e18] p-4 text-xs leading-6 text-emerald-200">
      <code>{children}</code>
    </pre>
  );
}

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredSections = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sections;
    return sections.filter((section) =>
      `${section.label} ${section.group}`.toLowerCase().includes(term),
    );
  }, [search]);

  function navigateTo(id) {
    setActiveSection(id);
    setMobileMenuOpen(false);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const sidebar = (
    <>
      <div className="mb-5 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
          <BookOpen size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">API Reference</p>
          <p className="text-xs text-slate-500">AgentGuard v1.0.0</p>
        </div>
      </div>
      <label className="mb-6 flex items-center gap-2 rounded-lg border border-slate-700 bg-[#080e18] px-3 py-2.5">
        <Search size={15} className="shrink-0 text-slate-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search documentation"
          className="min-w-0 flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600"
        />
        {search && (
          <button onClick={() => setSearch("")} aria-label="Clear search">
            <X size={13} className="text-slate-500" />
          </button>
        )}
      </label>
      <nav className="space-y-6">
        {["GUIDE", "QUICKSTARTS", "ENDPOINTS", "REFERENCE"].map((group) => {
          const items = filteredSections.filter((item) => item.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.18em] text-slate-600">
                {group}
              </p>
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${activeSection === item.id ? "border border-sky-400/15 bg-sky-400/10 text-sky-300" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"}`}
                  >
                    <span>{item.label}</span>
                    {activeSection === item.id && <ChevronRight size={14} />}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="mt-8 rounded-xl border border-slate-800 bg-[#080e18] p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-200">
          <ShieldCheck size={15} className="text-emerald-400" /> Keep your key
          safe
        </div>
        <p className="text-xs leading-5 text-slate-500">
          Never expose secret API keys in browser-side code, public
          repositories, or client applications.
        </p>
      </div>
    </>
  );

  return (
    <div className="min-h-full bg-[#080e18] text-slate-100">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[270px] shrink-0 overflow-y-auto border-r border-slate-800/90 bg-[#0a111d] p-5 lg:block">
          {sidebar}
        </aside>

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/90 bg-[#080e18]/95 px-5 py-3 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg border border-slate-700 p-2 text-slate-300 lg:hidden"
                aria-label="Open documentation menu"
              >
                <Menu size={17} />
              </button>
              <span className="text-xs text-slate-500">
                AgentGuard <span className="mx-1.5">/</span>{" "}
                <span className="text-slate-300">API Documentation</span>
              </span>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              API v1
            </span>
          </div>

          <div className="mx-auto max-w-5xl px-5 py-9 sm:px-8 sm:py-12">
            <div className="mb-10 border-b border-slate-800 pb-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/5 px-3 py-1.5 text-xs font-medium text-sky-300">
                <Terminal size={14} /> Developer documentation
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                AgentGuard API
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Protect AI agent workflows with AgentGuard's threat analysis and
                action policy endpoints. Use the examples below to connect your
                Python or JavaScript application.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-[#0c1421] p-4">
                  <p className="text-xs text-slate-500">API version</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    v1.0.0
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0c1421] p-4">
                  <p className="text-xs text-slate-500">Default local URL</p>
                  <p className="mt-1 break-all font-mono text-xs text-sky-300">
                    {API_BASE_URL}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0c1421] p-4">
                  <p className="text-xs text-slate-500">Authentication</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    API key header
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-5 text-amber-100/80">
                <KeyRound
                  size={16}
                  className="mt-0.5 shrink-0 text-amber-300"
                />
                <p>
                  <strong className="text-amber-200">
                    Backend setup required:
                  </strong>{" "}
                  these integration examples use the{" "}
                  <code className="rounded bg-black/20 px-1">X-API-Key</code>{" "}
                  header. They will work only after API-key verification is
                  added to the backend and the relevant endpoints are protected.
                </p>
              </div>
            </div>

            <section id="getting-started" className="scroll-mt-24 mb-12">
              <SectionHeading
                eyebrow="OVERVIEW"
                title="Getting started"
                description="Create a key in the AgentGuard dashboard, store it securely, and make your first request."
              />
              <ol className="mt-5 space-y-4">
                {[
                  [
                    "Create an API key",
                    "Open API Keys in the dashboard, create a key, and copy its secret immediately. The secret is shown only once.",
                  ],
                  [
                    "Store it as an environment variable",
                    "Keep the key outside source code. Do not commit .env files or paste keys into public issues.",
                  ],
                  [
                    "Send your first request",
                    "Send JSON to an endpoint with Content-Type: application/json and your key in X-API-Key.",
                  ],
                ].map(([title, body], index) => (
                  <li key={title} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/10 text-xs font-bold text-sky-300">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6">
                <CodeBlock
                  language="bash"
                  code={`# Linux / macOS\nexport AGENTGUARD_API_KEY="your-secret-key"\nexport AGENTGUARD_BASE_URL="${API_BASE_URL}"\n\n# Windows PowerShell\n$env:AGENTGUARD_API_KEY="your-secret-key"\n$env:AGENTGUARD_BASE_URL="${API_BASE_URL}"`}
                />
              </div>
            </section>

            <section id="authentication" className="scroll-mt-24 mb-12">
              <SectionHeading
                eyebrow="SECURITY"
                title="Authentication"
                description="For external integrations, send your API key in the X-API-Key request header."
              />
              <CodeBlock
                language="http"
                code={`POST /api/v1/analyze HTTP/1.1\nHost: localhost:8000\nContent-Type: application/json\nX-API-Key: ag_your_secret_key\n\n{"text":"Review this input"}`}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoCard
                  title="Do"
                  items={[
                    "Use environment variables or a secret manager.",
                    "Use separate keys for development and production.",
                    "Revoke a key immediately if it may be exposed.",
                  ]}
                />
                <InfoCard
                  title="Don't"
                  items={[
                    "Never expose a secret in frontend/browser code.",
                    "Never commit keys to Git.",
                    "Never send keys in URL query parameters.",
                  ]}
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Dashboard management endpoints such as{" "}
                <code>/api/v1/api-keys</code> currently use the dashboard's JWT
                Bearer token. The <code>X-API-Key</code> header is intended for
                API integrations after the backend verification dependency is
                implemented.
              </p>
            </section>

            <section id="quickstart-python" className="scroll-mt-24 mb-12">
              <SectionHeading
                eyebrow="QUICKSTART"
                title="Python integration"
                description="Install the requests package, configure your environment variables, and call the analysis endpoint."
              />
              <div className="my-5">
                <CodeBlock
                  language="bash"
                  code="python -m pip install requests"
                />
              </div>
              <CodeBlock language="python" code={pythonExample} />
              <p className="mt-3 text-xs leading-5 text-slate-500">
                The example raises an exception for HTTP error responses and
                uses a 15-second timeout to avoid waiting indefinitely.
              </p>
            </section>

            <section id="quickstart-javascript" className="scroll-mt-24 mb-12">
              <SectionHeading
                eyebrow="QUICKSTART"
                title="JavaScript integration"
                description="This example uses the built-in fetch API in Node.js 18+ or another JavaScript runtime that supports fetch."
              />
              <CodeBlock language="javascript" code={javascriptExample} />
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Keep this example on a trusted server. Do not bundle a secret
                API key into a React/Vite browser application.
              </p>
            </section>

            <section id="analyze" className="scroll-mt-24 mb-12">
              <SectionHeading
                eyebrow="ENDPOINT REFERENCE"
                title="Analyze text"
                description="Submit text for rule-based threat analysis. The request body must contain a non-empty text field with a maximum length of 10,000 characters."
              />
              <Endpoint
                method="POST"
                path="/api/v1/analyze"
                description="Analyzes the supplied text and returns the result from AgentGuard's analysis engine. The precise response fields depend on the security_engine implementation."
              >
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Request body
                </h4>
                <JsonBlock>{`{\n  "text": "Please review this untrusted input"\n}`}</JsonBlock>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Python example
                </h4>
                <CodeBlock language="python" code={pythonExample} />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  JavaScript example
                </h4>
                <CodeBlock language="javascript" code={javascriptExample} />
              </Endpoint>
            </section>

            <section id="check-action" className="scroll-mt-24 mb-12">
              <SectionHeading
                eyebrow="ENDPOINT REFERENCE"
                title="Check an action"
                description="Evaluate a proposed agent action against the configured security policy. Actions that require approval can return an approval identifier and pending status."
              />
              <Endpoint
                method="POST"
                path="/api/v1/check-action"
                description="Accepts action, resource, destination, and payload fields. Action is required; the other fields default to empty strings if omitted."
              >
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Request body
                </h4>
                <JsonBlock>{`{\n  "action": "send_email",\n  "resource": "customer-report",\n  "destination": "external-recipient@example.com",\n  "payload": "Contains report data"\n}`}</JsonBlock>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Python
                    </h4>
                    <CodeBlock language="python" code={checkActionPython} />
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      JavaScript
                    </h4>
                    <CodeBlock language="javascript" code={checkActionJS} />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#080e18] p-4">
                  <p className="mb-2 text-xs font-semibold text-slate-300">
                    Possible approval-required response shape
                  </p>
                  <JsonBlock>{`{\n  "decision": "REQUIRE_APPROVAL",\n  "approval_id": 123,\n  "approval_status": "PENDING",\n  "message": "Action requires approval before it can proceed."\n}`}</JsonBlock>
                  <p className="mt-2 text-xs text-slate-500">
                    Illustrative example based on the route's approval branch;
                    other fields may be returned by the policy engine.
                  </p>
                </div>
              </Endpoint>
            </section>

            <section id="errors" className="scroll-mt-24 mb-12">
              <SectionHeading
                eyebrow="REFERENCE"
                title="Errors & troubleshooting"
                description="Check the HTTP status and response body when a request fails."
              />
              <div className="overflow-hidden rounded-xl border border-slate-800">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-[#0c1421] text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Meaning</th>
                      <th className="px-4 py-3">What to check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="px-4 py-3 font-mono text-amber-300">
                        400
                      </td>
                      <td className="px-4 py-3">Bad request</td>
                      <td className="px-4 py-3 text-slate-400">
                        Review the endpoint's expected inputs.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-rose-300">401</td>
                      <td className="px-4 py-3">
                        Missing or invalid credentials
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        Confirm the key is set correctly and sent in X-API-Key.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-rose-300">403</td>
                      <td className="px-4 py-3">
                        Credential or account not permitted
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        Check account status and key status.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-amber-300">
                        422
                      </td>
                      <td className="px-4 py-3">Request validation failed</td>
                      <td className="px-4 py-3 text-slate-400">
                        Check required fields, types, and length limits.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-rose-300">429</td>
                      <td className="px-4 py-3">Rate limit exceeded</td>
                      <td className="px-4 py-3 text-slate-400">
                        Retry later with backoff if rate limiting is configured.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-rose-300">5xx</td>
                      <td className="px-4 py-3">Server-side error</td>
                      <td className="px-4 py-3 text-slate-400">
                        Check the AgentGuard backend logs and service health.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-xl border border-slate-800 bg-[#0c1421] p-4">
                <p className="text-sm font-semibold text-slate-200">
                  Validation example
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  FastAPI/Pydantic validation errors commonly return HTTP 422
                  with a <code className="text-sky-300">detail</code> field
                  describing which input failed validation.
                </p>
                <JsonBlock>{`{\n  "detail": [\n    {\n      "loc": ["body", "text"],\n      "msg": "Field required",\n      "type": "missing"\n    }\n  ]\n}`}</JsonBlock>
              </div>
            </section>

            <footer className="flex flex-col gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>AgentGuard API Documentation · v1.0.0</span>
              <a
                href={`${API_BASE_URL}/docs`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sky-300 transition hover:text-sky-200"
              >
                Open FastAPI interactive docs <ExternalLink size={12} />
              </a>
            </footer>
          </div>
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute inset-y-0 left-0 w-[290px] overflow-y-auto border-r border-slate-800 bg-[#0a111d] p-5">
            <div className="mb-5 flex justify-end">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-slate-700 p-2 text-slate-300"
                aria-label="Close documentation menu"
              >
                <X size={16} />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-sky-400">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function InfoCard({ title, items }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0c1421] p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-xs leading-5 text-slate-400"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
