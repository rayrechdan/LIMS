"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AutoStatusBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate } from "@/lib/format";

type Row = {
  id: string;
  testCode: string;
  testName: string;
  doctor: string;
  sampleDate: string;
  resultDate: string | null;
  status: "NORMAL" | "ABNORMAL" | "CRITICAL" | "PENDING";
  orderNumber: string;
};

const PAGE_SIZE = 10;

export default function PatientResultsListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "normal" | "abnormal" | "critical" | "pending">("");
  const [testFilter, setTestFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/portal/results");
    const d = await r.json();
    setRows(d.rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => {
    if (search && !`${r.testName} ${r.testCode} ${r.doctor}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (testFilter && r.testCode !== testFilter) return false;
    if (statusFilter === "normal" && r.status !== "NORMAL") return false;
    if (statusFilter === "abnormal" && r.status !== "ABNORMAL") return false;
    if (statusFilter === "critical" && r.status !== "CRITICAL") return false;
    if (statusFilter === "pending" && r.status !== "PENDING") return false;
    if (from && new Date(r.sampleDate) < new Date(from)) return false;
    if (to && new Date(r.sampleDate) > new Date(to)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const testCodes = Array.from(new Set(rows.map((r) => r.testCode)));

  return (
    <div className="space-y-6">
      <PageHeader title="My Results" description="All your lab results in one place" />

      <Card>
        {/* Filter bar */}
        <div className="px-6 py-4 border-b border-border space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <label className="block text-[11px] font-medium text-gray mb-1.5">Search</label>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-[34px] text-gray pointer-events-none">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Test name or doctor…" className="pl-11" />
            </div>
            <div className="min-w-[150px]">
              <label className="block text-[11px] font-medium text-gray mb-1.5">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="min-w-[150px]">
              <label className="block text-[11px] font-medium text-gray mb-1.5">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="min-w-[160px]">
              <label className="block text-[11px] font-medium text-gray mb-1.5">Test type</label>
              <select value={testFilter} onChange={(e) => setTestFilter(e.target.value)}>
                <option value="">All tests</option>
                {testCodes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-gray mr-1">Status:</span>
            {(["", "normal", "abnormal", "critical", "pending"] as const).map((s) => (
              <button
                key={s || "all"}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  statusFilter === s ? "bg-teal text-white border-teal" : "bg-surface text-gray border-border hover:border-teal/30"
                }`}
              >
                {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-2 border-b border-border bg-gray-lighter/30 flex items-center justify-between text-[11px] text-gray">
          <span>{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Ordered By</th>
                <th>Sample Date</th>
                <th>Result Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-12 text-gray">Loading…</td></tr>}
              {!loading && pageRows.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray">No results found</td></tr>}
              {pageRows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <p className="font-mono-data text-[11px] text-teal">{r.testCode}</p>
                    <p className="font-medium text-ink">{r.testName}</p>
                  </td>
                  <td className="text-gray text-[12px]">{r.doctor}</td>
                  <td className="text-gray text-[12px]">{fmtDate(r.sampleDate)}</td>
                  <td className="text-gray text-[12px]">{r.resultDate ? fmtDate(r.resultDate) : <span className="text-gray-light italic">Pending</span>}</td>
                  <td>
                    {r.status === "NORMAL" && <StatusBadge tone="success">● Normal</StatusBadge>}
                    {r.status === "ABNORMAL" && <StatusBadge tone="warning">● Abnormal</StatusBadge>}
                    {r.status === "CRITICAL" && <StatusBadge tone="critical">● Critical</StatusBadge>}
                    {r.status === "PENDING" && <StatusBadge tone="neutral">● Pending</StatusBadge>}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {r.status !== "PENDING" && (
                        <>
                          <Link href={`/portal/results/${r.id}`}>
                            <Button variant="ghost" size="sm">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              View
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            PDF
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-border bg-gray-lighter/40 flex items-center justify-between">
            <span className="text-[11px] text-gray">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-surface text-ink-soft hover:border-teal/30 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className={`min-w-[32px] px-2.5 py-1.5 text-xs rounded-md border transition-colors ${page === n ? "bg-teal text-white border-teal" : "bg-surface text-ink-soft border-border hover:border-teal/30"}`}>{n}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-surface text-ink-soft hover:border-teal/30 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
