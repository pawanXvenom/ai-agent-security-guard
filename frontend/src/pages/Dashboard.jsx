import { useState } from "react";

import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Clock3,
  ArrowUpRight,
  RefreshCw,
  Radar,
  Terminal,
  FileWarning,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import PageHeader from "../components/common/PageHeader";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/dashboard/StatCard";

const initialEvents = [
  {
    id: "EVT-1042",
    type: "Prompt injection",
    source: "Customer support agent",
    severity: "critical",
    decision: "BLOCKED",
    time: "10:42:18",
    icon: FileWarning,
  },
  {
    id: "EVT-1041",
    type: "SQL injection pattern",
    source: "Database assistant",
    severity: "high",
    decision: "BLOCKED",
    time: "10:40:52",
    icon: Terminal,
  },
  {
    id: "EVT-1040",
    type: "Sensitive file access",
    source: "Document agent",
    severity: "medium",
    decision: "PENDING",
    time: "10:38:11",
    icon: KeyRound,
  },
  {
    id: "EVT-1039",
    type: "Unauthorized tool request",
    source: "Research agent",
    severity: "high",
    decision: "BLOCKED",
    time: "10:35:46",
    icon: ShieldAlert,
  },
  {
    id: "EVT-1038",
    type: "Policy validation",
    source: "Workflow agent",
    severity: "low",
    decision: "ALLOWED",
    time: "10:31:03",
    icon: CheckCircle2,
  },
];

const chartData = [
  { time: "09:00", threats: 3, blocked: 2 },
  { time: "09:30", threats: 5, blocked: 4 },
  { time: "10:00", threats: 4, blocked: 3 },
  { time: "10:30", threats: 8, blocked: 7 },
  { time: "11:00", threats: 6, blocked: 5 },
  { time: "11:30", threats: 11, blocked: 9 },
  { time: "12:00", threats: 7, blocked: 6 },
];

const protectionLayers = [
  {
    name: "Prompt Injection",
    description: "Instruction and jailbreak patterns",
    percent: 94,
    color: "bg-sky-400",
  },
  {
    name: "SQL Injection",
    description: "Suspicious database input patterns",
    percent: 97,
    color: "bg-violet-400",
  },
  {
    name: "Access Control",
    description: "Restricted tools and file access",
    percent: 99,
    color: "bg-emerald-400",
  },
  {
    name: "Data Protection",
    description: "Potential sensitive data exposure",
    percent: 91,
    color: "bg-amber-400",
  },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-[#101a29] p-3 shadow-xl">
      <p className="mb-2 text-xs text-slate-400">{label}</p>

      {payload.map((item) => (
        <p key={item.dataKey} className="mb-1 text-xs text-slate-200">
          <span style={{ color: item.color }}>●</span> {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [events, setEvents] = useState(initialEvents);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  function refreshDemo() {
    setEvents([...initialEvents]);
    setLastUpdated(new Date().toLocaleTimeString());
  }

  const blockedCount = events.filter(
    (event) => event.decision === "BLOCKED",
  ).length;

  const pendingCount = events.filter(
    (event) => event.decision === "PENDING",
  ).length;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="AI SECURITY OVERVIEW"
        title="Security Dashboard"
        description="Monitor AI agent activity, inspect potential threats, and review policy enforcement decisions."
        action={
          <button
            onClick={refreshDemo}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 text-xs font-semibold text-slate-200 transition hover:border-sky-400/40 hover:text-sky-300"
          >
            <RefreshCw size={15} />
            Refresh Demo
          </button>
        }
      />

      {/* System status banner */}
      <section className="relative overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-r from-sky-500/[0.12] via-[#102035] to-[#101827] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full bg-sky-400/[0.08] blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <ShieldCheck size={25} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Agent Security Center
                </h2>

                <StatusBadge status="info">DEMO MODE</StatusBadge>
              </div>

              <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400">
                Security events shown below are sample data. Live enforcement
                will be connected to the backend policy engine.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-300">
              Interface Ready
            </span>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Security Events"
          value="1,284"
          description="Sample total events"
          icon={Activity}
          color="sky"
        />

        <StatCard
          title="Threats Detected"
          value="48"
          description="Sample threat count"
          icon={ShieldAlert}
          color="rose"
        />

        <StatCard
          title="Actions Blocked"
          value="36"
          description="Sample policy decisions"
          icon={Ban}
          color="emerald"
        />

        <StatCard
          title="Pending Approvals"
          value={pendingCount}
          description="In this sample activity list"
          icon={Clock3}
          color="amber"
        />
      </section>

      {/* Charts and protection layers */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 rounded-2xl border border-slate-800 bg-[#0d1522] p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Threat Activity</h2>
              <p className="mt-1 text-xs text-slate-500">
                Sample threat events across the demo timeline
              </p>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Detected
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Blocked
              </span>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="threatFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="blockedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#243044"
                  strokeDasharray="3 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#718198", fontSize: 10 }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#718198", fontSize: 10 }}
                  allowDecimals={false}
                />

                <Tooltip content={<ChartTooltip />} />

                <Area
                  type="monotone"
                  dataKey="threats"
                  name="Detected"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#threatFill)"
                />

                <Area
                  type="monotone"
                  dataKey="blocked"
                  name="Blocked"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#blockedFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0d1522] p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                Protection Layers
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Illustrative coverage indicators
              </p>
            </div>

            <Radar size={19} className="text-sky-400" />
          </div>

          <div className="space-y-6">
            {protectionLayers.map((layer) => (
              <div key={layer.name}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-200">
                    {layer.name}
                  </span>

                  <span className="font-mono text-xs text-slate-400">
                    {layer.percent}%
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${layer.color}`}
                    style={{ width: `${layer.percent}%` }}
                  />
                </div>

                <p className="mt-2 text-[10px] text-slate-500">
                  {layer.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-400/15 bg-amber-400/[0.04] p-3">
            <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-300" />

            <p className="text-[10px] leading-5 text-slate-400">
              Coverage percentages are illustrative demo values, not measured
              security effectiveness.
            </p>
          </div>
        </div>
      </section>

      {/* Recent events */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1522]">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-white">
              Recent Security Events
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Example activity requiring inspection
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status="blocked">{blockedCount} Blocked</StatusBadge>

            <StatusBadge status="pending">{pendingCount} Pending</StatusBadge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40">
                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Event
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Source
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Severity
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Decision
                </th>

                <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Time
                </th>
              </tr>
            </thead>

            <tbody>
              {events.map((event) => {
                const EventIcon = event.icon;

                const severityStatus =
                  event.severity === "critical" || event.severity === "high"
                    ? "critical"
                    : event.severity === "medium"
                      ? "warning"
                      : "safe";

                const decisionStatus =
                  event.decision === "BLOCKED"
                    ? "blocked"
                    : event.decision === "PENDING"
                      ? "pending"
                      : "safe";

                return (
                  <tr
                    key={event.id}
                    className="border-b border-slate-800/70 transition hover:bg-slate-800/20 last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 text-sky-300">
                          <EventIcon size={17} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            {event.type}
                          </p>

                          <p className="mt-1 font-mono text-[10px] text-slate-500">
                            {event.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-400">
                      {event.source}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={severityStatus}>
                        {event.severity.toUpperCase()}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={decisionStatus}>
                        {event.decision}
                      </StatusBadge>
                    </td>

                    <td className="px-6 py-4 text-right font-mono text-[10px] text-slate-500">
                      {event.time}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-800 px-5 py-3 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Showing {events.length} sample events</span>

          <span className="flex items-center gap-1.5">
            <Clock3 size={12} />
            Last refreshed: {lastUpdated}
          </span>
        </div>
      </section>

      {/* Security principles */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Detect",
            text: "Inspect inputs and identify suspicious patterns.",
            icon: Radar,
            color: "text-sky-300",
          },
          {
            title: "Enforce",
            text: "Apply backend policy decisions before actions execute.",
            icon: ShieldCheck,
            color: "text-emerald-300",
          },
          {
            title: "Audit",
            text: "Record decisions and explanations for later review.",
            icon: Activity,
            color: "text-violet-300",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0d1522] p-4"
            >
              <Icon size={19} className={item.color} />

              <div>
                <h3 className="text-xs font-bold text-slate-200">
                  {item.title}
                </h3>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {item.text}
                </p>
              </div>

              <ArrowUpRight
                size={15}
                className="ml-auto shrink-0 text-slate-600"
              />
            </div>
          );
        })}
      </section>
    </div>
  );
}
