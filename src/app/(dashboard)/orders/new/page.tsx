"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtMoney, calcAge } from "@/lib/format";

type Patient = { id: string; mrn: string; firstName: string; lastName: string; dateOfBirth: string; gender: string; phone: string | null };
type Doctor = { id: string; firstName: string; lastName: string; specialty: string | null; clinic: string | null };
type Test = { id: string; code: string; name: string; price: number; specimenType: string; turnaroundHours: number; containerType: string | null; category: { id: string; name: string } };

export default function NewOrderPageWrapper() {
  return (
    <Suspense fallback={<div className="text-sm text-gray">Loading…</div>}>
      <NewOrderPage />
    </Suspense>
  );
}

function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectDoctorId = searchParams.get("doctor");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorQ, setDoctorQ] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorOpen, setDoctorOpen] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientQ, setPatientQ] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientOpen, setPatientOpen] = useState(false);

  const [tests, setTests] = useState<Test[]>([]);
  const [testQ, setTestQ] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const [priority, setPriority] = useState("ROUTINE");
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");
  const [billingType, setBillingType] = useState<"INSURANCE" | "CASH">("CASH");
  const [insurance, setInsurance] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [appointment, setAppointment] = useState<"WALKIN" | "APPOINTMENT">("WALKIN");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const [saving, setSaving] = useState(false);

  // Load tests + doctors
  useEffect(() => {
    fetch("/api/tests").then((r) => r.json()).then((d) => setTests(d.tests || []));
    fetch("/api/doctors").then((r) => r.json()).then((d) => {
      setDoctors(d.doctors || []);
      if (preselectDoctorId) {
        const doc = (d.doctors || []).find((x: Doctor) => x.id === preselectDoctorId);
        if (doc) setSelectedDoctor(doc);
      }
    });
  }, [preselectDoctorId]);

  // Patient search (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/patients?q=${encodeURIComponent(patientQ)}`)
        .then((r) => r.json())
        .then((d) => setPatients((d.patients || []).slice(0, 8)));
    }, 200);
    return () => clearTimeout(t);
  }, [patientQ]);

  // Filter doctors by query
  const filteredDoctors = doctors.filter((d) =>
    !doctorQ || `${d.firstName} ${d.lastName} ${d.specialty || ""}`.toLowerCase().includes(doctorQ.toLowerCase())
  ).slice(0, 8);

  // Filter tests
  const filteredTests = tests.filter((t) => {
    if (activeCategory !== "ALL" && t.category.id !== activeCategory) return false;
    if (testQ && !`${t.code} ${t.name}`.toLowerCase().includes(testQ.toLowerCase())) return false;
    return true;
  });

  const categories = Array.from(new Map(tests.map((t) => [t.category.id, t.category])).values());
  const selectedTestObjs = tests.filter((t) => selectedTests.includes(t.id));
  const subtotal = selectedTestObjs.reduce((s, t) => s + t.price, 0);
  const discount = billingType === "INSURANCE" ? subtotal * 0.2 : 0;
  const total = subtotal - discount;

  // Sample types auto-derived from selected tests
  const requiredSpecimens = Array.from(new Set(selectedTestObjs.map((t) => t.specimenType)));

  function toggleTest(id: string) {
    setSelectedTests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    if (!selectedPatient || selectedTests.length === 0) return;
    setSaving(true);
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        doctorId: selectedDoctor?.id || null,
        priority,
        diagnosis,
        clinicalNotes: instructions,
        testIds: selectedTests,
      }),
    });
    setSaving(false);
    if (r.ok) router.push("/samples");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/samples" className="text-xs text-gray hover:text-teal">← Back to samples</Link>
        <PageHeader title="New Test Order" description="Phone-in, walk-in, and nurse-entered test orders" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Doctor */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Referring Doctor</CardTitle>
                <p className="text-xs text-gray mt-0.5">Search and select the ordering physician</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-gray font-semibold">Step 1</span>
            </CardHeader>
            <CardBody>
              {selectedDoctor ? (
                <div className="flex items-center justify-between p-3 bg-teal-soft rounded-lg border border-teal/15">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center text-xs font-semibold">
                      {selectedDoctor.firstName[0]}{selectedDoctor.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
                      <p className="text-[11px] text-gray">{selectedDoctor.specialty || "—"} {selectedDoctor.clinic && `· ${selectedDoctor.clinic}`}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedDoctor(null); setDoctorQ(""); }}>Change</Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      type="search"
                      value={doctorQ}
                      onChange={(e) => { setDoctorQ(e.target.value); setDoctorOpen(true); }}
                      onFocus={() => setDoctorOpen(true)}
                      placeholder="Search doctor by name or specialty…"
                      className="pl-9"
                    />
                  </div>
                  {doctorOpen && doctorQ && filteredDoctors.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {filteredDoctors.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => { setSelectedDoctor(d); setDoctorOpen(false); }}
                          className="w-full text-left px-3 py-2.5 hover:bg-teal-soft transition-colors border-b border-border last:border-0"
                        >
                          <p className="text-sm font-medium text-ink">Dr. {d.firstName} {d.lastName}</p>
                          <p className="text-[11px] text-gray">{d.specialty || "—"} {d.clinic && `· ${d.clinic}`}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Patient */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Patient</CardTitle>
                <p className="text-xs text-gray mt-0.5">Search existing or register a new patient</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-gray font-semibold">Step 2</span>
            </CardHeader>
            <CardBody>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 bg-teal-soft rounded-lg border border-teal/15">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center text-xs font-semibold">
                      {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                      <p className="text-[11px] text-gray font-mono-data">{selectedPatient.mrn} · {calcAge(selectedPatient.dateOfBirth)}y · {selectedPatient.gender} · {selectedPatient.phone || "no phone"}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedPatient(null); setPatientQ(""); }}>Change</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                      </svg>
                      <input
                        type="search"
                        value={patientQ}
                        onChange={(e) => { setPatientQ(e.target.value); setPatientOpen(true); }}
                        placeholder="Search by name, MRN, or phone…"
                        className="pl-9"
                      />
                    </div>
                    <Link href="/patients">
                      <Button variant="outline" size="md">+ New Patient</Button>
                    </Link>
                  </div>
                  {patientOpen && patientQ && patients.length > 0 && (
                    <div className="bg-surface border border-border rounded-lg max-h-56 overflow-y-auto">
                      {patients.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPatient(p); setPatientOpen(false); }}
                          className="w-full text-left px-3 py-2.5 hover:bg-teal-soft transition-colors border-b border-border last:border-0"
                        >
                          <p className="text-sm font-medium text-ink">{p.firstName} {p.lastName}</p>
                          <p className="text-[11px] text-gray font-mono-data">{p.mrn} · {calcAge(p.dateOfBirth)}y · {p.gender}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Tests */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Select Tests</CardTitle>
                <p className="text-xs text-gray mt-0.5">Multi-select from the test catalog</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-gray font-semibold">Step 3</span>
            </CardHeader>
            <div className="px-6 py-3 border-b border-border flex flex-wrap items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input type="search" value={testQ} onChange={(e) => setTestQ(e.target.value)} placeholder="Search tests…" className="pl-9" />
              </div>
              <button
                onClick={() => setActiveCategory("ALL")}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  activeCategory === "ALL" ? "bg-teal text-white border-teal" : "bg-surface text-gray border-border hover:border-teal/30"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    activeCategory === c.id ? "bg-teal text-white border-teal" : "bg-surface text-gray border-border hover:border-teal/30"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <CardBody>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {filteredTests.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-sm text-gray">No tests match</div>
                ) : filteredTests.map((t) => {
                  const checked = selectedTests.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTest(t.id)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        checked ? "bg-teal-soft border-teal/30 ring-1 ring-teal/20" : "bg-surface border-border hover:border-teal/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] font-mono-data text-teal">{t.code}</p>
                            {checked && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </div>
                          <p className="text-[13px] font-medium text-ink truncate">{t.name}</p>
                          <p className="text-[10px] text-gray mt-0.5">{t.specimenType} · {t.turnaroundHours}h</p>
                        </div>
                        <p className="text-[11px] font-mono-data text-ink">{fmtMoney(t.price)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Order details */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Order Details</CardTitle>
                <p className="text-xs text-gray mt-0.5">Priority, instructions, billing, and scheduling</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-gray font-semibold">Step 4</span>
            </CardHeader>
            <CardBody className="space-y-5">
              {/* Priority */}
              <div>
                <p className="text-xs font-medium text-ink-soft mb-2">Priority</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: "ROUTINE", label: "Routine", desc: "Standard TAT", tone: "neutral" },
                    { v: "URGENT", label: "Urgent", desc: "Expedited", tone: "warning" },
                    { v: "STAT", label: "STAT", desc: "Immediate", tone: "critical" },
                  ] as const).map((p) => {
                    const active = priority === p.v;
                    return (
                      <button
                        key={p.v}
                        onClick={() => setPriority(p.v)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          active
                            ? p.tone === "critical" ? "bg-critical-soft border-critical/30 ring-1 ring-critical/20"
                            : p.tone === "warning" ? "bg-warning-soft border-warning/30 ring-1 ring-warning/20"
                            : "bg-teal-soft border-teal/30 ring-1 ring-teal/20"
                            : "bg-surface border-border hover:border-teal/30"
                        }`}
                      >
                        <p className={`text-[13px] font-semibold ${active ? (p.tone === "critical" ? "text-critical" : p.tone === "warning" ? "text-warning" : "text-teal") : "text-ink"}`}>{p.label}</p>
                        <p className="text-[10px] text-gray">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sample types (auto) */}
              <div>
                <p className="text-xs font-medium text-ink-soft mb-2">Required Sample Types <span className="text-gray font-normal">(auto)</span></p>
                {requiredSpecimens.length === 0 ? (
                  <p className="text-[11px] text-gray italic">Select tests to see required specimens</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {requiredSpecimens.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-info-soft text-info text-[11px] font-mono-data font-semibold rounded-md border border-info/15">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2v17.5a3.5 3.5 0 1 1-7 0V2"/><line x1="6" y1="2" x2="16" y2="2"/></svg>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Input label="Diagnosis / clinical impression" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              <Textarea label="Special instructions" rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Fasting status, repeat collection, etc." />

              {/* Billing */}
              <div>
                <p className="text-xs font-medium text-ink-soft mb-2">Billing</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(["CASH", "INSURANCE"] as const).map((b) => {
                    const active = billingType === b;
                    return (
                      <button
                        key={b}
                        onClick={() => setBillingType(b)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          active ? "bg-teal-soft border-teal/30 ring-1 ring-teal/20" : "bg-surface border-border hover:border-teal/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {b === "CASH" ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-teal" : "text-gray"}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01"/><path d="M18 12h.01"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-teal" : "text-gray"}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                          )}
                          <span className={`text-[13px] font-medium ${active ? "text-teal" : "text-ink"}`}>{b === "CASH" ? "Cash / Self-Pay" : "Insurance"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {billingType === "INSURANCE" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Insurance provider" value={insurance} onChange={(e) => setInsurance(e.target.value)} placeholder="e.g. NSSF" />
                    <Input label="Policy / Member #" value={insuranceNumber} onChange={(e) => setInsuranceNumber(e.target.value)} />
                  </div>
                )}
              </div>

              {/* Appointment */}
              <div>
                <p className="text-xs font-medium text-ink-soft mb-2">Collection</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(["WALKIN", "APPOINTMENT"] as const).map((a) => {
                    const active = appointment === a;
                    return (
                      <button
                        key={a}
                        onClick={() => setAppointment(a)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          active ? "bg-teal-soft border-teal/30 ring-1 ring-teal/20" : "bg-surface border-border hover:border-teal/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {a === "WALKIN" ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-teal" : "text-gray"}><circle cx="12" cy="5" r="2"/><path d="M12 7v4l-3 9"/><path d="m12 11 3 9"/><path d="M9 13h6"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-teal" : "text-gray"}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          )}
                          <span className={`text-[13px] font-medium ${active ? "text-teal" : "text-ink"}`}>{a === "WALKIN" ? "Walk-in" : "Appointment"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {appointment === "APPOINTMENT" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Date" type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
                    <Input label="Time" type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} />
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* ─── Right summary ─── */}
        <div className="lg:col-span-4">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <SummaryRow label="Doctor" value={selectedDoctor ? `Dr. ${selectedDoctor.lastName}` : <em className="text-gray">Not selected</em>} />
              <SummaryRow label="Patient" value={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : <em className="text-gray">Not selected</em>} />
              <SummaryRow
                label="Priority"
                value={
                  <StatusBadge tone={priority === "STAT" ? "critical" : priority === "URGENT" ? "warning" : "neutral"}>
                    {priority}
                  </StatusBadge>
                }
              />
              <SummaryRow label="Billing" value={billingType === "INSURANCE" ? insurance || "Insurance" : "Cash"} />
              <SummaryRow label="Collection" value={appointment === "APPOINTMENT" ? `Appt ${appointmentDate || "—"}` : "Walk-in"} />

              <div className="border-t border-border pt-3">
                <p className="text-[10px] uppercase tracking-wider text-gray font-semibold mb-2">Selected Tests ({selectedTestObjs.length})</p>
                {selectedTestObjs.length === 0 ? (
                  <p className="text-xs text-gray italic">No tests selected</p>
                ) : (
                  <ul className="space-y-1.5 max-h-44 overflow-y-auto">
                    {selectedTestObjs.map((t) => (
                      <li key={t.id} className="flex items-start justify-between text-[12px] gap-2">
                        <div className="min-w-0">
                          <p className="font-mono-data text-teal text-[10px]">{t.code}</p>
                          <p className="text-ink truncate">{t.name}</p>
                        </div>
                        <p className="font-mono-data text-ink">{fmtMoney(t.price)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-border pt-3 space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between text-gray">
                  <span>Subtotal</span>
                  <span className="font-mono-data">{fmtMoney(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-success">
                    <span>Insurance (20%)</span>
                    <span className="font-mono-data">−{fmtMoney(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs font-semibold text-ink-soft">Total</span>
                  <span className="text-xl font-semibold font-mono-data text-ink">{fmtMoney(total)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={!selectedPatient || selectedTests.length === 0}
                loading={saving}
                onClick={submit}
              >
                Submit Order
              </Button>
              {(!selectedPatient || selectedTests.length === 0) && (
                <p className="text-[11px] text-gray text-center">
                  {!selectedPatient ? "Select a patient" : "Select at least one test"} to submit
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider text-gray font-semibold">{label}</span>
      <span className="text-[13px] text-ink text-right">{value}</span>
    </div>
  );
}
