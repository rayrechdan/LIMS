"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string | null;
  licenseNo: string | null;
  phone: string | null;
  email: string | null;
  clinic: string | null;
  totalReferrals: number;
  thisMonth: number;
  createdAt: string;
};

const SPECIALTIES = [
  "Internal Medicine",
  "Cardiology",
  "Endocrinology",
  "Gastroenterology",
  "Hematology",
  "Nephrology",
  "Neurology",
  "Oncology",
  "Pediatrics",
  "Pulmonology",
  "Rheumatology",
  "OB/GYN",
  "Urology",
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/doctors");
    const d = await r.json();
    setDoctors(d.doctors || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = doctors.filter((d) => {
    if (search && !`${d.firstName} ${d.lastName} ${d.clinic || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (specialtyFilter && d.specialty !== specialtyFilter) return false;
    // For now treat all as active; status field can be added later
    if (statusFilter === "inactive") return false;
    return true;
  });

  const specialties = Array.from(new Set(doctors.map((d) => d.specialty).filter(Boolean) as string[]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-xs text-gray hover:text-teal">← Back to admin</Link>
        <PageHeader
          title="Doctors"
          description="Referring physicians directory and referral activity"
          actions={
            <Button onClick={() => setAddOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Doctor
            </Button>
          }
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryStat label="Total Doctors" value={doctors.length} icon="users" />
        <SummaryStat label="Active" value={doctors.length} icon="check" tone="success" />
        <SummaryStat label="Total Referrals" value={doctors.reduce((s, d) => s + d.totalReferrals, 0)} icon="arrow" tone="info" />
        <SummaryStat label="This Month" value={doctors.reduce((s, d) => s + d.thisMonth, 0)} icon="calendar" tone="teal" />
      </div>

      <Card>
        <div className="px-6 py-3 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input type="search" placeholder="Search by name or clinic…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} className="max-w-[200px]">
            <option value="">All specialties</option>
            {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex gap-1.5">
            {(["", "active", "inactive"] as const).map((s) => (
              <button
                key={s || "all"}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  statusFilter === s ? "bg-teal text-white border-teal" : "bg-surface text-gray border-border hover:border-teal/30"
                }`}
              >
                {s === "" ? "All" : s === "active" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray ml-auto">{filtered.length} doctors</span>
        </div>

        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>Doctor ID</th>
                <th>Name</th>
                <th>Specialty</th>
                <th>Clinic / Hospital</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Total Referrals</th>
                <th>This Month</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={10} className="text-center py-12 text-gray">Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={10} className="text-center py-12 text-gray">No doctors found</td></tr>}
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td className="font-mono-data text-[11px] text-gray">{d.id.slice(0, 8).toUpperCase()}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-soft text-teal flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                        {d.firstName[0]}{d.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-ink">Dr. {d.firstName} {d.lastName}</p>
                        {d.licenseNo && <p className="text-[10px] text-gray font-mono-data">{d.licenseNo}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="text-gray text-[12px]">{d.specialty || "—"}</td>
                  <td className="text-gray text-[12px]">{d.clinic || "—"}</td>
                  <td className="text-gray text-[12px] font-mono-data">{d.phone || "—"}</td>
                  <td className="text-gray text-[12px]">{d.email || "—"}</td>
                  <td className="font-mono-data font-semibold text-ink">{d.totalReferrals}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-data text-ink">{d.thisMonth}</span>
                      {d.thisMonth > 0 && (
                        <span className="text-[10px] text-success">↑</span>
                      )}
                    </div>
                  </td>
                  <td><StatusBadge tone="success">● Active</StatusBadge></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <IconButton title="View"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></IconButton>
                      <IconButton title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></IconButton>
                      <Link href={`/orders/new?doctor=${d.id}`}>
                        <IconButton title="New Order"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg></IconButton>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AddDoctorModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={load} />
    </div>
  );
}

function IconButton({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button title={title} className="p-1.5 rounded-md text-gray hover:text-teal hover:bg-teal-soft transition-colors">
      {children}
    </button>
  );
}

function SummaryStat({ label, value, icon, tone = "teal" }: { label: string; value: number; icon: string; tone?: "teal" | "success" | "info" }) {
  const tones = {
    teal: "bg-teal-soft text-teal",
    success: "bg-success-soft text-success",
    info: "bg-info-soft text-info",
  };
  const icons: Record<string, React.ReactNode> = {
    users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
    check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    arrow: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
    calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  };
  return (
    <div className="bg-surface rounded-lg border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray">{label}</p>
        <p className="text-3xl font-semibold text-ink mt-2 font-mono-data">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icons[icon]}</div>
    </div>
  );
}

function AddDoctorModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", specialty: "", licenseNo: "", phone: "", email: "", clinic: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName) e.firstName = "Required";
    if (!form.lastName) e.lastName = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    await fetch("/api/doctors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    onCreated();
    onClose();
    setForm({ firstName: "", lastName: "", specialty: "", licenseNo: "", phone: "", email: "", clinic: "" });
    setErrors({});
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Doctor"
      description="Register a new referring physician"
      size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={saving}>Create Doctor</Button></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <Input label="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} error={errors.firstName} />
        <Input label="Last name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} error={errors.lastName} />
        <Select label="Specialty" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
          <option value="">— Select —</option>
          {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input label="License #" value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} />
        <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div className="col-span-2">
          <Input label="Clinic / Hospital" value={form.clinic} onChange={(e) => setForm({ ...form, clinic: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}
