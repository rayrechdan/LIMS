import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AutoStatusBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate, fmtDateTime, calcAge } from "@/lib/format";

export default async function DoctorPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");
  const doctor = await db.doctor.findUnique({ where: { userId: session.user.id } });
  if (!doctor) redirect("/doctor");

  const patient = await db.patient.findUnique({
    where: { id },
    include: {
      orders: {
        where: { doctorId: doctor.id },
        orderBy: { orderedAt: "desc" },
        include: {
          items: { include: { test: true } },
          samples: {
            include: {
              results: { include: { parameter: { include: { test: true } } } },
            },
          },
        },
      },
    },
  });
  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/doctor/patients" className="text-xs text-gray hover:text-teal">← Back to my patients</Link>
        <div className="flex items-end justify-between mt-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-soft text-teal flex items-center justify-center text-base font-semibold">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-ink">{patient.firstName} {patient.lastName}</h1>
              <p className="text-sm text-gray mt-0.5 font-mono-data">{patient.mrn} · {calcAge(patient.dateOfBirth)} years · {patient.gender}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/orders/new?patient=${patient.id}&doctor=${doctor.id}`}>
              <Button variant="outline" size="md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Order
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Demographics card */}
      <div className="grid grid-cols-3 gap-4">
        <DemoCard label="Date of Birth" value={fmtDate(patient.dateOfBirth)} />
        <DemoCard label="Phone" value={patient.phone || "—"} />
        <DemoCard label="Blood Type" value={patient.bloodType || "—"} />
      </div>

      {/* Orders + results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Orders & Results</CardTitle>
          <span className="text-[11px] text-gray">{patient.orders.length} orders</span>
        </CardHeader>
        {patient.orders.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray">No orders for this patient</div>
        ) : (
          <div className="divide-y divide-border">
            {patient.orders.map((o) => {
              const allResults = o.samples.flatMap((s) => s.results);
              const validated = allResults.filter((r) => r.status === "VALIDATED");
              const released = o.status === "COMPLETED" || validated.length === allResults.length;
              return (
                <div key={o.id} className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-[12px] font-mono-data text-teal">{o.orderNumber}</p>
                      <p className="text-sm font-semibold text-ink mt-0.5">
                        {o.items.map((i) => i.test.name).join(", ")}
                      </p>
                      <p className="text-[11px] text-gray mt-0.5">{fmtDateTime(o.orderedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AutoStatusBadge status={o.priority} />
                      <AutoStatusBadge status={o.status} />
                      {released && (
                        <Button variant="outline" size="sm">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          PDF
                        </Button>
                      )}
                    </div>
                  </div>

                  {released && validated.length > 0 ? (
                    <div className="mt-3 border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="bg-gray-lighter">
                            <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray">Test</th>
                            <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray">Parameter</th>
                            <th className="text-center px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray">Result</th>
                            <th className="text-center px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray">Reference</th>
                            <th className="text-center px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray">Flag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validated.map((r) => {
                            const isCritical = r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH";
                            return (
                              <tr key={r.id} className={`border-t border-border ${isCritical ? "bg-critical-soft/30" : ""}`}>
                                <td className="px-4 py-2 font-mono-data text-[11px] text-gray">{r.parameter.test.code}</td>
                                <td className="px-4 py-2 font-medium text-ink">{r.parameter.name}</td>
                                <td className="px-4 py-2 text-center font-mono-data font-semibold text-ink">
                                  {r.valueNumeric ?? r.valueText ?? "—"}{" "}
                                  <span className="text-gray text-[10px] font-normal">{r.parameter.unit}</span>
                                </td>
                                <td className="px-4 py-2 text-center font-mono-data text-gray text-[11px]">
                                  {r.parameter.refRangeLow != null ? `${r.parameter.refRangeLow}–${r.parameter.refRangeHigh}` : r.parameter.refRangeText || "—"}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {r.flag && r.flag !== "NORMAL" ? <AutoStatusBadge status={r.flag} /> : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {validated.some((r) => r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH") && (
                        <div className="bg-critical-soft border-t border-critical/15 px-4 py-2.5 flex items-start gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
                          <p className="text-[11px] text-critical">
                            <strong>Interpretation note:</strong> Results contain values outside critical limits. Patient should be contacted urgently for follow-up evaluation.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-lighter/50 border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <p className="text-xs text-gray">
                        {validated.length}/{allResults.length} parameters validated. Results will be available once all are signed off.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function DemoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-lg border border-border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{label}</p>
      <p className="text-base font-semibold text-ink mt-1">{value}</p>
    </div>
  );
}
