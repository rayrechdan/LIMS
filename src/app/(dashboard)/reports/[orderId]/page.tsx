import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AutoStatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate, fmtDateTime, calcAge } from "@/lib/format";

export default async function ReportPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await db.testOrder.findUnique({
    where: { id: orderId },
    include: {
      patient: true,
      doctor: true,
      items: { include: { test: true } },
      samples: {
        include: {
          results: {
            include: { parameter: { include: { test: true } } },
          },
        },
      },
    },
  });
  if (!order) notFound();

  // Group all results by test
  const allResults = order.samples.flatMap((s) => s.results);
  const byTest = new Map<string, typeof allResults>();
  for (const r of allResults) {
    const k = r.parameter.test.code;
    if (!byTest.has(k)) byTest.set(k, []);
    byTest.get(k)!.push(r);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/reports" className="text-xs text-gray hover:text-teal">← Back to reports</Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Print / PDF</Button>
          <Button size="sm">Sign & Release</Button>
        </div>
      </div>

      {/* Report layout */}
      <div className="bg-surface border border-border rounded-lg shadow-card p-10">
        {/* Letterhead */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-teal">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z" /><path d="M8 14h8" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-teal">Klev Laboratory</h1>
              <p className="text-[11px] text-gray">Diagnostic & Pathology Services</p>
            </div>
          </div>
          <div className="text-right text-[11px]">
            <p className="font-mono-data text-teal text-sm">{order.orderNumber}</p>
            <p className="text-gray mt-1">Issued {fmtDate(new Date())}</p>
          </div>
        </div>

        {/* Patient block */}
        <div className="grid grid-cols-2 gap-6 py-5 border-b border-border">
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">Patient</p>
            <p className="text-base font-semibold text-ink">{order.patient.firstName} {order.patient.lastName}</p>
            <p className="text-[12px] text-gray font-mono-data">{order.patient.mrn}</p>
            <p className="text-[12px] text-gray">{calcAge(order.patient.dateOfBirth)} years · {order.patient.gender} · DOB {fmtDate(order.patient.dateOfBirth)}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">Referring Physician</p>
            <p className="text-base font-semibold text-ink">{order.doctor ? `Dr. ${order.doctor.firstName} ${order.doctor.lastName}` : "—"}</p>
            {order.doctor?.specialty && <p className="text-[12px] text-gray">{order.doctor.specialty}</p>}
            {order.diagnosis && <p className="text-[12px] text-gray">Dx: {order.diagnosis}</p>}
          </div>
        </div>

        {/* Results sections */}
        <div className="py-5 space-y-6">
          {Array.from(byTest.entries()).map(([code, results]) => (
            <div key={code}>
              <h3 className="text-sm font-semibold text-teal pb-2 border-b border-border mb-3">
                {results[0].parameter.test.name} <span className="text-gray font-normal font-mono-data text-[11px]">({code})</span>
              </h3>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-gray">
                    <th className="font-semibold pb-2">Parameter</th>
                    <th className="font-semibold pb-2 text-center">Result</th>
                    <th className="font-semibold pb-2 text-center">Unit</th>
                    <th className="font-semibold pb-2 text-center">Reference</th>
                    <th className="font-semibold pb-2 text-center">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-2">{r.parameter.name}</td>
                      <td className="py-2 text-center font-mono-data font-semibold text-ink">{r.valueNumeric ?? r.valueText ?? "—"}</td>
                      <td className="py-2 text-center text-gray">{r.parameter.unit || "—"}</td>
                      <td className="py-2 text-center font-mono-data text-gray">
                        {r.parameter.refRangeLow != null ? `${r.parameter.refRangeLow}–${r.parameter.refRangeHigh}` : r.parameter.refRangeText || "—"}
                      </td>
                      <td className="py-2 text-center">
                        {r.flag && r.flag !== "NORMAL" ? <AutoStatusBadge status={r.flag} /> : <span className="text-gray">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t-2 border-teal flex items-end justify-between">
          <div className="text-[10px] text-gray">
            <p>This report has been generated electronically.</p>
            <p>Verified by Klev LIMS · {fmtDateTime(new Date())}</p>
          </div>
          <div className="text-right">
            <div className="border-t border-ink pt-1 px-6">
              <p className="text-[10px] text-gray">Authorized Pathologist</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
