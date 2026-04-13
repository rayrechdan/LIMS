"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { AutoStatusBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate, fmtDateTime, calcAge, fmtMoney, fmtRelative } from "@/lib/format";

type Patient = {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  bloodType: string | null;
  nationalId: string | null;
  allergies: string | null;
  notes: string | null;
  insuranceName: string | null;
  insuranceNumber: string | null;
  createdAt: string;
  orders: Order[];
  samples: Sample[];
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  totalPrice: number;
  paymentStatus: string;
  orderedAt: string;
  completedAt: string | null;
  doctor: { firstName: string; lastName: string; specialty: string | null } | null;
  items: { test: { code: string; name: string } }[];
};

type Sample = {
  id: string;
  barcode: string;
  specimenType: string;
  status: string;
  collectedAt: string;
};

type Result = {
  id: string;
  valueNumeric: number | null;
  valueText: string | null;
  flag: string | null;
  status: string;
  validatedAt: string | null;
  parameter: { name: string; unit: string | null; test: { code: string; name: string } };
};

export default function PatientProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [tab, setTab] = useState("overview");

  const load = useCallback(async () => {
    const r = await fetch(`/api/patients/${id}`);
    const d = await r.json();
    setPatient(d.patient);
    // Aggregate results
    const samps = d.patient?.samples || [];
    const allRes: Result[] = [];
    for (const s of samps) for (const res of s.results || []) allRes.push(res);
    setResults(allRes);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!patient) return <div className="text-sm text-gray">Loading…</div>;

  const totalSpent = patient.orders.reduce((s, o) => s + o.totalPrice, 0);
  const outstanding = patient.orders.filter((o) => o.paymentStatus !== "PAID").reduce((s, o) => s + o.totalPrice, 0);
  const lastOrder = patient.orders[0];
  const primaryDoctor = patient.orders.find((o) => o.doctor)?.doctor;
  const validatedResults = results.filter((r) => r.status === "VALIDATED");
  const criticalCount = results.filter((r) => r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH").length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/patients" className="text-xs text-gray hover:text-teal">← Back to patients</Link>
      </div>

      {/* Profile header */}
      <Card>
        <div className="p-6 flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-teal text-white flex items-center justify-center text-2xl font-semibold flex-shrink-0">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-ink">{patient.firstName} {patient.lastName}</h1>
                <p className="text-sm text-gray mt-1 font-mono-data">
                  {patient.mrn} · {calcAge(patient.dateOfBirth)} years · {patient.gender} · DOB {fmtDate(patient.dateOfBirth)}
                </p>
                {criticalCount > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-critical-soft border border-critical/20 rounded-md text-[11px] text-critical font-semibold">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {criticalCount} critical result{criticalCount > 1 ? "s" : ""} on file
                  </div>
                )}
              </div>
              <Button variant="outline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mt-4 text-[12px]">
              <ContactRow icon="phone" value={patient.phone || "—"} />
              <ContactRow icon="mail" value={patient.email || "—"} />
              <ContactRow icon="map" value={patient.address || "—"} />
              <ContactRow icon="droplet" value={patient.bloodType || "—"} />
              <ContactRow icon="id" value={patient.nationalId || "—"} />
              <ContactRow icon="shield" value={patient.insuranceName || "Self-pay"} />
              {patient.insuranceNumber && <ContactRow icon="hash" value={patient.insuranceNumber} />}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Tabs
          tabs={[
            { value: "overview", label: "Overview" },
            { value: "history", label: "Test History", count: patient.orders.length },
            { value: "samples", label: "Samples", count: patient.samples.length },
            { value: "billing", label: "Billing" },
            { value: "documents", label: "Documents" },
            { value: "activity", label: "Activity Log" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === "overview" && (
          <div className="p-6 space-y-6">
            {/* Vital stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <VitalStat label="Total Tests" value={results.length} icon="flask" tone="teal" />
              <VitalStat label="Last Visit" value={lastOrder ? fmtRelative(lastOrder.orderedAt) : "—"} icon="calendar" tone="info" />
              <VitalStat label="Outstanding" value={fmtMoney(outstanding)} icon="dollar" tone={outstanding > 0 ? "warning" : "success"} />
              <VitalStat label="Primary Doctor" value={primaryDoctor ? `Dr. ${primaryDoctor.lastName}` : "—"} icon="doctor" tone="teal" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent results */}
              <div>
                <h3 className="text-[11px] uppercase tracking-wider text-gray font-semibold mb-3">Recent Results</h3>
                {validatedResults.length === 0 ? (
                  <p className="text-xs text-gray py-6 text-center">No validated results yet</p>
                ) : (
                  <div className="border border-border rounded-lg divide-y divide-border max-h-72 overflow-y-auto">
                    {validatedResults.slice(0, 8).map((r) => {
                      const isCritical = r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH";
                      return (
                        <div key={r.id} className={`px-4 py-3 flex items-center justify-between gap-3 ${isCritical ? "bg-critical-soft/40" : ""}`}>
                          <div className="min-w-0">
                            <p className="text-[11px] font-mono-data text-gray">{r.parameter.test.code}</p>
                            <p className="text-[12px] font-medium text-ink">{r.parameter.name}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-mono-data font-semibold ${isCritical ? "text-critical" : "text-ink"}`}>
                              {r.valueNumeric ?? r.valueText} <span className="text-[10px] text-gray font-normal">{r.parameter.unit}</span>
                            </p>
                            {r.flag && r.flag !== "NORMAL" && <AutoStatusBadge status={r.flag} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upcoming + alerts */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-[11px] uppercase tracking-wider text-gray font-semibold mb-3">Upcoming Appointments</h3>
                  <div className="border border-border rounded-lg p-4 text-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-light"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <p className="text-xs text-gray">No upcoming appointments</p>
                    <Link href={`/orders/new?patient=${patient.id}`} className="inline-block mt-2 text-xs text-teal hover:underline">+ Schedule</Link>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] uppercase tracking-wider text-gray font-semibold mb-3">Alerts & Flags</h3>
                  <div className="space-y-2">
                    {patient.allergies && (
                      <div className="flex items-start gap-2 p-3 bg-critical-soft border border-critical/20 rounded-lg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
                        <div>
                          <p className="text-[11px] font-semibold text-critical">Allergies</p>
                          <p className="text-[11px] text-ink-soft">{patient.allergies}</p>
                        </div>
                      </div>
                    )}
                    {criticalCount > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-warning-soft border border-warning/20 rounded-lg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                        <div>
                          <p className="text-[11px] font-semibold text-warning">Critical history</p>
                          <p className="text-[11px] text-ink-soft">{criticalCount} critical-flagged result{criticalCount > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    )}
                    {!patient.allergies && criticalCount === 0 && (
                      <p className="text-xs text-gray">No active alerts</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="overflow-auto">
            <table className="lims-table">
              <thead>
                <tr><th>Order #</th><th>Tests</th><th>Doctor</th><th>Priority</th><th>Status</th><th>Total</th><th>Ordered</th></tr>
              </thead>
              <tbody>
                {patient.orders.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray">No orders</td></tr>
                ) : patient.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono-data text-[12px] text-teal">{o.orderNumber}</td>
                    <td>{o.items.map((i) => i.test.code).join(", ")}</td>
                    <td className="text-gray text-[12px]">{o.doctor ? `Dr. ${o.doctor.lastName}` : "—"}</td>
                    <td><AutoStatusBadge status={o.priority} /></td>
                    <td><AutoStatusBadge status={o.status} /></td>
                    <td className="font-mono-data">{fmtMoney(o.totalPrice)}</td>
                    <td className="text-gray text-[12px]">{fmtDateTime(o.orderedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "samples" && (
          <div className="overflow-auto">
            <table className="lims-table">
              <thead>
                <tr><th>Barcode</th><th>Type</th><th>Status</th><th>Collected</th></tr>
              </thead>
              <tbody>
                {patient.samples.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-gray">No samples</td></tr>
                ) : patient.samples.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono-data text-[12px] text-teal">{s.barcode}</td>
                    <td>{s.specimenType}</td>
                    <td><AutoStatusBadge status={s.status} /></td>
                    <td className="text-gray text-[12px]">{fmtDateTime(s.collectedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "billing" && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-lighter/40 border border-border rounded-lg p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">Total Spent</p>
                <p className="text-2xl font-semibold text-ink mt-1 font-mono-data">{fmtMoney(totalSpent)}</p>
              </div>
              <div className="bg-success-soft border border-success/20 rounded-lg p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">Paid</p>
                <p className="text-2xl font-semibold text-success mt-1 font-mono-data">{fmtMoney(totalSpent - outstanding)}</p>
              </div>
              <div className={`${outstanding > 0 ? "bg-warning-soft border-warning/20" : "bg-gray-lighter/40 border-border"} border rounded-lg p-4`}>
                <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">Outstanding</p>
                <p className={`text-2xl font-semibold mt-1 font-mono-data ${outstanding > 0 ? "text-warning" : "text-ink"}`}>{fmtMoney(outstanding)}</p>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="lims-table">
                <thead>
                  <tr><th>Invoice #</th><th>Date</th><th>Amount</th><th>Payment</th></tr>
                </thead>
                <tbody>
                  {patient.orders.map((o) => (
                    <tr key={o.id}>
                      <td className="font-mono-data text-[12px] text-teal">INV-{o.orderNumber.slice(-5)}</td>
                      <td className="text-gray text-[12px]">{fmtDateTime(o.orderedAt)}</td>
                      <td className="font-mono-data">{fmtMoney(o.totalPrice)}</td>
                      <td><AutoStatusBadge status={o.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "documents" && (
          <div className="p-12 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-gray-light"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p className="text-sm font-medium text-ink">No documents</p>
            <p className="text-xs text-gray mt-1">Lab reports, consent forms, and uploaded files appear here</p>
            <Button variant="outline" size="sm" className="mt-4">Upload Document</Button>
          </div>
        )}

        {tab === "activity" && (
          <div className="p-6">
            <ol className="relative border-l-2 border-border space-y-4 ml-2">
              {patient.orders.slice(0, 10).map((o) => (
                <li key={o.id} className="ml-4">
                  <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-teal border-2 border-surface" />
                  <p className="text-[12px] text-ink-soft">
                    Order <span className="font-mono-data text-teal">{o.orderNumber}</span> created
                    {o.doctor && <span className="text-gray"> by Dr. {o.doctor.lastName}</span>}
                  </p>
                  <p className="text-[10px] text-gray mt-0.5">{fmtDateTime(o.orderedAt)}</p>
                </li>
              ))}
              <li className="ml-4">
                <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-success border-2 border-surface" />
                <p className="text-[12px] text-ink-soft">Patient registered</p>
                <p className="text-[10px] text-gray mt-0.5">{fmtDateTime(patient.createdAt)}</p>
              </li>
            </ol>
          </div>
        )}
      </Card>
    </div>
  );
}

function VitalStat({ label, value, icon, tone }: { label: string; value: React.ReactNode; icon: string; tone: "teal" | "info" | "warning" | "success" }) {
  const tones = {
    teal: "bg-teal-soft text-teal",
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
  };
  const icons: Record<string, React.ReactNode> = {
    flask: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>,
    calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/></svg>,
    dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    doctor: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  };
  return (
    <div className="bg-surface rounded-lg border border-border p-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{label}</p>
        <p className="text-base font-semibold text-ink mt-1 font-mono-data">{value}</p>
      </div>
      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${tones[tone]}`}>{icons[icon]}</div>
    </div>
  );
}

function ContactRow({ icon, value }: { icon: string; value: React.ReactNode }) {
  const icons: Record<string, React.ReactNode> = {
    phone: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    mail: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    map: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    droplet: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
    id: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2"/><path d="M15 12h2"/><path d="M7 16h10"/></svg>,
    shield: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
    hash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray flex-shrink-0">{icons[icon]}</span>
      <span className="text-ink-soft truncate">{value}</span>
    </div>
  );
}
