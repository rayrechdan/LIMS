import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LeveyJenningsChart } from "@/components/charts/LeveyJenningsChart";
import { QCSelector } from "./QCSelector";
import { fmtDateTime } from "@/lib/format";

export default async function QCPage({ searchParams }: { searchParams: Promise<{ analyte?: string; level?: string }> }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const sp = await searchParams;

  // ─── Available analytes & levels (distinct from runs) ───
  const analytesRaw = await db.qCRun.findMany({
    select: { parameterCode: true, parameterName: true, unit: true },
    distinct: ["parameterCode"],
    orderBy: { parameterCode: "asc" },
  });
  const levels = await db.qCMaterial.findMany({ select: { level: true, lot: true } });
  const distinctLevels = Array.from(new Set(levels.map((l) => l.level)));

  const analyte = sp.analyte || analytesRaw[0]?.parameterCode || "HGB";
  const level = sp.level || "NORMAL";

  // ─── Selected runs for chart ───
  const runs = await db.qCRun.findMany({
    where: { parameterCode: analyte, material: { level } },
    include: { material: true, instrument: true },
    orderBy: { runAt: "asc" },
  });

  const meanForSelected = runs[0]?.mean || 0;
  const sdForSelected = runs[0]?.sd || 1;
  const unitForSelected = runs[0]?.unit || analytesRaw.find((a) => a.parameterCode === analyte)?.unit || "";

  // ─── KPI counts (across all runs in last 30 days) ───
  const since = new Date(Date.now() - 30 * 86400000);
  const [inRange, warning, outOfRange, totalRuns] = await Promise.all([
    db.qCRun.count({ where: { status: "IN_RANGE", runAt: { gte: since } } }),
    db.qCRun.count({ where: { status: "WARNING", runAt: { gte: since } } }),
    db.qCRun.count({ where: { status: "OUT_OF_RANGE", runAt: { gte: since } } }),
    db.qCRun.count({ where: { runAt: { gte: since } } }),
  ]);
  const inRangePct = totalRuns ? Math.round((inRange / totalRuns) * 100) : 0;

  // ─── Recent runs for log table (selected analyte+level, latest 20) ───
  const recentRuns = await db.qCRun.findMany({
    where: { parameterCode: analyte, material: { level } },
    include: { material: true },
    orderBy: { runAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality Control"
        description="Levey-Jennings monitoring, Westgard rule violations, and corrective actions"
      />

      {/* KPI summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QCStatCard
          label="Controls In Range"
          value={inRange}
          subtitle={`${inRangePct}% of total runs`}
          icon="check"
          tone="success"
        />
        <QCStatCard
          label="Out of Range"
          value={outOfRange}
          subtitle="Westgard violation — review required"
          icon="alert"
          tone="critical"
        />
        <QCStatCard
          label="Warnings"
          value={warning}
          subtitle="1-2s flagged, repeat passed"
          icon="warning"
          tone="warning"
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/center: chart + log */}
        <div className="lg:col-span-9 space-y-6">
          {/* Selectors + chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle>Levey-Jennings Chart</CardTitle>
                <span className="text-[11px] text-gray">
                  Mean <span className="font-mono-data text-ink">{meanForSelected.toFixed(2)}</span> ·
                  SD <span className="font-mono-data text-ink ml-1">{sdForSelected.toFixed(2)}</span> ·
                  CV <span className="font-mono-data text-ink ml-1">{runs[0]?.cv.toFixed(2) || "0"}%</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <QCSelector
                  analyte={analyte}
                  level={level}
                  analytes={analytesRaw.map((a) => ({ value: a.parameterCode, label: `${a.parameterCode} · ${a.parameterName}` }))}
                  levels={distinctLevels}
                />
              </div>
            </CardHeader>
            <div className="p-5">
              <LeveyJenningsChart
                points={runs.map((r) => ({
                  id: r.id,
                  runAt: r.runAt.toISOString(),
                  value: r.value,
                  zScore: r.zScore,
                  status: r.status,
                  westgardRule: r.westgardRule,
                  technician: r.technicianName,
                }))}
                mean={meanForSelected}
                sd={sdForSelected}
                unit={unitForSelected}
              />
            </div>
            {/* Mini stats below chart */}
            <div className="grid grid-cols-4 border-t border-border bg-gray-lighter/30">
              <MiniStat label="Runs (30d)" value={runs.length} />
              <MiniStat label="In Range" value={runs.filter((r) => r.status === "IN_RANGE").length} tone="success" />
              <MiniStat label="Warnings" value={runs.filter((r) => r.status === "WARNING").length} tone="warning" />
              <MiniStat label="Violations" value={runs.filter((r) => r.status === "OUT_OF_RANGE").length} tone="critical" />
            </div>
          </Card>

          {/* QC Run Log */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>QC Run Log</CardTitle>
                <p className="text-xs text-gray mt-0.5">{analyte} · {level} level · last 20 runs</p>
              </div>
            </CardHeader>
            <div className="overflow-auto">
              <table className="lims-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Analyte</th>
                    <th>Level</th>
                    <th>Value</th>
                    <th>Mean</th>
                    <th>SD</th>
                    <th>CV%</th>
                    <th>Z</th>
                    <th>Result</th>
                    <th>Technician</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-12 text-gray">No QC runs</td></tr>
                  ) : recentRuns.map((r) => (
                    <tr key={r.id}>
                      <td className="text-gray text-[11px] font-mono-data">{fmtDateTime(r.runAt)}</td>
                      <td className="font-mono-data text-[12px] text-teal">{r.parameterCode}</td>
                      <td className="text-gray text-[12px]">{r.material.level}</td>
                      <td className="font-mono-data font-semibold text-ink">{r.value} <span className="text-gray font-normal text-[10px]">{r.unit}</span></td>
                      <td className="font-mono-data text-[12px] text-gray">{r.mean.toFixed(2)}</td>
                      <td className="font-mono-data text-[12px] text-gray">{r.sd.toFixed(2)}</td>
                      <td className="font-mono-data text-[12px] text-gray">{r.cv.toFixed(2)}%</td>
                      <td className={`font-mono-data text-[12px] ${Math.abs(r.zScore) >= 2 ? (Math.abs(r.zScore) >= 3 ? "text-critical font-semibold" : "text-warning font-semibold") : "text-gray"}`}>
                        {r.zScore > 0 ? "+" : ""}{r.zScore.toFixed(2)}
                      </td>
                      <td>
                        {r.status === "OUT_OF_RANGE" ? (
                          <div className="flex flex-col gap-1">
                            <StatusBadge tone="critical">● Reject</StatusBadge>
                            {r.westgardRule && <span className="text-[10px] font-mono-data text-critical">{r.westgardRule.replace("_", "-")}</span>}
                          </div>
                        ) : r.status === "WARNING" ? (
                          <div className="flex flex-col gap-1">
                            <StatusBadge tone="warning">● Warning</StatusBadge>
                            {r.westgardRule && <span className="text-[10px] font-mono-data text-warning">{r.westgardRule.replace("_", "-")}</span>}
                          </div>
                        ) : (
                          <StatusBadge tone="success">● Accept</StatusBadge>
                        )}
                      </td>
                      <td className="text-gray text-[12px]">{r.technicianName || "—"}</td>
                      <td className="text-[11px] text-ink-soft max-w-[180px] truncate">{r.actionTaken || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <QuickActionsCard />
          <WestgardLegendCard />
          <ControlMaterialCard runs={runs} />
        </div>
      </div>
    </div>
  );
}

// ─── Components ────────────────────────────────────────────────────

function QCStatCard({ label, value, subtitle, icon, tone }: { label: string; value: number; subtitle: string; icon: string; tone: "success" | "critical" | "warning" }) {
  const tones = {
    success: { bg: "bg-success-soft", text: "text-success", value: "text-success", border: "border-success/15" },
    critical: { bg: "bg-critical-soft", text: "text-critical", value: "text-critical", border: "border-critical/30 ring-1 ring-critical/15" },
    warning: { bg: "bg-warning-soft", text: "text-warning", value: "text-warning", border: "border-warning/15" },
  };
  const t = tones[tone];
  const icons: Record<string, React.ReactNode> = {
    check: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    alert: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    warning: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  return (
    <div className={`bg-surface rounded-lg border ${t.border} p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray">{label}</p>
        <div className={`w-10 h-10 rounded-lg ${t.bg} ${t.text} flex items-center justify-center`}>{icons[icon]}</div>
      </div>
      <p className={`text-4xl font-semibold font-mono-data ${t.value}`}>{value}</p>
      <p className="text-[11px] text-gray mt-2">{subtitle}</p>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" | "critical" }) {
  const colors = tone ? { success: "text-success", warning: "text-warning", critical: "text-critical" }[tone] : "text-ink";
  return (
    <div className="px-5 py-3 border-r border-border last:border-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray">{label}</p>
      <p className={`text-xl font-semibold font-mono-data mt-0.5 ${colors}`}>{value}</p>
    </div>
  );
}

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <div className="p-4 space-y-2">
        <button className="w-full inline-flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium rounded-lg bg-teal text-white hover:bg-teal-dark transition-colors shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add QC Run
        </button>
        <button className="w-full inline-flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium rounded-lg border border-border bg-surface text-ink-soft hover:border-teal/30 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print QC Report
        </button>
        <button className="w-full inline-flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium rounded-lg border border-border bg-surface text-ink-soft hover:border-teal/30 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export to Excel
        </button>
      </div>
    </Card>
  );
}

function WestgardLegendCard() {
  const rules = [
    { code: "1-2s", label: "1 result outside ±2SD", tone: "warning", desc: "Warning — repeat" },
    { code: "1-3s", label: "1 result outside ±3SD", tone: "critical", desc: "Reject — investigate" },
    { code: "2-2s", label: "2 consecutive outside ±2SD same side", tone: "critical", desc: "Reject — bias" },
    { code: "R-4s", label: "Range between 2 runs > 4SD", tone: "critical", desc: "Reject — imprecision" },
    { code: "4-1s", label: "4 consecutive outside ±1SD same side", tone: "critical", desc: "Reject — shift" },
    { code: "10-x", label: "10 consecutive on same side of mean", tone: "critical", desc: "Reject — bias trend" },
  ] as const;
  const tones = {
    warning: "bg-warning-soft text-warning border-warning/20",
    critical: "bg-critical-soft text-critical border-critical/20",
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Westgard Rules</CardTitle>
      </CardHeader>
      <div className="p-4 space-y-2.5">
        {rules.map((r) => (
          <div key={r.code} className="flex items-start gap-3">
            <span className={`inline-flex items-center justify-center min-w-[44px] px-2 py-0.5 text-[10px] font-bold font-mono-data rounded border ${tones[r.tone]}`}>
              {r.code}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-ink-soft leading-tight">{r.label}</p>
              <p className="text-[10px] text-gray mt-0.5">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ControlMaterialCard({ runs }: { runs: { material: { name: string; lot: string; expiryDate: Date | null; manufacturer: string | null } }[] }) {
  const m = runs[0]?.material;
  if (!m) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Control Material</CardTitle>
      </CardHeader>
      <div className="p-4 space-y-2 text-[12px]">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">Material</p>
          <p className="text-ink font-medium mt-0.5">{m.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">Lot</p>
            <p className="text-ink font-mono-data">{m.lot}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">Expiry</p>
            <p className="text-ink font-mono-data">{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">Manufacturer</p>
          <p className="text-gray">{m.manufacturer || "—"}</p>
        </div>
      </div>
    </Card>
  );
}
