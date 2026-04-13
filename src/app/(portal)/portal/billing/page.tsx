"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtMoney, fmtDate, fmtDateTime } from "@/lib/format";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalPrice: number;
  orderedAt: string;
  items: { test: { code: string; name: string } }[];
};

export default function PatientBillingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"invoices" | "history">("invoices");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/portal/orders");
    const d = await r.json();
    setOrders(d.orders || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Compute insurance / balance / status
  const enriched = orders.map((o) => {
    const insuranceCovered = o.paymentStatus === "PAID" ? 0 : Math.round(o.totalPrice * 0.4 * 100) / 100;
    const balanceDue = o.paymentStatus === "PAID" ? 0 : o.totalPrice - insuranceCovered;
    let status: "PAID" | "PENDING" | "OVERDUE" = "PENDING";
    if (o.paymentStatus === "PAID") status = "PAID";
    else if (new Date(o.orderedAt) < new Date(Date.now() - 30 * 86400000)) status = "OVERDUE";
    return { ...o, insuranceCovered, balanceDue, payStatus: status };
  });

  const totalOutstanding = enriched.filter((o) => o.payStatus !== "PAID").reduce((s, o) => s + o.balanceDue, 0);
  const overdueCount = enriched.filter((o) => o.payStatus === "OVERDUE").length;

  // Mock payment history derived from paid orders
  const paymentHistory = enriched.filter((o) => o.payStatus === "PAID").map((o) => ({
    id: o.id,
    date: o.orderedAt,
    invoice: `INV-${o.orderNumber.slice(-5)}`,
    method: "Credit Card · **** 4242",
    amount: o.totalPrice,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Invoices, payments, and insurance claims" />

      {/* Outstanding balance hero */}
      {totalOutstanding > 0 && (
        <div className={`rounded-lg border p-6 flex items-center justify-between gap-4 ${
          overdueCount > 0 ? "bg-critical-soft border-critical/30" : "bg-teal-soft border-teal/20"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${overdueCount > 0 ? "bg-critical text-white" : "bg-teal text-white"}`}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <p className={`text-[11px] uppercase tracking-wider font-semibold ${overdueCount > 0 ? "text-critical" : "text-teal"}`}>
                Total Outstanding Balance
              </p>
              <p className={`text-3xl font-semibold mt-1 font-mono-data ${overdueCount > 0 ? "text-critical" : "text-teal"}`}>
                {fmtMoney(totalOutstanding)}
              </p>
              <p className="text-[11px] text-gray mt-0.5">
                {enriched.filter((o) => o.payStatus !== "PAID").length} unpaid invoice{enriched.filter((o) => o.payStatus !== "PAID").length === 1 ? "" : "s"}
                {overdueCount > 0 && <span className="text-critical font-semibold"> · {overdueCount} overdue</span>}
              </p>
            </div>
          </div>
          <Button size="lg" className={overdueCount > 0 ? "bg-critical hover:bg-red-700" : ""}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
            Pay All
          </Button>
        </div>
      )}

      <Card>
        <Tabs
          tabs={[
            { value: "invoices", label: "Invoices", count: enriched.length },
            { value: "history", label: "Payment History", count: paymentHistory.length },
          ]}
          active={tab}
          onChange={(v) => setTab(v as "invoices" | "history")}
        />

        {tab === "invoices" && (
          <div className="overflow-auto">
            <table className="lims-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Tests</th>
                  <th>Amount</th>
                  <th>Insurance Covered</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} className="text-center py-12 text-gray">Loading…</td></tr>}
                {!loading && enriched.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray">No invoices yet</td></tr>}
                {enriched.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono-data text-[12px] text-teal">INV-{o.orderNumber.slice(-5)}</td>
                    <td className="text-gray text-[12px]">{fmtDate(o.orderedAt)}</td>
                    <td className="text-gray text-[12px]">{o.items.map((i) => i.test.code).join(", ")}</td>
                    <td className="font-mono-data font-semibold text-ink">{fmtMoney(o.totalPrice)}</td>
                    <td className="font-mono-data text-success text-[12px]">{o.insuranceCovered > 0 ? `− ${fmtMoney(o.insuranceCovered)}` : "—"}</td>
                    <td className={`font-mono-data font-semibold ${o.balanceDue > 0 ? "text-warning" : "text-gray"}`}>{fmtMoney(o.balanceDue)}</td>
                    <td>
                      {o.payStatus === "PAID" && <StatusBadge tone="success">● Paid</StatusBadge>}
                      {o.payStatus === "PENDING" && <StatusBadge tone="warning">● Pending</StatusBadge>}
                      {o.payStatus === "OVERDUE" && <StatusBadge tone="critical">● Overdue</StatusBadge>}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {o.payStatus !== "PAID" && <Button size="sm">Pay</Button>}
                        <Button variant="ghost" size="sm">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "history" && (
          <div>
            {loading && <div className="py-12 text-center text-sm text-gray">Loading…</div>}
            {!loading && paymentHistory.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-gray-lighter text-gray flex items-center justify-center mb-3">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <p className="text-sm font-medium text-ink">No payments yet</p>
                <p className="text-xs text-gray mt-1">Your payment history will appear here</p>
              </div>
            )}
            {!loading && paymentHistory.length > 0 && (
              <div className="divide-y divide-border">
                {paymentHistory.map((p) => (
                  <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success-soft text-success flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{p.invoice}</p>
                        <p className="text-[11px] text-gray font-mono-data">{p.method}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-mono-data font-semibold text-ink">{fmtMoney(p.amount)}</p>
                      <p className="text-[10px] text-gray">{fmtDateTime(p.date)}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Receipt
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
