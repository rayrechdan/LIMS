import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { AutoStatusBadge } from "@/components/ui/StatusBadge";
import { fmtRelative, calcAge } from "@/lib/format";

export default async function MyPatientsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const doctor = await db.doctor.findUnique({ where: { userId: session.user.id } });
  if (!doctor) redirect("/doctor");

  const patients = await db.patient.findMany({
    where: { orders: { some: { doctorId: doctor.id } } },
    include: {
      orders: {
        where: { doctorId: doctor.id },
        orderBy: { orderedAt: "desc" },
        include: { items: { include: { test: true } }, samples: { include: { results: true } } },
      },
    },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="My Patients" description="Patients you've referred for testing" />

      <Card>
        <div className="px-6 py-3 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input type="search" placeholder="Search by name or MRN…" className="pl-11" />
          </div>
          <span className="text-xs text-gray ml-auto">{patients.length} patients</span>
        </div>

        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>MRN</th>
                <th>Name</th>
                <th>Age / Sex</th>
                <th>Total Orders</th>
                <th>Last Order</th>
                <th>Last Status</th>
                <th>When</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray">No patients yet</td></tr>
              ) : patients.map((p) => {
                const last = p.orders[0];
                return (
                  <tr key={p.id}>
                    <td className="font-mono-data text-[12px] text-teal">{p.mrn}</td>
                    <td className="font-medium">{p.firstName} {p.lastName}</td>
                    <td className="font-mono-data text-[12px]">{calcAge(p.dateOfBirth)} / {p.gender[0]}</td>
                    <td className="font-mono-data">{p.orders.length}</td>
                    <td className="text-gray text-[12px]">{last ? last.items.map((i) => i.test.code).join(", ") : "—"}</td>
                    <td>{last ? <AutoStatusBadge status={last.status} /> : "—"}</td>
                    <td className="text-gray text-[12px]">{last ? fmtRelative(last.orderedAt) : "—"}</td>
                    <td className="text-right">
                      <Link href={`/doctor/patients/${p.id}`} className="text-xs text-teal hover:underline">Open →</Link>
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
