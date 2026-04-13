"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TrendChart, TrendPoint } from "@/components/charts/TrendChart";
import { fmtDate } from "@/lib/format";

type Param = {
  parameterId: string;
  code: string;
  name: string;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  points: { id: string; date: string; value: number; flag: string | null }[];
};

const RANGES = [
  { key: "3M", label: "3M", days: 90 },
  { key: "6M", label: "6M", days: 180 },
  { key: "1Y", label: "1Y", days: 365 },
  { key: "ALL", label: "All time", days: 99999 },
];

export default function HealthTrendsPage() {
  const [params, setParams] = useState<Param[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryId, setPrimaryId] = useState<string>("");
  const [secondaryId, setSecondaryId] = useState<string>("");
  const [range, setRange] = useState<string>("6M");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/portal/trends");
    const d = await r.json();
    const list: Param[] = d.parameters || [];
    setParams(list);
    if (list.length > 0) setPrimaryId(list[0].parameterId);
    if (list.length > 1) setSecondaryId(list[1].parameterId);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cutoffDate = useMemo(() => {
    const r = RANGES.find((x) => x.key === range)!;
    return new Date(Date.now() - r.days * 86400000);
  }, [range]);

  function filterPoints(p: Param): TrendPoint[] {
    return p.points
      .filter((pt) => new Date(pt.date) >= cutoffDate)
      .map((pt) => ({ label: new Date(pt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: pt.value, flag: pt.flag as TrendPoint["flag"] }));
  }

  const primary = params.find((p) => p.parameterId === primaryId);
  const secondary = params.find((p) => p.parameterId === secondaryId);

  return (
    <div className="space-y-6">
      <PageHeader title="Health Trends" description="Track how your test values change over time" />

      {/* Controls */}
      <Card>
        <div className="px-6 py-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[11px] font-medium text-gray mb-1.5">Test parameter</label>
            <select value={primaryId} onChange={(e) => setPrimaryId(e.target.value)} className="max-w-md">
              {params.map((p) => <option key={p.parameterId} value={p.parameterId}>{p.code} · {p.name}{p.unit ? ` (${p.unit})` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray mb-1.5">Date range</label>
            <div className="flex items-center gap-1 bg-gray-lighter rounded-lg p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                    range === r.key ? "bg-surface text-teal shadow-sm" : "text-gray hover:text-ink"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Primary chart */}
      {loading ? (
        <Card><div className="py-16 text-center text-sm text-gray">Loading trend data…</div></Card>
      ) : !primary ? (
        <Card><div className="py-16 text-center text-sm text-gray">No trend data available yet</div></Card>
      ) : (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{primary.name}</CardTitle>
              <p className="text-xs text-gray mt-0.5 font-mono-data">
                {primary.code} · Reference range: {primary.refLow}–{primary.refHigh} {primary.unit}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal" />
                <span className="text-gray">Your value</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-success/40 bg-success/10" />
                <span className="text-gray">Normal range</span>
              </span>
            </div>
          </CardHeader>
          <div className="p-6">
            <TrendChart
              data={filterPoints(primary)}
              refLow={primary.refLow}
              refHigh={primary.refHigh}
              unit={primary.unit || ""}
            />
          </div>
        </Card>
      )}

      {/* Data table */}
      {primary && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Values</CardTitle>
            <span className="text-[11px] text-gray">{filterPoints(primary).length} measurement{filterPoints(primary).length === 1 ? "" : "s"}</span>
          </CardHeader>
          <div className="overflow-auto">
            <table className="lims-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {primary.points.filter((pt) => new Date(pt.date) >= cutoffDate).map((pt) => {
                  const isCritical = pt.flag === "CRITICAL_LOW" || pt.flag === "CRITICAL_HIGH";
                  const isAbnormal = pt.flag && pt.flag !== "NORMAL" && !isCritical;
                  return (
                    <tr key={pt.id} className={isCritical ? "!bg-critical-soft/30" : ""}>
                      <td className="text-gray text-[12px]">{fmtDate(pt.date)}</td>
                      <td className={`font-mono-data font-semibold ${isCritical ? "text-critical" : isAbnormal ? "text-warning" : "text-ink"}`}>
                        {pt.value}
                      </td>
                      <td className="text-gray text-[12px]">{primary.unit || "—"}</td>
                      <td className="font-mono-data text-[11px] text-gray">{primary.refLow}–{primary.refHigh}</td>
                      <td>
                        {isCritical ? <StatusBadge tone="critical">Critical</StatusBadge>
                          : isAbnormal ? <StatusBadge tone="warning">{pt.flag === "HIGH" ? "High" : "Low"}</StatusBadge>
                          : <StatusBadge tone="success">Normal</StatusBadge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Comparison chart */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Compare Another Parameter</CardTitle>
            <p className="text-xs text-gray mt-0.5">View a second test value alongside the first</p>
          </div>
          <select value={secondaryId} onChange={(e) => setSecondaryId(e.target.value)} className="max-w-xs">
            <option value="">— None —</option>
            {params.filter((p) => p.parameterId !== primaryId).map((p) => (
              <option key={p.parameterId} value={p.parameterId}>{p.code} · {p.name}</option>
            ))}
          </select>
        </CardHeader>
        <div className="p-6">
          {!secondary ? (
            <div className="py-12 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-light"><polyline points="3 17 9 11 13 15 21 7"/></svg>
              <p className="text-sm text-gray">Select a parameter to compare</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-ink">{secondary.name}</h4>
                  <p className="text-[11px] text-gray font-mono-data">{secondary.code} · {secondary.refLow}–{secondary.refHigh} {secondary.unit}</p>
                </div>
              </div>
              <TrendChart
                data={filterPoints(secondary)}
                refLow={secondary.refLow}
                refHigh={secondary.refHigh}
                unit={secondary.unit || ""}
                color="#2563EB"
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
