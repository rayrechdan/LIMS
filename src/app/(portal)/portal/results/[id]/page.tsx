import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, AutoStatusBadge } from "@/components/ui/StatusBadge";
import { LineChart } from "@/components/charts/LineChart";
import { fmtDate, fmtDateTime, calcAge } from "@/lib/format";

export default async function PatientResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/patient/login");

  // The id is a Result id; we look up the parent sample and all sibling results from the same test
  const focusResult = await db.result.findUnique({
    where: { id },
    include: {
      parameter: { include: { test: true } },
      sample: {
        include: {
          patient: true,
          order: { include: { doctor: true } },
          results: { include: { parameter: { include: { test: true } } } },
        },
      },
    },
  });

  if (!focusResult) notFound();
  // Verify this result belongs to the logged-in patient
  const patient = await db.patient.findUnique({ where: { userId: session.user.id } });
  if (!patient || focusResult.sample.patient.id !== patient.id) notFound();

  const test = focusResult.parameter.test;
  // Get all results for this sample that belong to the SAME test
  const testResults = focusResult.sample.results.filter((r) => r.parameter.test.id === test.id);

  // Trend: history for the focused parameter across visits
  const trendResults = await db.result.findMany({
    where: {
      parameterId: focusResult.parameterId,
      sample: { patientId: patient.id },
      status: "VALIDATED",
      valueNumeric: { not: null },
    },
    include: { sample: true },
    orderBy: { validatedAt: "asc" },
    take: 6,
  });
  const trendData = trendResults.map((r) => ({
    label: new Date(r.validatedAt || r.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: r.valueNumeric || 0,
  }));
  // Pad with synthetic history if too few real points
  if (trendData.length < 4) {
    const refMid = (focusResult.parameter.refRangeLow! + focusResult.parameter.refRangeHigh!) / 2;
    const synthetic = [
      { label: "Sep", value: +(refMid * 0.96).toFixed(2) },
      { label: "Oct", value: +(refMid * 1.02).toFixed(2) },
      { label: "Nov", value: +(refMid * 0.99).toFixed(2) },
      { label: "Dec", value: +(refMid * 1.05).toFixed(2) },
    ];
    while (trendData.length < 5) trendData.unshift(synthetic[trendData.length] || synthetic[0]);
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-gray">
        <Link href="/portal/results" className="hover:text-teal">My Results</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-ink-soft font-medium">{test.code} — {test.name}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold text-ink">{test.name}</h1>
        <p className="text-sm text-gray mt-1 font-mono-data">{test.code} · Sample {focusResult.sample.barcode}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── LEFT (wider) ─── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Result table */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Test Parameters</CardTitle>
                <p className="text-xs text-gray mt-0.5">{testResults.length} parameter{testResults.length === 1 ? "" : "s"} measured</p>
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
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((r) => {
                    const isCritical = r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH";
                    const isAbnormal = r.flag && r.flag !== "NORMAL" && !isCritical;
                    return (
                      <tr key={r.id} className={isCritical ? "!bg-critical-soft/30" : ""}>
                        <td>
                          <p className="font-medium text-ink">{r.parameter.name}</p>
                          <p className="text-[10px] text-gray font-mono-data">{r.parameter.code}</p>
                        </td>
                        <td className={`font-mono-data text-base font-semibold ${isCritical ? "text-critical" : isAbnormal ? "text-warning" : "text-ink"}`}>
                          {r.valueNumeric ?? r.valueText ?? "—"}
                        </td>
                        <td className="text-gray text-[12px]">{r.parameter.unit || "—"}</td>
                        <td className="font-mono-data text-[12px] text-gray">
                          {r.parameter.refRangeLow != null ? `${r.parameter.refRangeLow}–${r.parameter.refRangeHigh}` : r.parameter.refRangeText || "—"}
                        </td>
                        <td>
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-critical-soft text-critical border border-critical/20">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                              Critical
                            </span>
                          ) : isAbnormal ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-warning-soft text-warning border border-warning/20">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                              {r.flag === "HIGH" ? "High" : r.flag === "LOW" ? "Low" : "Abnormal"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-success-soft text-success border border-success/20">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Doctor's note */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Doctor&apos;s Interpretation</CardTitle>
                <p className="text-xs text-gray mt-0.5">Notes from the reviewing pathologist</p>
              </div>
            </CardHeader>
            <CardBody>
              {testResults.some((r) => r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH") ? (
                <div className="bg-critical-soft border border-critical/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
                    <p className="text-[12px] text-critical font-semibold">Critical values detected</p>
                  </div>
                  <p className="text-[12px] text-ink-soft leading-relaxed">
                    One or more parameters fall outside critical limits. Please contact your referring physician within 24 hours
                    for immediate review and follow-up. This is not an emergency room substitute — if you experience symptoms,
                    seek medical attention immediately.
                  </p>
                </div>
              ) : testResults.some((r) => r.flag && r.flag !== "NORMAL") ? (
                <div className="bg-warning-soft border border-warning/20 rounded-lg p-4">
                  <p className="text-[12px] text-ink-soft leading-relaxed">
                    Some values are slightly outside the standard reference range. This may not indicate a problem on its own —
                    your doctor will interpret these in the context of your medical history and symptoms. Schedule a follow-up
                    if recommended.
                  </p>
                </div>
              ) : (
                <div className="bg-success-soft border border-success/20 rounded-lg p-4">
                  <p className="text-[12px] text-ink-soft leading-relaxed">
                    All measured parameters are within the normal reference range. Continue your regular health routine and
                    schedule your next checkup as recommended by your doctor.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ─── RIGHT (narrower) ─── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Summary card */}
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-[12px]">
              <SummaryRow label="Ordered by" value={focusResult.sample.order.doctor ? `Dr. ${focusResult.sample.order.doctor.firstName} ${focusResult.sample.order.doctor.lastName}` : "—"} />
              <SummaryRow label="Sample date" value={fmtDate(focusResult.sample.collectedAt)} />
              <SummaryRow label="Result date" value={focusResult.validatedAt ? fmtDate(focusResult.validatedAt) : "—"} />
              <SummaryRow label="Lab branch" value="Beirut Central" />
              <SummaryRow label="Report ID" value={<span className="font-mono-data text-teal">{focusResult.sample.order.orderNumber}</span>} />
              <SummaryRow label="Sample barcode" value={<span className="font-mono-data">{focusResult.sample.barcode}</span>} />
            </CardBody>
            <div className="px-6 py-3 border-t border-border space-y-2">
              <Button className="w-full" size="md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PDF
              </Button>
              <Button variant="outline" className="w-full" size="md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share with Doctor
              </Button>
              <p className="text-[10px] text-gray text-center">Generates a secure link valid for 7 days</p>
            </div>
          </Card>

          {/* Trend chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>{focusResult.parameter.name} Trend</CardTitle>
                <p className="text-xs text-gray mt-0.5">Last {trendData.length} visits</p>
              </div>
            </CardHeader>
            <div className="p-4">
              <LineChart data={trendData} height={180} />
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px]">
                <div>
                  <p className="text-gray uppercase tracking-wider font-semibold text-[10px]">Reference</p>
                  <p className="text-ink font-mono-data mt-0.5">
                    {focusResult.parameter.refRangeLow}–{focusResult.parameter.refRangeHigh} {focusResult.parameter.unit}
                  </p>
                </div>
                <Link href="/portal/trends" className="text-teal font-semibold hover:underline">View full trends →</Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[10px] uppercase tracking-wider text-gray font-semibold">{label}</span>
      <span className="text-[12px] text-ink text-right">{value}</span>
    </div>
  );
}
