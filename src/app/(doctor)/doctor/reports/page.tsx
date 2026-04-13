import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AutoStatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime, calcAge } from "@/lib/format";

export default async function DoctorReportsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const doctor = await db.doctor.findUnique({ where: { userId: session.user.id } });
  if (!doctor) redirect("/doctor");

  const orders = await db.testOrder.findMany({
    where: { doctorId: doctor.id, status: "COMPLETED" },
    include: {
      patient: true,
      items: { include: { test: true } },
    },
    orderBy: { completedAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Released and signed reports for your patients" />

      <Card>
        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>Report #</th>
                <th>Patient</th>
                <th>Tests</th>
                <th>Released</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray">No released reports yet</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono-data text-[12px] text-teal">{o.orderNumber}</td>
                  <td>
                    <p className="font-medium text-ink">{o.patient.firstName} {o.patient.lastName}</p>
                    <p className="text-[11px] text-gray font-mono-data">{o.patient.mrn} · {calcAge(o.patient.dateOfBirth)}y</p>
                  </td>
                  <td className="text-gray text-[12px]">{o.items.map((i) => i.test.name).join(", ")}</td>
                  <td className="text-gray text-[12px]">{fmtDateTime(o.completedAt || o.orderedAt)}</td>
                  <td><AutoStatusBadge status="RELEASED" /></td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/doctor/patients/${o.patient.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Download PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
