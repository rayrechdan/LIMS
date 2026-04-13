"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate, calcAge, fmtMoney } from "@/lib/format";

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
  insuranceName: string | null;
  insuranceNumber: string | null;
  createdAt: string;
};

const PAGE_SIZE = 12;

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/patients?q=${encodeURIComponent(q)}`);
    const d = await r.json();
    setPatients(d.patients || []);
    setLoading(false);
    setPage(1);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const filtered = patients.filter((p) => {
    if (genderFilter && p.gender !== genderFilter) return false;
    if (fromDate && new Date(p.createdAt) < new Date(fromDate)) return false;
    if (toDate && new Date(p.createdAt) > new Date(toDate)) return false;
    if (statusFilter === "inactive") return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCSV() {
    const rows = [
      ["MRN", "First Name", "Last Name", "DOB", "Age", "Gender", "Phone", "Email", "National ID", "Blood Type", "Insurance", "Registered"],
      ...filtered.map((p) => [p.mrn, p.firstName, p.lastName, p.dateOfBirth, calcAge(p.dateOfBirth), p.gender, p.phone || "", p.email || "", p.nationalId || "", p.bloodType || "", p.insuranceName || "", p.createdAt]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `patients-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Patient registry and medical records"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </Button>
            <Button onClick={() => setOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Patient
            </Button>
          </div>
        }
      />

      <Card>
        {/* Filter bar */}
        <div className="px-6 py-4 border-b border-border space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative flex-1 min-w-[260px] max-w-sm">
              <label className="block text-[11px] font-medium text-gray mb-1.5">Search</label>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-[34px] text-gray pointer-events-none">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, MRN, phone, or national ID…" className="pl-9" />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-[11px] font-medium text-gray mb-1.5">Gender</label>
              <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                <option value="">All</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="min-w-[150px]">
              <label className="block text-[11px] font-medium text-gray mb-1.5">Registered from</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="min-w-[150px]">
              <label className="block text-[11px] font-medium text-gray mb-1.5">to</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="flex gap-1.5 items-end pb-0.5">
              {(["", "active", "inactive"] as const).map((s) => (
                <button
                  key={s || "all"}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                    statusFilter === s ? "bg-teal text-white border-teal" : "bg-surface text-gray border-border hover:border-teal/30"
                  }`}
                >
                  {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Counts */}
        <div className="px-6 py-2 border-b border-border bg-gray-lighter/40 flex items-center justify-between text-[11px] text-gray">
          <span>{filtered.length} patient{filtered.length === 1 ? "" : "s"}</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Patient ID</th>
                <th>Name</th>
                <th>DOB / Age</th>
                <th>Phone</th>
                <th>National ID</th>
                <th>Last Visit</th>
                <th>Total Visits</th>
                <th>Balance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} className="text-center py-12 text-gray">Loading…</td></tr>}
              {!loading && pageRows.length === 0 && <tr><td colSpan={11} className="text-center py-12 text-gray">No patients match the filters</td></tr>}
              {pageRows.map((p) => (
                <>
                  <tr
                    key={p.id}
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    className="cursor-pointer"
                  >
                    <td>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray transition-transform ${expandedId === p.id ? "rotate-90" : ""}`}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </td>
                    <td className="font-mono-data text-[12px] text-teal">{p.mrn}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-soft text-teal flex items-center justify-center text-[11px] font-semibold">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <p className="font-medium text-ink">{p.firstName} {p.lastName}</p>
                      </div>
                    </td>
                    <td className="font-mono-data text-[12px]">{fmtDate(p.dateOfBirth)} <span className="text-gray">· {calcAge(p.dateOfBirth)}y</span></td>
                    <td className="text-gray text-[12px] font-mono-data">{p.phone || "—"}</td>
                    <td className="font-mono-data text-[11px] text-gray">{p.nationalId || "—"}</td>
                    <td className="text-gray text-[12px]">{fmtDate(p.createdAt)}</td>
                    <td className="font-mono-data">3</td>
                    <td className="font-mono-data">{fmtMoney(0)}</td>
                    <td><StatusBadge tone="success">● Active</StatusBadge></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/patients/${p.id}`}>
                          <button title="View" className="p-1.5 rounded-md text-gray hover:text-teal hover:bg-teal-soft transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </Link>
                        <button title="Edit" className="p-1.5 rounded-md text-gray hover:text-teal hover:bg-teal-soft transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr key={`${p.id}-exp`} className="bg-teal-mist/40">
                      <td colSpan={11} className="!py-0">
                        <div className="px-6 py-4 border-l-2 border-teal flex flex-wrap gap-6">
                          <MiniField label="Email" value={p.email || "—"} />
                          <MiniField label="Address" value={p.address || "—"} />
                          <MiniField label="Blood Type" value={p.bloodType || "—"} />
                          <MiniField label="Insurance" value={p.insuranceName ? `${p.insuranceName} #${p.insuranceNumber || "—"}` : "Self-pay"} />
                          <div className="ml-auto">
                            <Link href={`/patients/${p.id}`} className="text-xs text-teal font-medium hover:underline">Open full profile →</Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-border bg-gray-lighter/40 flex items-center justify-between">
            <span className="text-[11px] text-gray">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-surface text-ink-soft hover:border-teal/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`min-w-[32px] px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                    page === n ? "bg-teal text-white border-teal" : "bg-surface text-ink-soft border-border hover:border-teal/30"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-surface text-ink-soft hover:border-teal/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </Card>

      <NewPatientModal open={open} onClose={() => setOpen(false)} onCreated={load} />
    </div>
  );
}

function MiniField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{label}</p>
      <p className="text-[12px] text-ink mt-0.5">{value}</p>
    </div>
  );
}

function NewPatientModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", dateOfBirth: "", gender: "MALE",
    phone: "", email: "", nationalId: "", bloodType: "",
    address: "", insuranceName: "", insuranceNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName) e.firstName = "Required";
    if (!form.lastName) e.lastName = "Required";
    if (!form.dateOfBirth) e.dateOfBirth = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const r = await fetch("/api/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (r.ok) {
      onCreated();
      onClose();
      setForm({ firstName: "", lastName: "", dateOfBirth: "", gender: "MALE", phone: "", email: "", nationalId: "", bloodType: "", address: "", insuranceName: "", insuranceNumber: "" });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Patient"
      description="Register a new patient in the system"
      size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={saving}>Create Patient</Button></>}
    >
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <Input label="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} error={errors.firstName} />
        <Input label="Last name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} error={errors.lastName} />
        <Input label="Date of birth" required type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} error={errors.dateOfBirth} />
        <Select label="Gender" required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </Select>
        <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="National ID" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} />
        <Select label="Blood type" value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })}>
          <option value="">—</option>
          {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
        <div className="col-span-2"><Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <Input label="Insurance provider" value={form.insuranceName} onChange={(e) => setForm({ ...form, insuranceName: e.target.value })} />
        <Input label="Insurance #" value={form.insuranceNumber} onChange={(e) => setForm({ ...form, insuranceNumber: e.target.value })} />
      </form>
    </Modal>
  );
}
