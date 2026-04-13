import { db } from "@/lib/db";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { AutoStatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime, fmtMoney } from "@/lib/format";

export default async function OrdersPage() {
  const orders = await db.testOrder.findMany({
    orderBy: { orderedAt: "desc" },
    include: {
      patient: true,
      doctor: true,
      items: { include: { test: true } },
      samples: true,
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests & Orders"
        description="All test orders across the lab"
        actions={
          <Link href="/orders/new">
            <button className="inline-flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-lg bg-teal text-white hover:bg-teal-dark transition-colors shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Order
            </button>
          </Link>
        }
      />

      <Card>
        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Tests</th>
                <th>Samples</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Total</th>
                <th>Ordered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray">No orders yet</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono-data text-[12px] text-teal">{o.orderNumber}</td>
                  <td className="font-medium">{o.patient.firstName} {o.patient.lastName}</td>
                  <td className="text-gray text-[12px]">{o.doctor ? `Dr. ${o.doctor.lastName}` : "—"}</td>
                  <td className="text-gray text-[12px]">{o.items.map((i) => i.test.code).join(", ")}</td>
                  <td className="font-mono-data text-[12px]">{o.samples.length}</td>
                  <td><AutoStatusBadge status={o.priority} /></td>
                  <td><AutoStatusBadge status={o.status} /></td>
                  <td className="font-mono-data">{fmtMoney(o.totalPrice)}</td>
                  <td className="text-gray text-[12px]">{fmtDateTime(o.orderedAt)}</td>
                  <td><Link href={`/patients/${o.patient.id}`} className="text-xs text-teal hover:underline">Open →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
