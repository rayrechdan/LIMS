"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AutoStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDateTime } from "@/lib/format";

type Sample = {
  id: string;
  barcode: string;
  specimenType: string;
  status: string;
  createdAt: string;
  patient: { firstName: string; lastName: string; mrn: string };
  order: { orderNumber: string; priority: string };
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "COLLECTED", label: "Collected" },
  { value: "RECEIVED", label: "Received" },
  { value: "IN_PROCESS", label: "In Process" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
];

export default function SamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const r = await fetch(`/api/samples?${params}`);
    const d = await r.json();
    setSamples(d.samples || []);
    setLoading(false);
  }, [status, q]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/samples/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Samples"
        description="Specimen tracking, intake, and chain of custody"
        actions={
          <Link href="/samples/intake">
            <Button>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Intake
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="px-6 py-3 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search barcode, patient…" className="pl-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  status === f.value ? "bg-teal text-white border-teal" : "bg-surface text-gray border-border hover:border-teal/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray ml-auto">{samples.length} samples</span>
        </div>

        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Order</th>
                <th>Patient</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Collected</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-10 text-gray">Loading…</td></tr>}
              {!loading && samples.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray">No samples found</td></tr>}
              {samples.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono-data text-[12px] text-teal">{s.barcode}</td>
                  <td className="font-mono-data text-[11px] text-gray">{s.order.orderNumber}</td>
                  <td className="font-medium">{s.patient.firstName} {s.patient.lastName}</td>
                  <td>{s.specimenType}</td>
                  <td><AutoStatusBadge status={s.order.priority} /></td>
                  <td><AutoStatusBadge status={s.status} /></td>
                  <td className="text-gray text-[12px]">{fmtDateTime(s.createdAt)}</td>
                  <td className="text-right">
                    {s.status === "COLLECTED" && (
                      <button onClick={() => updateStatus(s.id, "RECEIVED")} className="text-xs text-teal hover:underline">Receive</button>
                    )}
                    {s.status === "RECEIVED" && (
                      <button onClick={() => updateStatus(s.id, "IN_PROCESS")} className="text-xs text-teal hover:underline">Start</button>
                    )}
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
