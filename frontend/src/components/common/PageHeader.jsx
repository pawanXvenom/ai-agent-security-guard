import { ShieldCheck } from "lucide-react";

export default function PageHeader({
  eyebrow = "SECURITY CENTER",
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[1.8px] text-sky-400">
          <ShieldCheck size={14} />
          {eyebrow}
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
