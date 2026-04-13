import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { AutoStatusBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { fmtMoney, fmtRelative, fmtDate, fmtDateTime } from "@/lib/format";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function PatientPortalHome() {
  const session = await auth();
  if (!session) redirect("/auth/patient/login");

  const patient = await db.patient.findUnique({
    where: { userId: session.user.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { test: true } },
          doctor: true,
          samples: { include: { results: { include: { parameter: { include: { test: true } } } } } },
        },
      },
    },
  });

  if (!patient) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-semibold text-ink">Welcome, {session.user.firstName}</h1>
        <p className="text-sm text-gray mt-2">Your account is not yet linked to a patient record. Please contact the lab.</p>
      </div>
    );
  }

  const allResults = patient.orders.flatMap((o) => o.samples.flatMap((s) => s.results));
  const validatedResults = allResults.filter((r) => r.status === "VALIDATED");
  const pendingCount = patient.orders.filter((o) => o.status !== "COMPLETED").length;
  const outstanding = patient.orders.filter((o) => o.paymentStatus !== "PAID").reduce((s, o) => s + o.totalPrice, 0);
  const recentResults = validatedResults.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">{greeting()}, {patient.firstName}</h1>
        <p className="text-sm text-gray mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Pending Results"
          value={pendingCount}
          subtitle={pendingCount === 0 ? "All caught up" : `${pendingCount} order${pendingCount === 1 ? "" : "s"} in progress`}
          icon="clock"
          tone="warning"
        />
        <StatCard
          label="Next Appointment"
          value="—"
          subtitle="No appointments scheduled"
          icon="calendar"
          tone="teal"
          action={<Link href="/portal/appointments" className="text-[11px] text-teal font-semibold hover:underline">Book →</Link>}
        />
        <StatCard
          label="Outstanding Balance"
          value={fmtMoney(outstanding)}
          subtitle={outstanding === 0 ? "No balance due" : "Due upon next visit"}
          icon="dollar"
          tone={outstanding > 0 ? "critical" : "success"}
          action={outstanding > 0 ? <Link href="/portal/billing" className="text-[11px] text-teal font-semibold hover:underline">Pay now →</Link> : undefined}
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent Results</CardTitle>
              <p className="text-xs text-gray mt-0.5">Validated test results</p>
            </div>
            <Link href="/portal/results" className="text-xs text-teal hover:underline">View all →</Link>
          </CardHeader>
          {recentResults.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-teal-soft text-teal flex items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>
              </div>
              <p className="text-sm font-medium text-ink">No results yet</p>
              <p className="text-xs text-gray mt-1">Your test results will appear here once released</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentResults.map((r) => {
                const isCritical = r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH";
                const isAbnormal = r.flag && r.flag !== "NORMAL" && !isCritical;
                return (
                  <Link
                    key={r.id}
                    href={`/portal/results/${r.id}`}
                    className={`block px-6 py-4 hover:bg-teal-soft/30 transition-colors ${isCritical ? "bg-critical-soft/20" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCritical ? "bg-critical-soft text-critical" : isAbnormal ? "bg-warning-soft text-warning" : "bg-success-soft text-success"
                      }`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink">{r.parameter.test.name}</p>
                        <p className="text-[11px] text-gray font-mono-data">{r.parameter.name} · {fmtRelative(r.validatedAt || r.updatedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-mono-data font-semibold ${isCritical ? "text-critical" : "text-ink"}`}>
                          {r.valueNumeric ?? r.valueText} <span className="text-[10px] text-gray font-normal">{r.parameter.unit}</span>
                        </p>
                        {r.flag && r.flag !== "NORMAL" ? <AutoStatusBadge status={r.flag} /> : <StatusBadge tone="success">Normal</StatusBadge>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-teal-soft text-teal flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <p className="text-sm font-medium text-ink">No appointments scheduled</p>
              <p className="text-xs text-gray mt-1 mb-4">Book a test or visit at your convenience</p>
              <Link href="/portal/appointments" className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-lg bg-teal text-white hover:bg-teal-dark transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Book Appointment
              </Link>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <div className="p-4 space-y-2">
              <QuickAction
                href="/portal/appointments"
                icon="flask"
                title="Book a Test"
                desc="Schedule lab work at any branch"
              />
              <QuickAction
                href="/portal/results"
                icon="download"
                title="Download Report"
                desc="Get your latest lab report as PDF"
              />
              <QuickAction
                href="/portal/help"
                icon="message"
                title="Contact Support"
                desc="Reach out to our patient services team"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, subtitle, icon, tone, action,
}: {
  label: string;
  value: React.ReactNode;
  subtitle: string;
  icon: string;
  tone: "teal" | "warning" | "critical" | "success";
  action?: React.ReactNode;
}) {
  const tones = {
    teal: "bg-teal-soft text-teal",
    warning: "bg-warning-soft text-warning",
    critical: "bg-critical-soft text-critical",
    success: "bg-success-soft text-success",
  };
  const valueColor = tone === "critical" ? "text-critical" : "text-ink";
  const icons: Record<string, React.ReactNode> = {
    clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    dollar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  };
  return (
    <div className="bg-surface rounded-lg border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray">{label}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icons[icon]}</div>
      </div>
      <p className={`text-3xl font-semibold font-mono-data ${valueColor}`}>{value}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-gray">{subtitle}</p>
        {action}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  const icons: Record<string, React.ReactNode> = {
    flask: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>,
    download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    message: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  };
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-teal/30 hover:bg-teal-soft/30 transition-all group">
      <div className="w-10 h-10 rounded-lg bg-teal-soft text-teal flex items-center justify-center flex-shrink-0">{icons[icon]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="text-[11px] text-gray">{desc}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray group-hover:text-teal group-hover:translate-x-0.5 transition-all">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    </Link>
  );
}
