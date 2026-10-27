const styles = {
  safe: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  blocked: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  critical: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  pending: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  info: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  neutral: "border-slate-700 bg-slate-800/70 text-slate-300",
};

export default function StatusBadge({
  status = "neutral",
  children,
  className = "",
}) {
  const variant = String(status).toLowerCase();

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 text-[10px] font-semibold ${
        styles[variant] || styles.neutral
      } ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children || status}
    </span>
  );
}
