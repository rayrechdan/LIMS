"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { calcAge } from "@/lib/format";

type Patient = { id: string; mrn: string; firstName: string; lastName: string; dateOfBirth: string; gender: string; phone: string | null };
type Test = { id: string; code: string; name: string; specimenType: string; containerType: string | null; category: { id: string; name: string } };

const SITES = ["Phlebotomy Room A", "Phlebotomy Room B", "Outpatient Clinic", "Home Collection", "Emergency Dept"];
const SPECIMEN_TYPES = ["BLOOD", "URINE", "STOOL", "TISSUE", "SWAB", "CSF", "OTHER"];

export default function SampleRegisterPage() {
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const scanRef = useRef<HTMLInputElement>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientQ, setPatientQ] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [specimenType, setSpecimenType] = useState("BLOOD");
  const [collectedAt, setCollectedAt] = useState(() => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [collectedBy, setCollectedBy] = useState("");
  const [site, setSite] = useState(SITES[0]);
  const [priority, setPriority] = useState("ROUTINE");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/tests").then((r) => r.json()).then((d) => setTests(d.tests || []));
    scanRef.current?.focus();
  }, []);

  // Patient search
  useEffect(() => {
    const t = setTimeout(() => {
      if (patientQ) fetch(`/api/patients?q=${encodeURIComponent(patientQ)}`).then((r) => r.json()).then((d) => setPatients((d.patients || []).slice(0, 5)));
      else setPatients([]);
    }, 200);
    return () => clearTimeout(t);
  }, [patientQ]);

  function simulateScan() {
    setScanning(true);
    setTimeout(() => {
      const fake = `LB-${Date.now().toString(36).toUpperCase()}-DEMO`;
      setScanInput(fake);
      setScanning(false);
    }, 1200);
  }

  // Auto-update specimen type from selected tests
  const selectedTestObjs = tests.filter((t) => selectedTests.includes(t.id));
  const requiredSpecimens = Array.from(new Set(selectedTestObjs.map((t) => t.specimenType)));
  useEffect(() => {
    if (requiredSpecimens.length === 1) setSpecimenType(requiredSpecimens[0]);
  }, [requiredSpecimens.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group tests by category
  const testsByCategory = tests.reduce<Record<string, Test[]>>((acc, t) => {
    const k = t.category.name;
    if (!acc[k]) acc[k] = [];
    acc[k].push(t);
    return acc;
  }, {});

  function toggleTest(id: string) {
    setSelectedTests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    if (!selectedPatient || selectedTests.length === 0) return;
    setSaving(true);
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        priority,
        clinicalNotes: notes,
        testIds: selectedTests,
      }),
    });
    setSaving(false);
    // Reset for next sample
    setScanInput("");
    setManualId("");
    setSelectedPatient(null);
    setPatientQ("");
    setSelectedTests([]);
    setNotes("");
    scanRef.current?.focus();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Sample Registration" description="Receive collected samples and register them in the system" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── LEFT PANEL ─── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Barcode scanner */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Scan Sample Barcode</CardTitle>
                <p className="text-xs text-gray mt-0.5">Point scanner at sample label or enter manually</p>
              </div>
            </CardHeader>
            <CardBody>
              {/* Scanner visual */}
              <div className="relative bg-gradient-to-br from-teal-mist to-teal-soft border-2 border-dashed border-teal/30 rounded-lg p-8 mb-4 text-center overflow-hidden">
                {scanning && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-teal animate-pulse" style={{ animation: "scan-line 1.2s linear infinite" }} />
                )}
                <div className="w-16 h-16 mx-auto rounded-2xl bg-surface border border-teal/20 flex items-center justify-center mb-3 shadow-sm">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 5v14"/><path d="M8 5v14"/><path d="M12 5v14"/><path d="M17 5v14"/><path d="M21 5v14"/>
                  </svg>
                </div>
                {scanning ? (
                  <p className="text-sm font-medium text-teal">Scanning…</p>
                ) : scanInput ? (
                  <>
                    <p className="text-[11px] uppercase tracking-wider text-gray font-semibold">Captured</p>
                    <p className="text-xl font-mono-data font-bold text-teal mt-1">{scanInput}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-ink">Ready to scan</p>
                    <p className="text-[11px] text-gray mt-1">Or focus the input below and scan</p>
                  </>
                )}
              </div>

              <div className="relative mb-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
                <input
                  ref={scanRef}
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scanner input — focus and scan…"
                  className="pl-9 font-mono-data text-base h-12"
                />
              </div>

              <Button variant="outline" size="sm" onClick={simulateScan} className="w-full">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Simulate Scan
              </Button>

              <div className="mt-4 pt-4 border-t border-border">
                <Input label="Manual sample ID" value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="LB-XXXX-XXXX" hint="Use when barcode is unreadable" />
              </div>
            </CardBody>
          </Card>

          {/* Patient lookup */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Lookup</CardTitle>
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
                      <p className="text-[11px] text-gray font-mono-data">{selectedPatient.mrn} · {calcAge(selectedPatient.dateOfBirth)}y · {selectedPatient.gender}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedPatient(null); setPatientQ(""); }}>Change</Button>
                </div>
              ) : (
                <>
                  <div className="relative mb-3">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    <input type="search" value={patientQ} onChange={(e) => setPatientQ(e.target.value)} placeholder="Search by name or MRN…" className="pl-9" />
                  </div>
                  {patientQ && patients.length > 0 && (
                    <div className="border border-border rounded-lg divide-y divide-border">
                      {patients.map((p) => (
                        <button key={p.id} onClick={() => setSelectedPatient(p)} className="w-full text-left px-3 py-2 hover:bg-teal-soft transition-colors">
                          <p className="text-sm font-medium text-ink">{p.firstName} {p.lastName}</p>
                          <p className="text-[11px] text-gray font-mono-data">{p.mrn} · {calcAge(p.dateOfBirth)}y · {p.gender}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registration Form</CardTitle>
            </CardHeader>
            <CardBody className="space-y-5">
              {/* Test selection */}
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-2">Test orders <span className="text-critical">*</span></label>
                <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
                  {Object.entries(testsByCategory).map(([cat, list]) => (
                    <div key={cat}>
                      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray bg-gray-lighter sticky top-0">{cat}</p>
                      {list.map((t) => {
                        const checked = selectedTests.includes(t.id);
                        return (
                          <label key={t.id} className={`flex items-center gap-3 px-3 py-2 border-t border-border cursor-pointer hover:bg-teal-soft/40 transition-colors ${checked ? "bg-teal-soft" : ""}`}>
                            <input type="checkbox" checked={checked} onChange={() => toggleTest(t.id)} className="w-4 h-4 accent-teal" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-mono-data text-teal">{t.code}</p>
                              <p className="text-[12px] text-ink truncate">{t.name}</p>
                            </div>
                            <span className="text-[10px] text-gray font-mono-data">{t.specimenType}</span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray mt-1">{selectedTests.length} selected</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Sample type" value={specimenType} onChange={(e) => setSpecimenType(e.target.value)} hint={requiredSpecimens.length === 1 ? "Auto-set from test" : undefined}>
                  {SPECIMEN_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Select label="Collection site" value={site} onChange={(e) => setSite(e.target.value)}>
                  {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Input label="Collection date & time" type="datetime-local" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} />
                <Input label="Collected by" value={collectedBy} onChange={(e) => setCollectedBy(e.target.value)} placeholder="Phlebotomist name" />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-2">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: "ROUTINE", label: "Routine", tone: "neutral" },
                    { v: "URGENT", label: "Urgent", tone: "warning" },
                    { v: "STAT", label: "STAT", tone: "critical" },
                  ] as const).map((p) => {
                    const active = priority === p.v;
                    return (
                      <button
                        key={p.v}
                        onClick={() => setPriority(p.v)}
                        className={`px-3 py-2 text-[12px] font-medium rounded-lg border transition-colors ${
                          active
                            ? p.tone === "critical" ? "bg-critical text-white border-critical"
                            : p.tone === "warning" ? "bg-warning text-white border-warning"
                            : "bg-teal text-white border-teal"
                            : "bg-surface text-gray border-border hover:border-teal/30"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Textarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </CardBody>
            <div className="px-6 py-3 border-t border-border bg-gray-lighter/40 flex items-center justify-between gap-2">
              <Button variant="outline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print Barcode Label
              </Button>
              <Button onClick={submit} loading={saving} disabled={!selectedPatient || selectedTests.length === 0}>
                Save & Next →
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(0); }
          50% { transform: translateY(120px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
