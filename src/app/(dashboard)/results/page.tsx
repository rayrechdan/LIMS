"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { AutoStatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/lib/format";
import Link from "next/link";

type Result = {
  id: string;
  valueNumeric: number | null;
  valueText: string | null;
  flag: string | null;
  status: string;
  updatedAt: string;
  sample: {
    id: string;
    barcode: string;
    patient: { firstName: string; lastName: string; mrn: string };
    order: { orderNumber: string; priority: string };
  };
  parameter: {
    name: string;
    unit: string | null;
    refRangeLow: number | null;
    refRangeHigh: number | null;
    test: { code: string };
  };
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ENTERED", label: "Awaiting Validation" },
  { value: "VALIDATED", label: "Validated" },
];

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState("ENTERED");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const r = await fetch(`/api/results?${params}`);
    const d = await r.json();
    setResults(d.results || []);
    setLoading(false);
  }, [status]);

  useEffect(() => { load(); }, [load]);

  // Group by sample
  const groupedBySample = results.reduce<Record<string, Result[]>>((acc, r) => {
    if (!acc[r.sample.id]) acc[r.sample.id] = [];
    acc[r.sample.id].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader title="Tests & Results" description="Result entry, validation, and review" />

      <Card>
        <div className="px-6 py-3 border-b border-border flex items-center gap-3">
          <div className="flex gap-1.5">
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
          <span className="text-xs text-gray ml-auto">{results.length} results</span>
        </div>

        {loading && <div className="py-12 text-center text-sm text-gray">Loading…</div>}

        {!loading && Object.keys(groupedBySample).length === 0 && (
          <div className="py-12 text-center text-sm text-gray">No results in this state</div>
        )}

        <div className="divide-y divide-border">
          {Object.entries(groupedBySample).map(([sampleId, list]) => {
            const first = list[0];
            return (
              <div key={sampleId} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Link href={`/results/${sampleId}`} className="text-sm font-semibold text-ink hover:text-teal">
                      {first.sample.patient.firstName} {first.sample.patient.lastName}
                    </Link>
                    <p className="text-[11px] text-gray font-mono-data mt-0.5">
                      {first.sample.patient.mrn} · {first.sample.barcode} · {first.sample.order.orderNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AutoStatusBadge status={first.sample.order.priority} />
                    <Link href={`/results/${sampleId}`} className="text-xs text-teal hover:underline">Open →</Link>
                  </div>
                </div>
                <div className="overflow-auto">
                  <table className="lims-table">
                    <thead>
                      <tr>
                        <th>Test</th>
                        <th>Parameter</th>
                        <th>Value</th>
                        <th>Reference</th>
                        <th>Flag</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr key={r.id}>
                          <td className="font-mono-data text-[11px] text-gray">{r.parameter.test.code}</td>
                          <td className="font-medium">{r.parameter.name}</td>
                          <td className="font-mono-data text-ink">
                            {r.valueNumeric ?? r.valueText ?? "—"} <span className="text-gray text-[11px]">{r.parameter.unit}</span>
                          </td>
                          <td className="text-gray text-[12px] font-mono-data">
                            {r.parameter.refRangeLow != null ? `${r.parameter.refRangeLow}–${r.parameter.refRangeHigh}` : "—"}
                          </td>
                          <td>{r.flag ? <AutoStatusBadge status={r.flag} /> : "—"}</td>
                          <td className="text-gray text-[12px]">{fmtDateTime(r.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
