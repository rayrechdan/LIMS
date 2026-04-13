"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { AutoStatusBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime, calcAge, fmtRelative } from "@/lib/format";

type Result = {
  id: string;
  valueNumeric: number | null;
  valueText: string | null;
  flag: string | null;
  status: string;
  comment: string | null;
  parameter: {
    id: string;
    code: string;
    name: string;
    unit: string | null;
    refRangeLow: number | null;
    refRangeHigh: number | null;
    refRangeText: string | null;
    test: { code: string; name: string };
  };
};

type Sample = {
  id: string;
  barcode: string;
  status: string;
  specimenType: string;
  createdAt: string;
  receivedAt: string | null;
  patient: { firstName: string; lastName: string; mrn: string; dateOfBirth: string; gender: string };
  order: { orderNumber: string; priority: string };
};

export default function ResultEntryPage() {
  const params = useParams();
  const sampleId = params.sampleId as string;
  const [sample, setSample] = useState<Sample | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { value: string; comment: string }>>({});
  const [criticalAcks, setCriticalAcks] = useState<Set<string>>(new Set());
  const [techNotes, setTechNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/results?sampleId=${sampleId}`);
    const d = await r.json();
    setResults(d.results || []);
    if (d.results?.[0]) setSample(d.results[0].sample);
    const draftMap: Record<string, { value: string; comment: string }> = {};
    for (const res of d.results || []) {
      draftMap[res.id] = {
        value: res.valueNumeric != null ? String(res.valueNumeric) : res.valueText || "",
        comment: res.comment || "",
      };
    }
    setDrafts(draftMap);
  }, [sampleId]);

  useEffect(() => { load(); }, [load]);

  function flagFor(value: string, low: number | null, high: number | null) {
    const num = parseFloat(value);
    if (isNaN(num) || (low == null && high == null)) return null;
    if (low != null && num < low * 0.5) return "CRITICAL_LOW";
    if (high != null && num > high * 1.5) return "CRITICAL_HIGH";
    if (low != null && num < low) return "LOW";
    if (high != null && num > high) return "HIGH";
    return "NORMAL";
  }

  async function saveResult(resultId: string) {
    const draft = drafts[resultId];
    const num = parseFloat(draft.value);
    await fetch("/api/results", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resultId,
        valueNumeric: isNaN(num) ? null : num,
        valueText: isNaN(num) ? draft.value : null,
        comment: draft.comment,
      }),
    });
    load();
  }

  async function submitForReview() {
    setSaving(true);
    for (const r of results) {
      if (drafts[r.id]?.value && r.status === "PENDING") {
        await saveResult(r.id);
      }
    }
    setSaving(false);
  }

  if (!sample) return <div className="text-sm text-gray">Loading…</div>;

  // Calculate TAT status
  const elapsedHours = (Date.now() - new Date(sample.createdAt).getTime()) / 3600000;
  const tatTone = elapsedHours > 6 ? "critical" : elapsedHours > 4 ? "warning" : "success";

  // Group by test
  const grouped = results.reduce<Record<string, Result[]>>((acc, r) => {
    const k = r.parameter.test.code;
    if (!acc[k]) acc[k] = [];
    acc[k].push(r);
    return acc;
  }, {});

  const testNames = Object.values(grouped).map((rs) => rs[0].parameter.test.name).join(", ");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/worklist" className="text-xs text-gray hover:text-teal">← Back to worklist</Link>
        <h1 className="text-2xl font-semibold text-ink mt-2">
          Result Entry · {sample.patient.firstName} {sample.patient.lastName} · {testNames}
        </h1>
      </div>

      {/* Top info bar */}
      <div className="bg-surface rounded-lg border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] grid grid-cols-2 md:grid-cols-5 divide-x divide-border">
        <InfoBlock label="Order ID" value={<span className="font-mono-data text-teal">{sample.order.orderNumber}</span>} />
        <InfoBlock label="Sample ID" value={<span className="font-mono-data text-teal">{sample.barcode}</span>} />
        <InfoBlock label="Patient" value={<>{sample.patient.firstName} {sample.patient.lastName}<br/><span className="text-[10px] text-gray font-mono-data">{calcAge(sample.patient.dateOfBirth)}y · {sample.patient.gender}</span></>} />
        <InfoBlock label="Received" value={<>{sample.receivedAt ? fmtDateTime(sample.receivedAt) : "—"}<br/><span className="text-[10px] text-gray">{fmtRelative(sample.createdAt)}</span></>} />
        <div className="px-4 py-3 flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">TAT Status</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${tatTone === "critical" ? "bg-critical animate-pulse" : tatTone === "warning" ? "bg-warning" : "bg-success"}`} />
            <p className={`text-[12px] font-mono-data font-semibold ${tatTone === "critical" ? "text-critical" : tatTone === "warning" ? "text-warning" : "text-success"}`}>
              {Math.round(elapsedHours)}h elapsed
            </p>
            <AutoStatusBadge status={sample.order.priority} />
          </div>
        </div>
      </div>

      {/* Results entry */}
      {Object.entries(grouped).map(([testCode, rows]) => (
        <Card key={testCode}>
          <CardHeader>
            <div>
              <CardTitle>{rows[0].parameter.test.name}</CardTitle>
              <p className="text-xs text-gray font-mono-data mt-0.5">{testCode}</p>
            </div>
          </CardHeader>
          <div className="overflow-auto">
            <table className="lims-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                  <th>Notify Doctor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const draft = drafts[r.id] || { value: "", comment: "" };
                  const liveFlag = flagFor(draft.value, r.parameter.refRangeLow, r.parameter.refRangeHigh);
                  const isCritical = liveFlag === "CRITICAL_LOW" || liveFlag === "CRITICAL_HIGH";
                  const validated = r.status === "VALIDATED";
                  return (
                    <tr key={r.id} className={isCritical ? "!bg-critical-soft/40 hover:!bg-critical-soft/60" : ""}>
                      <td>
                        <p className="font-medium text-ink">{r.parameter.name}</p>
                        <p className="text-[10px] text-gray font-mono-data">{r.parameter.code}</p>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={draft.value}
                          onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: { ...draft, value: e.target.value } }))}
                          disabled={validated}
                          placeholder="—"
                          className={`max-w-[140px] font-mono-data text-base font-semibold ${isCritical ? "border-critical bg-critical-soft" : ""}`}
                        />
                      </td>
                      <td className="text-gray text-[11px]">{r.parameter.unit || "—"}</td>
                      <td className="text-gray text-[11px] font-mono-data">
                        {r.parameter.refRangeLow != null ? `${r.parameter.refRangeLow}–${r.parameter.refRangeHigh}` : r.parameter.refRangeText || "—"}
                      </td>
                      <td>
                        {liveFlag ? <AutoStatusBadge status={liveFlag} /> : <span className="text-gray text-[11px]">—</span>}
                        {validated && <StatusBadge tone="success" className="ml-1">Validated</StatusBadge>}
                      </td>
                      <td>
                        {isCritical && (
                          <label className="inline-flex items-center gap-2 text-[11px] text-critical font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={criticalAcks.has(r.id)}
                              onChange={(e) => {
                                const next = new Set(criticalAcks);
                                if (e.target.checked) next.add(r.id); else next.delete(r.id);
                                setCriticalAcks(next);
                              }}
                              className="w-3.5 h-3.5 accent-critical"
                            />
                            Notify doctor *
                          </label>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.some((r) => {
            const draft = drafts[r.id];
            const flag = flagFor(draft?.value || "", r.parameter.refRangeLow, r.parameter.refRangeHigh);
            return flag === "CRITICAL_LOW" || flag === "CRITICAL_HIGH";
          }) && (
            <div className="bg-critical-soft border-t border-critical/15 px-6 py-3 flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
              <p className="text-[11px] text-critical">
                <strong>Critical value detected.</strong> Doctor notification is mandatory before submission. Check the box on each critical row to acknowledge.
              </p>
            </div>
          )}
        </Card>
      ))}

      {/* Notes + actions */}
      <Card>
        <CardBody className="space-y-4">
          <Textarea label="Technician notes" rows={3} value={techNotes} onChange={(e) => setTechNotes(e.target.value)} placeholder="Anomalies, repeats, instrument flags, etc." />
        </CardBody>
        <div className="px-6 py-3 border-t border-border bg-gray-lighter/40 flex items-center justify-between gap-2">
          <Button variant="outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Run QC Check
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost">Save Draft</Button>
            <Button onClick={submitForReview} loading={saving}>
              Submit for Review
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{label}</p>
      <p className="text-[12px] text-ink mt-1">{value}</p>
    </div>
  );
}
