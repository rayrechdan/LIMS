import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { AutoStatusBadge } from "@/components/ui/StatusBadge";
import { fmtRelative, fmtDateTime, calcAge } from "@/lib/format";

export default async function PendingResultsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const doctor = await db.doctor.findUnique({ where: { userId: session.user.id } });
  if (!doctor) redirect("/doctor");

  const orders = await db.testOrder.findMany({
    where: { doctorId: doctor.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
    include: {
      patient: true,
      items: { include: { test: true } },
      samples: { include: { results: true } },
    },
    orderBy: [{ priority: "asc" }, { orderedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Pending Results" description="Orders awaiting completion or validation" />

      <Card>
        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Patient</th>
                <th>Tests</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Ordered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-light"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  No pending results — you&apos;re all caught up
                </td></tr>
              ) : orders.map((o) => {
                const allResults = o.samples.flatMap((s) => s.results);
                const validated = allResults.filter((r) => r.status === "VALIDATED").length;
                const total = allResults.length;
                const pct = total ? Math.round((validated / total) * 100) : 0;
                return (
                  <tr key={o.id}>
                    <td className="font-mono-data text-[12px] text-teal">{o.orderNumber}</td>
                    <td>
                      <p className="font-medium text-ink">{o.patient.firstName} {o.patient.lastName}</p>
                      <p className="text-[11px] text-gray font-mono-data">{o.patient.mrn} · {calcAge(o.patient.dateOfBirth)}y</p>
                    </td>
                    <td className="text-gray text-[12px]">{o.items.map((i) => i.test.code).join(", ")}</td>
                    <td><AutoStatusBadge status={o.priority} /></td>
                    <td><AutoStatusBadge status={o.status} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-lighter rounded-full overflow-hidden">
                          <div className="h-full bg-teal" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-mono-data text-gray">{validated}/{total}</span>
                      </div>
                    </td>
                    <td className="text-gray text-[12px]">{fmtRelative(o.orderedAt)}</td>
                    <td className="text-right">
                      <Link href={`/doctor/patients/${o.patient.id}`} className="text-xs text-teal hover:underline">Open →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
