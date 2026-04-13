import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function KpiCard({
  label,
  value,
  delta,
  icon,
  tone = "teal",
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: { value: string; positive?: boolean };
  icon?: ReactNode;
  tone?: "teal" | "info" | "warning" | "critical" | "success";
}) {
  const tones = {
    teal: "bg-teal-soft text-teal",
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    critical: "bg-critical-soft text-critical",
    success: "bg-success-soft text-success",
  };
  return (
    <div className="bg-surface rounded-lg border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray">{label}</p>
          <p className="text-3xl font-semibold text-ink mt-2 font-mono-data">{value}</p>
          {delta && (
            <p className={cn("text-[11px] mt-1.5", delta.positive ? "text-success" : "text-critical")}>
              {delta.positive ? "↑" : "↓"} {delta.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", tones[tone])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
