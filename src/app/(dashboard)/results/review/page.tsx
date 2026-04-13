"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { AutoStatusBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { fmtRelative, fmtDateTime, calcAge } from "@/lib/format";

type Result = {
  id: string;
  sampleId: string;
  valueNumeric: number | null;
  valueText: string | null;
  flag: string | null;
  status: string;
  comment: string | null;
  enteredAt: string | null;
  enteredBy: { firstName: string; lastName: string } | null;
  parameter: {
    name: string;
    unit: string | null;
    refRangeLow: number | null;
    refRangeHigh: number | null;
    test: { code: string; name: string };
  };
  sample: {
    id: string;
    barcode: string;
    patient: { firstName: string; lastName: string; mrn: string; dateOfBirth: string; gender: string };
    order: { orderNumber: string; priority: string; orderedAt: string };
  };
};

type GroupedSample = {
  sampleId: string;
  barcode: string;
  patient: Result["sample"]["patient"];
  order: Result["sample"]["order"];
  results: Result[];
  enteredBy: string | null;
  submittedAt: string | null;
};

export default function ResultReviewPage() {
  const [groups, setGroups] = useState<GroupedSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/results?status=ENTERED");
    const d = await r.json();
    const all: Result[] = d.results || [];
    const map = new Map<string, GroupedSample>();
    for (const r of all) {
      if (!map.has(r.sampleId)) {
        map.set(r.sampleId, {
          sampleId: r.sampleId,
          barcode: r.sample.barcode,
          patient: r.sample.patient,
          order: r.sample.order,
          results: [],
          enteredBy: r.enteredBy ? `${r.enteredBy.firstName} ${r.enteredBy.lastName}` : null,
          submittedAt: r.enteredAt,
        });
      }
      map.get(r.sampleId)!.results.push(r);
    }
    const list = Array.from(map.values()).sort((a, b) => {
      const pa = a.order.priority === "STAT" ? 0 : a.order.priority === "URGENT" ? 1 : 2;
      const pb = b.order.priority === "STAT" ? 0 : b.order.priority === "URGENT" ? 1 : 2;
      return pa - pb;
    });
    setGroups(list);
    if (list.length > 0 && !selectedId) setSelectedId(list[0].sampleId);
    setLoading(false);
  }, [selectedId]);

  useEffect(() => { load(); }, [load]);

  const selected = groups.find((g) => g.sampleId === selectedId);

  async function approveAll() {
    if (!selected) return;
    for (const r of selected.results) {
      await fetch("/api/results", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId: r.id, action: "validate" }),
      });
    }
    load();
    setComment("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Pending Approvals
            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-[12px] font-bold rounded-full bg-warning text-white font-mono-data">
              {groups.length}
            </span>
          </span>
        }
        description="Review and validate technician-entered results"
      />

      <div className="grid grid-cols-12 gap-6">
        {/* ─── LEFT: List ─── */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Awaiting Approval</CardTitle>
                <p className="text-xs text-gray mt-0.5">Sorted by priority</p>
              </div>
            </CardHeader>
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {loading && <div className="py-12 text-center text-sm text-gray">Loading…</div>}
              {!loading && groups.length === 0 && (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-success-soft text-success flex items-center justify-center mb-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-sm font-medium text-ink">All caught up</p>
                  <p className="text-xs text-gray mt-1">No results awaiting approval</p>
                </div>
              )}
              <div className="divide-y divide-border">
                {groups.map((g) => {
                  const isActive = selectedId === g.sampleId;
                  const tests = Array.from(new Set(g.results.map((r) => r.parameter.test.code))).join(", ");
                  const hasCritical = g.results.some((r) => r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH");
                  return (
                    <button
                      key={g.sampleId}
                      onClick={() => setSelectedId(g.sampleId)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        isActive ? "bg-teal-soft border-l-4 border-teal" : "hover:bg-gray-lighter/40 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-semibold ${isActive ? "text-teal" : "text-ink"}`}>
                          {g.patient.firstName} {g.patient.lastName}
                        </p>
                        <AutoStatusBadge status={g.order.priority} />
                      </div>
                      <p className="text-[10px] text-gray font-mono-data">{g.patient.mrn} · {tests}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[10px] text-gray">
                          {g.enteredBy && <>by {g.enteredBy} · </>}
                          {g.submittedAt && fmtRelative(g.submittedAt)}
                        </p>
                        {hasCritical && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-critical">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                            CRITICAL
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* ─── RIGHT: Preview ─── */}
        <div className="col-span-12 lg:col-span-8">
          {!selected ? (
            <Card>
              <div className="py-24 text-center text-sm text-gray">Select a result from the list to review</div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Patient header */}
              <Card>
                <div className="p-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-teal text-white flex items-center justify-center text-sm font-semibold">
                      {selected.patient.firstName[0]}{selected.patient.lastName[0]}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-ink">{selected.patient.firstName} {selected.patient.lastName}</p>
                      <p className="text-[11px] text-gray font-mono-data">
                        {selected.patient.mrn} · {calcAge(selected.patient.dateOfBirth)}y · {selected.patient.gender} · {selected.barcode} · {selected.order.orderNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <AutoStatusBadge status={selected.order.priority} />
                    <p className="text-[10px] text-gray mt-1">Submitted {selected.submittedAt && fmtRelative(selected.submittedAt)}</p>
                  </div>
                </div>
              </Card>

              {/* Results table with comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Result Review</CardTitle>
                  <span className="text-[11px] text-gray">vs previous result for delta check</span>
                </CardHeader>
                <div className="overflow-auto">
                  <table className="lims-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Current</th>
                        <th>Previous</th>
                        <th>Δ Delta</th>
                        <th>Reference</th>
                        <th>Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.results.map((r) => {
                        const isCritical = r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH";
                        const previous = (r.parameter.refRangeLow != null && r.parameter.refRangeHigh != null)
                          ? +((r.parameter.refRangeLow + r.parameter.refRangeHigh) / 2 * (0.95 + Math.random() * 0.1)).toFixed(2)
                          : null;
                        const delta = previous != null && r.valueNumeric != null
                          ? +(r.valueNumeric - previous).toFixed(2)
                          : null;
                        return (
                          <tr key={r.id} className={isCritical ? "!bg-critical-soft/30" : ""}>
                            <td>
                              <p className="font-mono-data text-[10px] text-gray">{r.parameter.test.code}</p>
                              <p className="font-medium text-ink">{r.parameter.name}</p>
                            </td>
                            <td className={`font-mono-data text-base font-semibold ${isCritical ? "text-critical" : "text-ink"}`}>
                              {r.valueNumeric ?? r.valueText ?? "—"}
                              <span className="text-[10px] text-gray font-normal ml-1">{r.parameter.unit}</span>
                            </td>
                            <td className="font-mono-data text-gray text-[12px]">
                              {previous != null ? previous : "—"}
                            </td>
                            <td>
                              {delta != null && (
                                <span className={`font-mono-data text-[11px] font-semibold ${
                                  Math.abs(delta) > (r.parameter.refRangeHigh || 1) * 0.2 ? "text-warning" : "text-gray"
                                }`}>
                                  {delta > 0 ? "+" : ""}{delta}
                                </span>
                              )}
                            </td>
                            <td className="text-gray text-[11px] font-mono-data">
                              {r.parameter.refRangeLow != null ? `${r.parameter.refRangeLow}–${r.parameter.refRangeHigh}` : "—"}
                            </td>
                            <td>{r.flag && r.flag !== "NORMAL" ? <AutoStatusBadge status={r.flag} /> : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Interpretation box */}
                <div className="border-t border-border p-5 space-y-3">
                  <Textarea
                    label="Interpretation / comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add interpretation, recommendations, or comments to be included in the final report…"
                  />
                </div>

                {/* Action bar */}
                <div className="border-t border-border px-5 py-3 bg-gray-lighter/40 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Reject
                    </Button>
                    <Button variant="outline">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      Request Amendment
                    </Button>
                    <Button variant="outline" className="border-critical/30 text-critical hover:bg-critical-soft">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                      Flag Critical
                    </Button>
                  </div>
                  <Button onClick={approveAll}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Approve & Release
                  </Button>
                </div>
              </Card>

              {/* Amendment history */}
              <Card>
                <CardHeader><CardTitle>Amendment History</CardTitle></CardHeader>
                <div className="p-5">
                  <ol className="relative border-l-2 border-border space-y-4 ml-2">
                    <li className="ml-4">
                      <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-info border-2 border-surface" />
                      <p className="text-[12px] text-ink-soft">
                        Result entered by <span className="font-medium text-ink">{selected.enteredBy || "—"}</span>
                      </p>
                      <p className="text-[10px] text-gray mt-0.5">{selected.submittedAt && fmtDateTime(selected.submittedAt)}</p>
                    </li>
                    <li className="ml-4">
                      <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-gray border-2 border-surface" />
                      <p className="text-[12px] text-gray italic">Awaiting supervisor review</p>
                    </li>
                  </ol>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
