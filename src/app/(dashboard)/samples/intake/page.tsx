"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtMoney, calcAge } from "@/lib/format";

type Patient = { id: string; mrn: string; firstName: string; lastName: string; dateOfBirth: string; gender: string };
type Doctor = { id: string; firstName: string; lastName: string; specialty: string | null };
type Test = { id: string; code: string; name: string; price: number; specimenType: string; turnaroundHours: number; categoryId: string; category: { name: string } };

export default function IntakePage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientQ, setPatientQ] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [priority, setPriority] = useState("ROUTINE");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/tests").then((r) => r.json()).then((d) => setTests(d.tests || []));
    fetch("/api/doctors").then((r) => r.json()).then((d) => setDoctors(d.doctors || []));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/patients?q=${encodeURIComponent(patientQ)}`)
        .then((r) => r.json())
        .then((d) => setPatients(d.patients || []));
    }, 200);
    return () => clearTimeout(t);
  }, [patientQ]);

  const selectedTestObjs = tests.filter((t) => selectedTests.includes(t.id));
  const total = selectedTestObjs.reduce((s, t) => s + t.price, 0);

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
        doctorId: doctorId || null,
        priority,
        diagnosis,
        clinicalNotes: notes,
        testIds: selectedTests,
      }),
    });
    setSaving(false);
    if (r.ok) router.push("/samples");
  }

  // Group tests by category
  const testsByCategory = tests.reduce<Record<string, Test[]>>((acc, t) => {
    const k = t.category?.name || "Other";
    if (!acc[k]) acc[k] = [];
    acc[k].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <Link href="/samples" className="text-xs text-gray hover:text-teal">← Back to samples</Link>
        <PageHeader title="Sample Intake" description="Create a test order and generate sample barcodes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>1. Patient</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 bg-teal-soft rounded-lg border border-teal/15">
                  <div>
                    <p className="text-sm font-semibold text-ink">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                    <p className="text-xs text-gray font-mono-data">{selectedPatient.mrn} · {calcAge(selectedPatient.dateOfBirth)}y · {selectedPatient.gender}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>Change</Button>
                </div>
              ) : (
                <>
                  <input
                    type="search"
                    placeholder="Search by name or MRN…"
                    value={patientQ}
                    onChange={(e) => setPatientQ(e.target.value)}
                    autoFocus
                  />
                  <div className="max-h-56 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                    {patients.length === 0 ? (
                      <p className="text-xs text-gray px-3 py-3">No patients found</p>
                    ) : patients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPatient(p)}
                        className="w-full text-left px-3 py-2 hover:bg-teal-soft transition-colors"
                      >
                        <p className="text-sm font-medium text-ink">{p.firstName} {p.lastName}</p>
                        <p className="text-[11px] text-gray font-mono-data">{p.mrn} · {calcAge(p.dateOfBirth)}y · {p.gender}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>2. Order Details</CardTitle></CardHeader>
            <CardBody className="grid grid-cols-2 gap-4">
              <Select label="Referring doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">— None —</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}{d.specialty ? ` · ${d.specialty}` : ""}</option>)}
              </Select>
              <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT</option>
              </Select>
              <div className="col-span-2">
                <Input label="Diagnosis / clinical impression" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Textarea label="Clinical notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>3. Select Tests</CardTitle></CardHeader>
            <CardBody className="space-y-5">
              {Object.entries(testsByCategory).map(([cat, list]) => (
                <div key={cat}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray mb-2">{cat}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {list.map((t) => {
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
                            <div className="min-w-0">
                              <p className="text-[11px] font-mono-data text-teal">{t.code}</p>
                              <p className="text-[13px] font-medium text-ink truncate">{t.name}</p>
                              <p className="text-[10px] text-gray mt-0.5">{t.specimenType} · {t.turnaroundHours}h</p>
                            </div>
                            <p className="text-[11px] font-mono-data text-ink">{fmtMoney(t.price)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Right: summary */}
        <div>
          <Card className="sticky top-20">
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {selectedTestObjs.length === 0 ? (
                <p className="text-xs text-gray text-center py-6">No tests selected</p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto">
                  {selectedTestObjs.map((t) => (
                    <li key={t.id} className="flex items-start justify-between text-[12px] gap-2">
                      <div className="min-w-0">
                        <p className="font-mono-data text-teal text-[11px]">{t.code}</p>
                        <p className="text-ink truncate">{t.name}</p>
                      </div>
                      <p className="font-mono-data text-ink">{fmtMoney(t.price)}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-xs text-gray">Total</span>
                <span className="text-lg font-semibold font-mono-data text-ink">{fmtMoney(total)}</span>
              </div>
              <Button
                className="w-full"
                disabled={!selectedPatient || selectedTests.length === 0}
                loading={saving}
                onClick={submit}
              >
                Create Order & Generate Samples
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
