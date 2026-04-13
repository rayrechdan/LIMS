"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Hours = { open: string; close: string; closed: boolean };
type WeekHours = Record<string, Hours>;

type Branch = {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  managerName: string | null;
  managerPhone: string | null;
  isActive: boolean;
  isMain: boolean;
  homeCollection: boolean;
  collectionZone: string | null;
  services: string | null;
  hours: string | null;
  staffCount: number;
  todaySamples: number;
};

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const SERVICE_OPTIONS = [
  { key: "PHLEBOTOMY", label: "Phlebotomy / Blood Draw" },
  { key: "IMAGING", label: "Imaging (X-ray, US)" },
  { key: "PCR", label: "PCR Testing" },
  { key: "COVID", label: "COVID Testing" },
  { key: "VACCINATION", label: "Vaccinations" },
  { key: "HOME_COLLECTION", label: "Home Collection" },
  { key: "ECG", label: "ECG" },
  { key: "GENETIC", label: "Genetic Testing" },
];

function defaultHours(): WeekHours {
  return Object.fromEntries(DAYS.map((d) => [d.key, { open: "08:00", close: "18:00", closed: false }]));
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Branch | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/branches");
    const d = await r.json();
    setBranches(d.branches || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-xs text-gray hover:text-teal">← Back to admin</Link>
        <PageHeader
          title="Branches"
          description="Manage lab locations, services, and operating hours"
          actions={
            <Button onClick={() => setAddOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Branch
            </Button>
          }
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryStat label="Total Branches" value={branches.length} icon="building" />
        <SummaryStat label="Active" value={branches.filter((b) => b.isActive).length} icon="check" tone="success" />
        <SummaryStat label="Home Collection" value={branches.filter((b) => b.homeCollection).length} icon="home" tone="info" />
        <SummaryStat label="Total Staff" value={branches.reduce((s, b) => s + b.staffCount, 0)} icon="users" tone="teal" />
      </div>

      {/* Cards grid */}
      {loading ? (
        <Card><div className="py-16 text-center text-sm text-gray">Loading branches…</div></Card>
      ) : branches.length === 0 ? (
        <Card><div className="py-16 text-center text-sm text-gray">No branches yet</div></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => (
            <BranchCard key={b.id} branch={b} onClick={() => setSelected(b)} />
          ))}
        </div>
      )}

      <BranchDrawer branch={selected} onClose={() => setSelected(null)} onSaved={load} />
      <AddBranchModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={load} />
    </div>
  );
}

function SummaryStat({ label, value, icon, tone = "teal" }: { label: string; value: number; icon: string; tone?: "teal" | "success" | "info" }) {
  const tones = {
    teal: "bg-teal-soft text-teal",
    success: "bg-success-soft text-success",
    info: "bg-info-soft text-info",
  };
  const icons: Record<string, React.ReactNode> = {
    building: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
    check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  };
  return (
    <div className="bg-surface rounded-lg border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray">{label}</p>
        <p className="text-3xl font-semibold text-ink mt-2 font-mono-data">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
        {icons[icon]}
      </div>
    </div>
  );
}

function BranchCard({ branch, onClick }: { branch: Branch; onClick: () => void }) {
  let weekHours: WeekHours | null = null;
  try { weekHours = branch.hours ? JSON.parse(branch.hours) : null; } catch {}
  const today = DAYS[(new Date().getDay() + 6) % 7]; // monday-first
  const todayHours = weekHours?.[today.key];

  return (
    <button
      onClick={onClick}
      className="text-left bg-surface rounded-lg border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-teal/30 hover:shadow-card-lg transition-all overflow-hidden group"
    >
      {/* Header strip */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: branch.isMain ? "linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)" : "linear-gradient(135deg, #1D9E75 0%, #34B589 100%)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><circle cx="12" cy="10" r="1.5"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-ink truncate">{branch.name}</h3>
              {branch.isMain && <span className="text-[9px] font-bold uppercase text-teal bg-teal-soft px-1.5 py-0.5 rounded">Main</span>}
            </div>
            <p className="text-[11px] text-gray font-mono-data">{branch.code}</p>
          </div>
        </div>
        {branch.isActive
          ? <StatusBadge tone="success">● Active</StatusBadge>
          : <StatusBadge tone="critical">● Inactive</StatusBadge>}
      </div>

      <div className="px-5 pb-4 space-y-2 text-[12px] text-ink-soft">
        <Row icon="map" text={branch.address || "—"} />
        <Row icon="phone" text={branch.phone || "—"} />
        <Row
          icon="user"
          text={branch.managerName ? <><span className="text-gray">Manager:</span> {branch.managerName}</> : "—"}
        />
        <Row
          icon="clock"
          text={
            todayHours
              ? todayHours.closed
                ? <span className="text-critical">Closed today</span>
                : <><span className="text-gray">Today:</span> <span className="font-mono-data">{todayHours.open}–{todayHours.close}</span></>
              : "—"
          }
        />
      </div>

      {/* Footer stats */}
      <div className="px-5 py-3 bg-gray-lighter/40 border-t border-border flex items-center justify-between text-[11px]">
        <div>
          <p className="text-gray font-semibold uppercase tracking-wider text-[10px]">Active Staff</p>
          <p className="text-base font-semibold text-ink font-mono-data mt-0.5">{branch.staffCount}</p>
        </div>
        <div>
          <p className="text-gray font-semibold uppercase tracking-wider text-[10px]">Today&apos;s Samples</p>
          <p className="text-base font-semibold text-teal font-mono-data mt-0.5">{branch.todaySamples}</p>
        </div>
        <span className="text-teal text-[11px] font-medium group-hover:translate-x-0.5 transition-transform">Open →</span>
      </div>
    </button>
  );
}

function Row({ icon, text }: { icon: string; text: React.ReactNode }) {
  const icons: Record<string, React.ReactNode> = {
    map: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    phone: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    user: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    clock: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  };
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray flex-shrink-0 mt-0.5">{icons[icon]}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

// ─── DRAWER ─────────────────────────────────────────────────────────

function BranchDrawer({ branch, onClose, onSaved }: { branch: Branch | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", code: "", address: "", city: "", phone: "", email: "",
    managerName: "", managerPhone: "", isActive: true, homeCollection: false, collectionZone: "",
  });
  const [hours, setHours] = useState<WeekHours>(defaultHours());
  const [services, setServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!branch) return;
    setForm({
      name: branch.name,
      code: branch.code,
      address: branch.address || "",
      city: branch.city || "",
      phone: branch.phone || "",
      email: branch.email || "",
      managerName: branch.managerName || "",
      managerPhone: branch.managerPhone || "",
      isActive: branch.isActive,
      homeCollection: branch.homeCollection,
      collectionZone: branch.collectionZone || "",
    });
    try {
      setHours(branch.hours ? JSON.parse(branch.hours) : defaultHours());
    } catch { setHours(defaultHours()); }
    setServices(branch.services ? branch.services.split(",").filter(Boolean) : []);
  }, [branch]);

  function setDayField(day: string, field: keyof Hours, value: string | boolean) {
    setHours((h) => ({ ...h, [day]: { ...h[day], [field]: value } }));
  }

  function toggleService(key: string) {
    setServices((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));
  }

  async function save() {
    if (!branch) return;
    setSaving(true);
    await fetch(`/api/branches/${branch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        hours: JSON.stringify(hours),
        services: services.join(","),
      }),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Drawer
      open={!!branch}
      onClose={onClose}
      title={branch ? `${branch.name}` : ""}
      description={branch ? `${branch.code} · ${branch.city || "—"}` : ""}
      width="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>Save Changes</Button>
        </>
      }
    >
      {branch && (
        <div className="space-y-8">
          {/* Status banner */}
          <div className="flex items-center justify-between p-3 bg-teal-soft border border-teal/15 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface text-teal flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/></svg>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-teal">Branch Status</p>
                <p className="text-xs text-gray">Toggle to disable bookings and intake at this location</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <div className="w-11 h-6 bg-gray-light rounded-full peer-checked:bg-teal transition-colors" />
              <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </label>
          </div>

          {/* Contact */}
          <Section title="Contact Information">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Branch name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Branch code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              <div className="col-span-2">
                <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <div className="col-span-2">
                <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <Input label="Manager name" value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} />
              <Input label="Manager phone" type="tel" value={form.managerPhone} onChange={(e) => setForm({ ...form, managerPhone: e.target.value })} />
            </div>
          </Section>

          {/* Hours */}
          <Section title="Operating Hours">
            <div className="border border-border rounded-lg overflow-hidden">
              {DAYS.map((d) => {
                const day = hours[d.key] || { open: "08:00", close: "18:00", closed: false };
                return (
                  <div key={d.key} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                    <p className="w-12 text-[12px] font-semibold text-ink-soft">{d.label}</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!day.closed}
                        onChange={(e) => setDayField(d.key, "closed", !e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-gray-light rounded-full peer-checked:bg-teal transition-colors" />
                      <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                    </label>
                    {day.closed ? (
                      <p className="text-[12px] text-gray italic flex-1">Closed</p>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={day.open}
                          onChange={(e) => setDayField(d.key, "open", e.target.value)}
                          className="font-mono-data max-w-[110px]"
                        />
                        <span className="text-gray text-[12px]">to</span>
                        <input
                          type="time"
                          value={day.close}
                          onChange={(e) => setDayField(d.key, "close", e.target.value)}
                          className="font-mono-data max-w-[110px]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Services */}
          <Section title="Services Offered">
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_OPTIONS.map((s) => {
                const checked = services.includes(s.key);
                return (
                  <label
                    key={s.key}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                      checked ? "bg-teal-soft border-teal/30" : "bg-surface border-border hover:border-teal/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(s.key)}
                      className="w-4 h-4 accent-teal cursor-pointer"
                    />
                    <span className="text-[13px] text-ink-soft">{s.label}</span>
                  </label>
                );
              })}
            </div>
          </Section>

          {/* Home Collection */}
          <Section title="Home Collection">
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-gray-lighter/40 rounded-lg border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.homeCollection}
                  onChange={(e) => setForm({ ...form, homeCollection: e.target.checked })}
                  className="w-4 h-4 accent-teal cursor-pointer"
                />
                <span className="text-[13px] text-ink-soft">Offer home collection from this branch</span>
              </label>
              {form.homeCollection && (
                <>
                  <Textarea
                    label="Collection zone"
                    rows={2}
                    placeholder="e.g. Hamra, Verdun, Manara, Achrafieh"
                    value={form.collectionZone}
                    onChange={(e) => setForm({ ...form, collectionZone: e.target.value })}
                    hint="Comma-separated list of neighborhoods"
                  />

                  {/* Map placeholder */}
                  <div className="relative w-full aspect-[16/8] rounded-lg border border-border overflow-hidden bg-teal-mist">
                    <div className="absolute inset-0" style={{
                      backgroundImage: "radial-gradient(circle at 25% 35%, rgba(29,158,117,0.15), transparent 35%), radial-gradient(circle at 60% 50%, rgba(29,158,117,0.18), transparent 40%), radial-gradient(circle at 75% 30%, rgba(29,158,117,0.12), transparent 30%)",
                      backgroundColor: "#F0F9F5",
                    }} />
                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-30" style={{
                      backgroundImage: "linear-gradient(to right, #1D9E75 1px, transparent 1px), linear-gradient(to bottom, #1D9E75 1px, transparent 1px)",
                      backgroundSize: "32px 32px",
                    }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="w-10 h-10 mx-auto rounded-full bg-teal text-white flex items-center justify-center shadow-lg">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                      </div>
                      <p className="text-[11px] text-gray mt-2">Map preview · {form.city || "—"}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Section>

          {/* Staff */}
          <Section title="Staff Assigned">
            <div className="flex items-center justify-between p-4 bg-gray-lighter/40 rounded-lg border border-border">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray font-semibold">Active Staff</p>
                <p className="text-2xl font-semibold text-ink mt-1 font-mono-data">{branch.staffCount}</p>
              </div>
              <Link href="/admin/users" className="text-xs text-teal font-medium hover:underline">Manage staff →</Link>
            </div>
          </Section>
        </div>
      )}
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ─── ADD BRANCH MODAL ───────────────────────────────────────────────

function AddBranchModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    code: "", name: "", address: "", city: "", phone: "", email: "", managerName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.code) e.code = "Required";
    if (!form.name) e.name = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        hours: JSON.stringify(defaultHours()),
        services: "PHLEBOTOMY",
      }),
    });
    setSaving(false);
    onCreated();
    onClose();
    setForm({ code: "", name: "", address: "", city: "", phone: "", email: "", managerName: "" });
    setErrors({});
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Branch"
      description="Create a new lab location"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Create Branch</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Input label="Branch code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} error={errors.code} hint="e.g. BRT-CTR" />
        <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <div className="col-span-2">
          <Input label="Branch name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        </div>
        <div className="col-span-2">
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div className="col-span-2">
          <Input label="Manager name" value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}
