import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "critical" | "info" | "teal";

const tones: Record<Tone, string> = {
  neutral: "bg-gray-lighter text-ink-soft border-border",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  critical: "bg-critical-soft text-critical border-critical/20",
  info: "bg-info-soft text-info border-info/20",
  teal: "bg-teal-soft text-teal border-teal/20",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded-full border",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_MAP: Record<string, { tone: Tone; label: string }> = {
  PENDING: { tone: "neutral", label: "Pending" },
  COLLECTED: { tone: "info", label: "Collected" },
  RECEIVED: { tone: "info", label: "Received" },
  IN_PROCESS: { tone: "warning", label: "In Process" },
  IN_PROGRESS: { tone: "warning", label: "In Progress" },
  COMPLETED: { tone: "success", label: "Completed" },
  REJECTED: { tone: "critical", label: "Rejected" },
  CANCELLED: { tone: "critical", label: "Cancelled" },
  DRAFT: { tone: "neutral", label: "Draft" },
  SIGNED: { tone: "teal", label: "Signed" },
  RELEASED: { tone: "success", label: "Released" },
  AMENDED: { tone: "warning", label: "Amended" },
  ENTERED: { tone: "info", label: "Entered" },
  VALIDATED: { tone: "success", label: "Validated" },
  STAT: { tone: "critical", label: "STAT" },
  URGENT: { tone: "warning", label: "Urgent" },
  ROUTINE: { tone: "neutral", label: "Routine" },
  PAID: { tone: "success", label: "Paid" },
  UNPAID: { tone: "critical", label: "Unpaid" },
  PARTIAL: { tone: "warning", label: "Partial" },
  NORMAL: { tone: "success", label: "Normal" },
  LOW: { tone: "info", label: "Low" },
  HIGH: { tone: "warning", label: "High" },
  CRITICAL_LOW: { tone: "critical", label: "Critical Low" },
  CRITICAL_HIGH: { tone: "critical", label: "Critical High" },
  ABNORMAL: { tone: "warning", label: "Abnormal" },
};

export function AutoStatusBadge({ status }: { status: string }) {
  const m = STATUS_MAP[status] ?? { tone: "neutral" as Tone, label: status };
  return <StatusBadge tone={m.tone}>{m.label}</StatusBadge>;
}
