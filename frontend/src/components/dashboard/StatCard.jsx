export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = "sky",
  trend,
}) {
  const colors = {
    sky: {
      icon: "border-sky-400/20 bg-sky-400/10 text-sky-300",
      glow: "from-sky-400/[0.08]",
    },
    rose: {
      icon: "border-rose-400/20 bg-rose-400/10 text-rose-300",
      glow: "from-rose-400/[0.08]",
    },
    emerald: {
      icon: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      glow: "from-emerald-400/[0.08]",
    },
    amber: {
      icon: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      glow: "from-amber-400/[0.08]",
    },
    violet: {
      icon: "border-violet-400/20 bg-violet-400/10 text-violet-300",
      glow: "from-violet-400/[0.08]",
    },
  };

  const theme = colors[color] || colors.sky;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#111c2c] to-[#0c121e] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-700">
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${theme.glow} to-transparent blur-2xl`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">{title}</p>

          <p className="mt-4 font-mono text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>

        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${theme.icon}`}
          >
            <Icon size={21} strokeWidth={1.8} />
          </div>
        )}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2 text-[11px]">
        {trend && (
          <span className="font-semibold text-emerald-300">{trend}</span>
        )}

        {description && (
          <span className="text-slate-500">{description}</span>
        )}
      </div>
    </div>
  );
}