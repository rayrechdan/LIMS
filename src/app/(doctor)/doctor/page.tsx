import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { AutoStatusBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { fmtRelative, fmtDateTime, calcAge } from "@/lib/format";
import { startOfDay } from "date-fns";

export default async function DoctorDashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") redirect("/dashboard");

  const doctor = await db.doctor.findUnique({ where: { userId: session.user.id } });
  if (!doctor) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-semibold text-ink">Welcome, {session.user.firstName}</h1>
        <p className="text-sm text-gray mt-2">Your account is not linked to a doctor profile yet. Please contact the lab.</p>
      </div>
    );
  }

  // ─── Critical results awaiting attention ───
  const criticalResults = await db.result.findMany({
    where: {
      flag: { in: ["CRITICAL_LOW", "CRITICAL_HIGH"] },
      sample: { order: { doctorId: doctor.id } },
      status: "VALIDATED",
    },
    include: {
      parameter: { include: { test: true } },
      sample: { include: { patient: true, order: true } },
    },
    orderBy: { validatedAt: "desc" },
    take: 5,
  });

  const today = startOfDay(new Date());
  // ─── Patients with new results today ───
  const todayPatients = await db.patient.findMany({
    where: {
      orders: {
        some: {
          doctorId: doctor.id,
          samples: { some: { results: { some: { status: "VALIDATED", validatedAt: { gte: today } } } } },
        },
      },
    },
    include: {
      orders: {
        where: { doctorId: doctor.id },
        orderBy: { orderedAt: "desc" },
        include: { items: { include: { test: true } }, samples: { include: { results: true } } },
        take: 1,
      },
    },
    take: 8,
  });

  // ─── Recent patients (any with order) ───
  const recentPatients = await db.patient.findMany({
    where: { orders: { some: { doctorId: doctor.id } } },
    include: {
      orders: {
        where: { doctorId: doctor.id },
        orderBy: { orderedAt: "desc" },
        include: { items: { include: { test: true } }, samples: { include: { results: true } } },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  // KPIs
  const [totalOrders, pendingResults, releasedThisWeek] = await Promise.all([
    db.testOrder.count({ where: { doctorId: doctor.id } }),
    db.testOrder.count({ where: { doctorId: doctor.id, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    db.testOrder.count({ where: { doctorId: doctor.id, status: "COMPLETED", completedAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Welcome back, Dr. {doctor.lastName}</h1>
        <p className="text-sm text-gray mt-1">{doctor.specialty || "—"} {doctor.clinic && `· ${doctor.clinic}`}</p>
      </div>

      {/* Critical banner */}
      {criticalResults.length > 0 && (
        <div className="bg-critical-soft border border-critical/30 rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-critical/10 border-b border-critical/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-critical text-white flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-critical">Critical values requiring immediate attention</p>
              <p className="text-xs text-critical/80 mt-0.5">{criticalResults.length} result{criticalResults.length === 1 ? "" : "s"} flagged outside critical limits — please review and contact patients</p>
            </div>
          </div>
          <div className="divide-y divide-critical/15">
            {criticalResults.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-critical text-white flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                    {r.sample.patient.firstName[0]}{r.sample.patient.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{r.sample.patient.firstName} {r.sample.patient.lastName}</p>
                    <p className="text-[11px] text-gray font-mono-data">{r.sample.patient.mrn} · {calcAge(r.sample.patient.dateOfBirth)}y · {r.sample.patient.gender}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{r.parameter.test.code} · {r.parameter.name}</p>
                  <p className="text-sm font-mono-data font-bold text-critical mt-0.5">
                    {r.valueNumeric} {r.parameter.unit}
                    <span className="text-[10px] font-normal ml-1">(ref {r.parameter.refRangeLow}–{r.parameter.refRangeHigh})</span>
                  </p>
                </div>
                <Link href={`/doctor/patients/${r.sample.patient.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-md bg-critical text-white hover:bg-red-700 transition-colors">
                  Review →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Total Orders" value={totalOrders} icon="file" tone="teal" />
        <KpiCard label="Pending Results" value={pendingResults} icon="clock" tone="warning" />
        <KpiCard label="Released This Week" value={releasedThisWeek} icon="check" tone="success" />
      </div>

      {/* Search */}
      <Card>
        <div className="px-6 py-3 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input type="search" placeholder="Search my patients by name or MRN…" className="pl-11" />
          </div>
          <Link href="/doctor/patients" className="text-xs text-teal hover:underline ml-auto">View all patients →</Link>
        </div>

        {/* Today's results section */}
        {todayPatients.length > 0 && (
          <div>
            <div className="px-6 py-3 bg-teal-mist border-b border-border flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-teal flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                Released Today
              </p>
              <span className="text-[11px] text-gray">{todayPatients.length} {todayPatients.length === 1 ? "patient" : "patients"}</span>
            </div>
            <PatientList patients={todayPatients} highlight />
          </div>
        )}

        {/* Recent patients */}
        <div>
          <div className="px-6 py-3 border-b border-border bg-gray-lighter/30">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray">Recent Patients</p>
          </div>
          {recentPatients.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray">No patient orders yet</div>
          ) : (
            <PatientList patients={recentPatients} />
          )}
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, icon, tone }: { label: string; value: number; icon: string; tone: "teal" | "warning" | "success" }) {
  const tones = {
    teal: "bg-teal-soft text-teal",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
  };
  const icons: Record<string, React.ReactNode> = {
    file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  };
  return (
    <div className="bg-surface rounded-lg border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray">{label}</p>
        <p className="text-3xl font-semibold text-ink mt-2 font-mono-data">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icons[icon]}</div>
    </div>
  );
}

type PatientWithOrder = {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    orderedAt: Date;
    items: { test: { code: string } }[];
    samples: { results: { status: string; validatedAt: Date | null }[] }[];
  }[];
};

function PatientList({ patients, highlight }: { patients: PatientWithOrder[]; highlight?: boolean }) {
  return (
    <div className="divide-y divide-border">
      {patients.map((p) => {
        const o = p.orders[0];
        if (!o) return null;
        const allResults = o.samples.flatMap((s) => s.results);
        const validated = allResults.filter((r) => r.status === "VALIDATED").length;
        const total = allResults.length;
        return (
          <Link
            key={p.id}
            href={`/doctor/patients/${p.id}`}
            className={`block px-6 py-4 hover:bg-teal-soft/40 transition-colors ${highlight ? "bg-teal-mist/40" : ""}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-soft text-teal flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {p.firstName[0]}{p.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{p.firstName} {p.lastName}</p>
                <p className="text-[11px] text-gray font-mono-data">{p.mrn} · {calcAge(p.dateOfBirth)}y · {p.gender}</p>
              </div>
              <div className="hidden sm:block text-[11px] text-gray">
                {o.items.map((i) => i.test.code).join(", ")}
              </div>
              <div className="text-right">
                <AutoStatusBadge status={o.status} />
                <p className="text-[10px] text-gray mt-1 font-mono-data">{validated}/{total} validated</p>
              </div>
              <span className="text-[11px] text-gray whitespace-nowrap">{fmtRelative(o.orderedAt)}</span>
              {highlight && <StatusBadge tone="teal">● New</StatusBadge>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
