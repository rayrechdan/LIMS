"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AutoStatusBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/lib/format";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  orderedAt: string;
  patient: { firstName: string; lastName: string; mrn: string };
  doctor: { lastName: string } | null;
  items: { test: { code: string; name: string; turnaroundHours: number; category: { name: string } } }[];
  samples: { id: string; barcode: string }[];
};

const DEPARTMENTS = [
  { key: "ALL", label: "All" },
  { key: "Hematology", label: "Hematology" },
  { key: "Clinical Chemistry", label: "Biochemistry" },
  { key: "Microbiology", label: "Microbiology" },
  { key: "Endocrinology", label: "Endocrinology" },
];

export default function WorklistPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState("ALL");
  const [priority, setPriority] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/orders");
    const d = await r.json();
    setOrders((d.orders || []).filter((o: Order) => o.status !== "COMPLETED" && o.status !== "CANCELLED"));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    if (department !== "ALL") {
      const hasCategory = o.items.some((i) => i.test.category.name === department);
      if (!hasCategory) return false;
    }
    if (priority && o.priority !== priority) return false;
    if (statusFilter && o.status !== statusFilter) return false;
    return true;
  });

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((o) => o.id)));
  }

  function tatRemaining(o: Order) {
    const targetHours = Math.max(...o.items.map((i) => i.test.turnaroundHours), 1);
    const elapsedMs = Date.now() - new Date(o.orderedAt).getTime();
    const targetMs = targetHours * 3600000;
    const remainingMs = targetMs - elapsedMs;
    const remainingHours = remainingMs / 3600000;
    return { remainingHours, targetHours };
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Worklist" description="Test orders awaiting processing" />

      {/* Department tabs */}
      <Card>
        <div className="border-b border-border flex items-center gap-1 px-4">
          {DEPARTMENTS.map((d) => {
            const isActive = department === d.key;
            const count = d.key === "ALL" ? orders.length : orders.filter((o) => o.items.some((i) => i.test.category.name === d.key)).length;
            return (
              <button
                key={d.key}
                onClick={() => setDepartment(d.key)}
                className={`relative px-4 py-3 text-[13px] font-medium transition-colors flex items-center gap-2 ${
                  isActive ? "text-teal" : "text-gray hover:text-ink"
                }`}
              >
                {d.label}
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full font-mono-data ${isActive ? "bg-teal text-white" : "bg-gray-lighter text-gray"}`}>
                  {count}
                </span>
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal" />}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-border flex flex-wrap items-center gap-3">
          <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="max-w-[150px]" />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="max-w-[140px]">
            <option value="">All priorities</option>
            <option value="STAT">STAT</option>
            <option value="URGENT">Urgent</option>
            <option value="ROUTINE">Routine</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
          <select className="max-w-[160px]">
            <option>Assigned to: Anyone</option>
            <option>Me</option>
            <option>Unassigned</option>
          </select>
          <span className="text-xs text-gray ml-auto">{filtered.length} orders</span>
        </div>

        {/* Bulk actions toolbar */}
        {selected.size > 0 && (
          <div className="px-6 py-2.5 bg-teal-soft border-b border-teal/15 flex items-center justify-between">
            <p className="text-[12px] font-medium text-teal">{selected.size} selected</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Assign to me</Button>
              <Button variant="outline" size="sm">Mark as Started</Button>
              <Button variant="outline" size="sm">Print Labels</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          </div>
        )}

        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}>
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 accent-teal"
                  />
                </th>
                <th>Order ID</th>
                <th>Patient</th>
                <th>Tests</th>
                <th>Priority</th>
                <th>Sample ID</th>
                <th>Received</th>
                <th>TAT Remaining</th>
                <th>Status</th>
                <th>Assigned</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} className="text-center py-12 text-gray">Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={11} className="text-center py-12 text-gray">No orders in this view</td></tr>}
              {filtered.map((o) => {
                const { remainingHours, targetHours } = tatRemaining(o);
                const overdue = remainingHours < 0;
                const warning = remainingHours >= 0 && remainingHours < targetHours * 0.25;
                return (
                  <tr key={o.id} className={selected.has(o.id) ? "bg-teal-soft/30" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleSelected(o.id)}
                        className="w-3.5 h-3.5 accent-teal"
                      />
                    </td>
                    <td className="font-mono-data text-[12px] text-teal">{o.orderNumber}</td>
                    <td>
                      <p className="font-medium text-ink">{o.patient.firstName} {o.patient.lastName}</p>
                      <p className="text-[10px] text-gray font-mono-data">{o.patient.mrn}</p>
                    </td>
                    <td className="text-gray text-[12px]">{o.items.map((i) => i.test.code).join(", ")}</td>
                    <td><AutoStatusBadge status={o.priority} /></td>
                    <td className="font-mono-data text-[11px] text-gray">{o.samples[0]?.barcode || "—"}</td>
                    <td className="text-gray text-[12px]">{fmtDateTime(o.orderedAt)}</td>
                    <td>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-mono-data text-[11px] font-semibold ${
                        overdue ? "bg-critical text-white" : warning ? "bg-warning-soft text-warning" : "bg-success-soft text-success"
                      }`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {overdue ? `${Math.abs(Math.round(remainingHours))}h overdue` : `${Math.round(remainingHours)}h left`}
                      </div>
                    </td>
                    <td><AutoStatusBadge status={o.status} /></td>
                    <td>
                      <div className="w-7 h-7 rounded-full bg-teal-soft text-teal flex items-center justify-center text-[10px] font-bold" title="Omar Haddad">OH</div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/results/${o.samples[0]?.id || ""}`}>
                          <Button variant="ghost" size="sm">Start</Button>
                        </Link>
                        <Link href={`/results/${o.samples[0]?.id || ""}`}>
                          <Button variant="outline" size="sm">Result Entry</Button>
                        </Link>
                        <button title="Flag" className="p-1.5 rounded-md text-gray hover:text-warning hover:bg-warning-soft transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                        </button>
                      </div>
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
