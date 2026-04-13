"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDate, calcAge } from "@/lib/format";

type Patient = {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationalId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bloodType: string | null;
  insuranceName: string | null;
  insuranceNumber: string | null;
};

const NOTIFICATION_EVENTS = [
  { key: "results", label: "Results Ready", desc: "When new lab results are released", icon: "flask" },
  { key: "appointments", label: "Appointment Reminder", desc: "24 hours before your scheduled visit", icon: "calendar" },
  { key: "payment", label: "Payment Due", desc: "Outstanding balance and overdue invoices", icon: "dollar" },
  { key: "critical", label: "Critical Alerts", desc: "Urgent results requiring immediate attention", icon: "alert" },
] as const;

const CHANNELS = [
  { key: "sms", label: "SMS" },
  { key: "email", label: "Email" },
  { key: "push", label: "Push" },
] as const;

const INSURANCES = [
  "Self-pay",
  "NSSF (National Social Security Fund)",
  "Allianz",
  "AXA",
  "Bupa Global",
  "Cigna",
  "GlobeMed",
  "MedNet",
];

export default function PatientProfileSettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingInsurance, setSavingInsurance] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [personalForm, setPersonalForm] = useState({ firstName: "", lastName: "", phone: "", email: "", address: "" });
  const [insuranceForm, setInsuranceForm] = useState({ insuranceName: "", insuranceNumber: "" });

  const [prefs, setPrefs] = useState<Record<string, Record<string, boolean>>>({
    results: { sms: true, email: true, push: false },
    appointments: { sms: true, email: false, push: true },
    payment: { sms: false, email: true, push: false },
    critical: { sms: true, email: true, push: true },
  });

  const [language, setLanguage] = useState<"en" | "ar">("en");

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwShow, setPwShow] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/portal/me").then((r) => r.json()).then((d) => {
      const p: Patient = d.patient;
      setPatient(p);
      if (p) {
        setPersonalForm({
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone || "",
          email: p.email || "",
          address: p.address || "",
        });
        setInsuranceForm({
          insuranceName: p.insuranceName || "",
          insuranceNumber: p.insuranceNumber || "",
        });
      }
    });
  }, []);

  function pickPhoto() { fileRef.current?.click(); }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function togglePref(event: string, channel: string) {
    setPrefs((p) => ({ ...p, [event]: { ...p[event], [channel]: !p[event][channel] } }));
  }

  async function savePersonal() {
    setSavingPersonal(true);
    setTimeout(() => setSavingPersonal(false), 600);
  }
  async function saveInsurance() {
    setSavingInsurance(true);
    setTimeout(() => setSavingInsurance(false), 600);
  }
  async function changePassword() {
    setPwError("");
    setPwSuccess(false);
    if (pwForm.next.length < 8) { setPwError("Password must be at least 8 characters"); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match"); return; }
    if (!pwForm.current) { setPwError("Enter your current password"); return; }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
    }, 700);
  }

  if (!patient) return <div className="text-sm text-gray">Loading…</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Manage your personal information, preferences, and security" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── LEFT COLUMN ─── */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardBody className="space-y-5">
              <div className="flex items-center gap-5">
                <button type="button" onClick={pickPhoto} className="relative w-24 h-24 rounded-full overflow-hidden bg-teal text-white flex items-center justify-center text-2xl font-semibold flex-shrink-0 group">
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{patient.firstName[0]}{patient.lastName[0]}</span>
                  )}
                  <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </div>
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
                <div>
                  <button onClick={pickPhoto} className="text-[12px] font-semibold text-teal hover:underline">
                    {photoPreview ? "Change photo" : "Upload photo"}
                  </button>
                  <p className="text-[11px] text-gray mt-0.5">JPG or PNG, max 5 MB</p>
                  <p className="text-[10px] text-gray-light mt-1 font-mono-data">{patient.mrn}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ReadonlyField label="Date of birth" value={`${fmtDate(patient.dateOfBirth)} · ${calcAge(patient.dateOfBirth)}y`} />
                <ReadonlyField label="Gender" value={patient.gender} />
                <div className="col-span-2">
                  <ReadonlyField label="National ID" value={patient.nationalId || "—"} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <Input label="First name" value={personalForm.firstName} onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })} />
                <Input label="Last name" value={personalForm.lastName} onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })} />
                <Input label="Phone" type="tel" value={personalForm.phone} onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })} />
                <Input label="Email" type="email" value={personalForm.email} onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })} />
                <div className="col-span-2">
                  <Input label="Address" value={personalForm.address} onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })} />
                </div>
              </div>
            </CardBody>
            <div className="px-6 py-3 border-t border-border bg-gray-lighter/40 flex items-center justify-end gap-2">
              <Button variant="ghost">Cancel</Button>
              <Button onClick={savePersonal} loading={savingPersonal}>Save Changes</Button>
            </div>
          </Card>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader><CardTitle>Insurance</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <Select label="Provider" value={insuranceForm.insuranceName} onChange={(e) => setInsuranceForm({ ...insuranceForm, insuranceName: e.target.value })}>
                <option value="">— Select —</option>
                {INSURANCES.map((i) => <option key={i} value={i}>{i}</option>)}
              </Select>
              {insuranceForm.insuranceName && insuranceForm.insuranceName !== "Self-pay" && (
                <Input label="Policy number" value={insuranceForm.insuranceNumber} onChange={(e) => setInsuranceForm({ ...insuranceForm, insuranceNumber: e.target.value })} />
              )}
            </CardBody>
            <div className="px-6 py-3 border-t border-border bg-gray-lighter/40 flex items-center justify-end">
              <Button onClick={saveInsurance} loading={savingInsurance} size="sm">Save Insurance</Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Notification Preferences</CardTitle>
                <p className="text-xs text-gray mt-0.5">Choose how you&apos;d like to be notified</p>
              </div>
            </CardHeader>
            <div className="overflow-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-gray-lighter/40">
                    <th className="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray">Event</th>
                    {CHANNELS.map((c) => (
                      <th key={c.key} className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NOTIFICATION_EVENTS.map((event) => (
                    <tr key={event.key} className="border-t border-border">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-teal-soft text-teal flex items-center justify-center flex-shrink-0">
                            <EventIcon icon={event.icon} />
                          </div>
                          <div>
                            <p className="text-[12px] font-medium text-ink">{event.label}</p>
                            <p className="text-[10px] text-gray">{event.desc}</p>
                          </div>
                        </div>
                      </td>
                      {CHANNELS.map((c) => (
                        <td key={c.key} className="text-center px-3 py-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prefs[event.key]?.[c.key] || false}
                              onChange={() => togglePref(event.key, c.key)}
                              className="sr-only peer"
                            />
                            <span className="w-9 h-5 bg-gray-light rounded-full peer-checked:bg-teal transition-colors" />
                            <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Language Preference</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-2">
                {(["en", "ar"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`h-12 px-3 text-[13px] rounded-lg border transition-all flex items-center justify-center gap-2 ${
                      language === l
                        ? "bg-teal-soft border-teal text-teal font-semibold ring-1 ring-teal/20"
                        : "bg-surface border-border text-gray hover:border-teal/30"
                    }`}
                  >
                    <span className="text-base">{l === "en" ? "🇬🇧" : "🇱🇧"}</span>
                    {l === "en" ? "English" : "العربية"}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray mt-3">Reports are always available in both EN and AR formats.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              <PasswordInput label="Current password" value={pwForm.current} onChange={(v) => setPwForm({ ...pwForm, current: v })} show={pwShow} onToggle={() => setPwShow(!pwShow)} />
              <PasswordInput label="New password" value={pwForm.next} onChange={(v) => setPwForm({ ...pwForm, next: v })} show={pwShow} onToggle={() => setPwShow(!pwShow)} hint="Minimum 8 characters" />
              <PasswordInput label="Confirm new password" value={pwForm.confirm} onChange={(v) => setPwForm({ ...pwForm, confirm: v })} show={pwShow} onToggle={() => setPwShow(!pwShow)} />
              {pwError && (
                <div className="bg-critical-soft border border-critical/20 rounded-lg px-3 py-2 text-[11px] text-critical">{pwError}</div>
              )}
              {pwSuccess && (
                <div className="bg-success-soft border border-success/20 rounded-lg px-3 py-2 text-[11px] text-success flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Password updated successfully
                </div>
              )}
            </CardBody>
            <div className="px-6 py-3 border-t border-border bg-gray-lighter/40 flex items-center justify-end">
              <Button onClick={changePassword} loading={savingPassword} size="sm">Update Password</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-soft mb-1.5">{label}</label>
      <div className="px-3 py-2 bg-gray-lighter/50 border border-border rounded-lg text-[13px] text-ink-soft flex items-center justify-between">
        <span>{value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-light"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange, show, onToggle, hint }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-soft mb-1.5">{label} <span className="text-critical">*</span></label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••" className="pr-10" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-teal transition-colors p-1">
          {show ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
      {hint && <p className="text-[10px] text-gray mt-1">{hint}</p>}
    </div>
  );
}

function EventIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    flask: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>,
    calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    dollar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,
  };
  return icons[icon];
}
