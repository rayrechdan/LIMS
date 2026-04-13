"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtRelative } from "@/lib/format";

type Sample = {
  id: string;
  barcode: string;
  status: string;
  specimenType: string;
  createdAt: string;
  patient: { firstName: string; lastName: string; mrn: string };
  order: { orderNumber: string; priority: string; items: { test: { code: string; name: string; category: { name: string } } }[] };
  collectedBy: { firstName: string; lastName: string } | null;
};

const COLUMNS = [
  { key: "RECEIVED", title: "Received", color: "info", icon: "inbox" },
  { key: "IN_PROCESS", title: "In Processing", color: "warning", icon: "loader" },
  { key: "ANALYZING", title: "Analyzing", color: "warning", icon: "flask" },
  { key: "PENDING", title: "Results Pending", color: "info", icon: "clock" },
  { key: "COMPLETED", title: "Completed", color: "success", icon: "check" },
  { key: "REJECTED", title: "Rejected", color: "critical", icon: "x" },
] as const;

const colHeader = {
  info: "border-info/30 bg-info-soft text-info",
  warning: "border-warning/30 bg-warning-soft text-warning",
  success: "border-success/30 bg-success-soft text-success",
  critical: "border-critical/30 bg-critical-soft text-critical",
};

const colIcons: Record<string, React.ReactNode> = {
  inbox: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  loader: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/></svg>,
  flask: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

export default function SampleBoardPage() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/samples");
    const d = await r.json();
    setSamples(d.samples || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = samples.filter((s) => {
    if (search && !`${s.barcode} ${s.patient.firstName} ${s.patient.lastName}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter && s.order.priority !== priorityFilter) return false;
    if (departmentFilter) {
      const hasDept = s.order.items.some((i) => i.test.category.name === departmentFilter);
      if (!hasDept) return false;
    }
    return true;
  });

  // Map samples to columns. RECEIVED column maps to RECEIVED status, etc.
  // PENDING column shows samples with status IN_PROCESS that have results not yet validated
  const columns = COLUMNS.map((col) => {
    let items: Sample[] = [];
    if (col.key === "RECEIVED") items = filtered.filter((s) => s.status === "RECEIVED" || s.status === "COLLECTED");
    else if (col.key === "IN_PROCESS") items = filtered.filter((s) => s.status === "IN_PROCESS").slice(0, 2);
    else if (col.key === "ANALYZING") items = filtered.filter((s) => s.status === "IN_PROCESS").slice(2);
    else if (col.key === "PENDING") items = [];
    else if (col.key === "COMPLETED") items = filtered.filter((s) => s.status === "COMPLETED");
    else if (col.key === "REJECTED") items = filtered.filter((s) => s.status === "REJECTED");
    return { ...col, items };
  });

  const departments = Array.from(new Set(samples.flatMap((s) => s.order.items.map((i) => i.test.category.name))));

  async function moveTo(sampleId: string, newStatus: string) {
    // Map column key to actual sample status
    const statusMap: Record<string, string> = {
      RECEIVED: "RECEIVED",
      IN_PROCESS: "IN_PROCESS",
      ANALYZING: "IN_PROCESS",
      PENDING: "IN_PROCESS",
      COMPLETED: "COMPLETED",
      REJECTED: "REJECTED",
    };
    await fetch(`/api/samples/${sampleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusMap[newStatus] || newStatus }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Sample Tracking" description="Drag samples between columns to update status" />

      {/* Filter bar */}
      <Card>
        <div className="px-6 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search barcode or patient…" className="pl-9" />
          </div>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="max-w-[150px]">
            <option value="">All priorities</option>
            <option value="STAT">STAT</option>
            <option value="URGENT">Urgent</option>
            <option value="ROUTINE">Routine</option>
          </select>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="max-w-[200px]">
            <option value="">All departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="date" className="max-w-[150px]" defaultValue={new Date().toISOString().slice(0, 10)} />
          <span className="text-xs text-gray ml-auto">{filtered.length} samples</span>
        </div>
      </Card>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-6 gap-4 min-w-[1300px]">
          {columns.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={() => {
                if (draggedId) {
                  moveTo(draggedId, col.key);
                  setDraggedId(null);
                }
              }}
              className="flex flex-col bg-gray-lighter/40 rounded-lg border border-border min-h-[600px]"
            >
              <div className={`px-4 py-3 border-b border-border flex items-center justify-between rounded-t-lg ${colHeader[col.color]}`}>
                <div className="flex items-center gap-2">
                  {colIcons[col.icon]}
                  <p className="text-[11px] font-semibold uppercase tracking-wider">{col.title}</p>
                </div>
                <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-surface">
                  {col.items.length}
                </span>
              </div>
              <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                {col.items.length === 0 ? (
                  <div className="py-12 text-center text-[11px] text-gray-light">Drop samples here</div>
                ) : col.items.map((s) => (
                  <SampleCard key={s.id} sample={s} onDragStart={() => setDraggedId(s.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SampleCard({ sample, onDragStart }: { sample: Sample; onDragStart: () => void }) {
  const isStat = sample.order.priority === "STAT";
  const isUrgent = sample.order.priority === "URGENT";
  const tests = sample.order.items.map((i) => i.test.code).join(", ");

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`bg-surface rounded-lg border ${isStat ? "border-critical/40 ring-1 ring-critical/15" : "border-border"} p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-teal/30 transition-all`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M3 5v14"/><path d="M8 5v14"/><path d="M12 5v14"/><path d="M17 5v14"/><path d="M21 5v14"/>
          </svg>
          <p className="font-mono-data text-[10px] text-teal truncate">{sample.barcode}</p>
        </div>
        {isStat && <StatusBadge tone="critical">STAT</StatusBadge>}
        {isUrgent && <StatusBadge tone="warning">Urgent</StatusBadge>}
      </div>

      <p className="text-[12px] font-semibold text-ink truncate">{sample.patient.firstName} {sample.patient.lastName}</p>
      <p className="text-[10px] text-gray font-mono-data mt-0.5">{sample.patient.mrn}</p>

      <div className="mt-2 pt-2 border-t border-border flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-gray uppercase tracking-wider">Tests</p>
          <p className="text-[11px] text-ink-soft truncate">{tests}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-gray">
        <span className="flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {fmtRelative(sample.createdAt)}
        </span>
        {sample.collectedBy && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-soft text-teal text-[8px] font-bold" title={`${sample.collectedBy.firstName} ${sample.collectedBy.lastName}`}>
            {sample.collectedBy.firstName[0]}{sample.collectedBy.lastName[0]}
          </span>
        )}
      </div>
    </div>
  );
}
