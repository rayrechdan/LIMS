import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { AutoStatusBadge } from "@/components/ui/StatusBadge";
import { fmtMoney, fmtDateTime } from "@/lib/format";

export default async function BillingPage() {
  const orders = await db.testOrder.findMany({
    orderBy: { orderedAt: "desc" },
    include: { patient: true, items: { include: { test: true } } },
    take: 50,
  });

  const totalRevenue = orders.reduce((s, o) => s + o.totalPrice, 0);
  const paid = orders.filter((o) => o.paymentStatus === "PAID").reduce((s, o) => s + o.totalPrice, 0);
  const outstanding = totalRevenue - paid;

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Invoices, payments, and outstanding balances" />

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total Revenue" value={fmtMoney(totalRevenue)} tone="teal" />
        <Stat label="Collected" value={fmtMoney(paid)} tone="success" />
        <Stat label="Outstanding" value={fmtMoney(outstanding)} tone="warning" />
      </div>

      <Card>
        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Tests</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray">No invoices yet</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono-data text-[12px] text-teal">INV-{o.orderNumber.slice(-5)}</td>
                  <td className="font-medium">{o.patient.firstName} {o.patient.lastName}</td>
                  <td className="text-gray text-[12px]">{o.items.map((i) => i.test.code).join(", ")}</td>
                  <td className="text-gray text-[12px]">{fmtDateTime(o.orderedAt)}</td>
                  <td className="font-mono-data font-semibold text-ink">{fmtMoney(o.totalPrice)}</td>
                  <td><AutoStatusBadge status={o.paymentStatus} /></td>
                  <td><AutoStatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "teal" | "success" | "warning" }) {
  const tones = { teal: "text-teal", success: "text-success", warning: "text-warning" };
  return (
    <div className="bg-surface rounded-lg border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-[11px] uppercase tracking-wider text-gray font-semibold">{label}</p>
      <p className={`text-3xl font-semibold mt-2 font-mono-data ${tones[tone]}`}>{value}</p>
    </div>
  );
}
