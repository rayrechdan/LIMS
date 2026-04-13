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
import { fmtDate, fmtDateTime } from "@/lib/format";

type InstrumentEvent = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  performedBy: string | null;
  timestamp: string;
};

type Instrument = {
  id: string;
  name: string;
  model: string | null;
  manufacturer: string | null;
  serialNumber: string;
  category: string;
  status: string;
  location: string | null;
  ipAddress: string | null;
  lastCalibrationAt: string | null;
  nextMaintenanceAt: string | null;
  installedAt: string | null;
  warrantyUntil: string | null;
  notes: string | null;
  testCodes: string | null;
  events: InstrumentEvent[];
  todayRuns: number;
  _count: { qcRuns: number };
};

const STATUS_TONE: Record<string, "success" | "neutral" | "warning" | "critical"> = {
  ONLINE: "success",
  OFFLINE: "neutral",
  MAINTENANCE: "warning",
  ERROR: "critical",
};

const STATUS_LABEL: Record<string, string> = {
  ONLINE: "● Online",
  OFFLINE: "● Offline",
  MAINTENANCE: "● Maintenance",
  ERROR: "● Error",
};

export default function InstrumentsPage() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Instrument | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/instruments");
    const d = await r.json();
    setInstruments(d.instruments || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter ? instruments.filter((i) => i.status === filter) : instruments;
  const counts = {
    online: instruments.filter((i) => i.status === "ONLINE").length,
    offline: instruments.filter((i) => i.status === "OFFLINE").length,
    maintenance: instruments.filter((i) => i.status === "MAINTENANCE").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-xs text-gray hover:text-teal">← Back to admin</Link>
        <PageHeader
          title="Instruments"
          description="Lab analyzers, calibration, and connectivity status"
          actions={
            <Button onClick={() => setAddOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Instrument
            </Button>
          }
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryStat label="Total" value={instruments.length} icon="grid" />
        <SummaryStat label="Online" value={counts.online} icon="zap" tone="success" />
        <SummaryStat label="Maintenance" value={counts.maintenance} icon="wrench" tone="warning" />
        <SummaryStat label="Offline / Error" value={counts.offline} icon="alert" tone="critical" />
      </div>

      {/* Filter */}
      <Card>
        <div className="px-6 py-3 border-b border-border flex items-center gap-2">
          {(["", "ONLINE", "MAINTENANCE", "OFFLINE"] as const).map((s) => (
            <button
              key={s || "all"}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                filter === s ? "bg-teal text-white border-teal" : "bg-surface text-gray border-border hover:border-teal/30"
              }`}
            >
              {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
          <span className="text-xs text-gray ml-auto">{filtered.length} instruments</span>
        </div>

        {/* Cards grid */}
        <div className="p-5">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray">Loading instruments…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray">No instruments match the filter</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((i) => (
                <InstrumentCard key={i.id} instrument={i} onClick={() => setSelected(i)} />
              ))}
            </div>
          )}
        </div>
      </Card>

      <InstrumentDrawer instrument={selected} onClose={() => setSelected(null)} />
      <AddInstrumentModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={load} />
    </div>
  );
}

function SummaryStat({ label, value, icon, tone = "teal" }: { label: string; value: number; icon: string; tone?: "teal" | "success" | "warning" | "critical" }) {
  const tones = {
    teal: "bg-teal-soft text-teal",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    critical: "bg-critical-soft text-critical",
  };
  const icons: Record<string, React.ReactNode> = {
    grid: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    zap: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    wrench: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    alert: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
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

function InstrumentCard({ instrument, onClick }: { instrument: Instrument; onClick: () => void }) {
  const tests = instrument.testCodes ? instrument.testCodes.split(",").filter(Boolean) : [];
  const calDaysAgo = instrument.lastCalibrationAt
    ? Math.floor((Date.now() - new Date(instrument.lastCalibrationAt).getTime()) / 86400000)
    : null;
  const maintInDays = instrument.nextMaintenanceAt
    ? Math.floor((new Date(instrument.nextMaintenanceAt).getTime() - Date.now()) / 86400000)
    : null;
  const maintLate = maintInDays != null && maintInDays < 0;

  return (
    <button
      onClick={onClick}
      className="text-left bg-surface rounded-lg border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-teal/30 hover:shadow-card-lg transition-all overflow-hidden group"
    >
      {/* Header strip */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
            instrument.status === "ONLINE" ? "bg-success-soft text-success" :
            instrument.status === "MAINTENANCE" ? "bg-warning-soft text-warning" :
            instrument.status === "OFFLINE" ? "bg-gray-lighter text-gray" :
            "bg-critical-soft text-critical"
          }`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              <circle cx="7" cy="9" r="1" /><line x1="11" y1="9" x2="17" y2="9" /><line x1="11" y1="12" x2="14" y2="12" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-ink truncate">{instrument.name}</h3>
            <p className="text-[11px] text-gray font-mono-data truncate">{instrument.model || "—"} · {instrument.serialNumber}</p>
          </div>
        </div>
        <StatusBadge tone={STATUS_TONE[instrument.status] || "neutral"}>{STATUS_LABEL[instrument.status] || instrument.status}</StatusBadge>
      </div>

      {/* Detail rows */}
      <div className="px-5 pb-4 space-y-2 text-[12px] text-ink-soft">
        <Row icon="map" text={instrument.location || "—"} />
        <Row
          icon="calibrate"
          text={
            instrument.lastCalibrationAt ? (
              <>
                <span className="text-gray">Last cal:</span> {fmtDate(instrument.lastCalibrationAt)}
                <span className="text-gray ml-1">({calDaysAgo}d ago)</span>
              </>
            ) : "Not calibrated"
          }
        />
        <Row
          icon="wrench"
          text={
            instrument.nextMaintenanceAt ? (
              <>
                <span className="text-gray">Next PM:</span>
                <span className={maintLate ? "text-critical font-semibold ml-1" : "ml-1"}>
                  {fmtDate(instrument.nextMaintenanceAt)}
                </span>
                <span className={`ml-1 ${maintLate ? "text-critical" : "text-gray"}`}>
                  ({maintLate ? `overdue ${Math.abs(maintInDays)}d` : `in ${maintInDays}d`})
                </span>
              </>
            ) : "—"
          }
        />
      </div>

      {/* Footer stats */}
      <div className="px-5 py-3 bg-gray-lighter/40 border-t border-border flex items-center justify-between text-[11px]">
        <div>
          <p className="text-gray font-semibold uppercase tracking-wider text-[9px]">Tests</p>
          <p className="text-base font-semibold text-ink font-mono-data mt-0.5">
            {tests.length}
            {tests.length > 0 && <span className="text-gray font-normal text-[10px] ml-1">{tests.slice(0, 2).join(", ")}{tests.length > 2 ? "…" : ""}</span>}
          </p>
        </div>
        <div>
          <p className="text-gray font-semibold uppercase tracking-wider text-[9px]">Today&apos;s Runs</p>
          <p className="text-base font-semibold text-teal font-mono-data mt-0.5">{instrument.todayRuns}</p>
        </div>
        <span className="text-teal text-[11px] font-medium group-hover:translate-x-0.5 transition-transform">Open →</span>
      </div>
    </button>
  );
}

function Row({ icon, text }: { icon: string; text: React.ReactNode }) {
  const icons: Record<string, React.ReactNode> = {
    map: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    calibrate: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    wrench: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  };
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray flex-shrink-0 mt-0.5">{icons[icon]}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

// ─── DRAWER ─────────────────────────────────────────────────────────

function InstrumentDrawer({ instrument, onClose }: { instrument: Instrument | null; onClose: () => void }) {
  if (!instrument) return null;

  const tests = instrument.testCodes ? instrument.testCodes.split(",").filter(Boolean) : [];
  const calEvents = instrument.events.filter((e) => e.type === "CALIBRATION");
  const maintEvents = instrument.events.filter((e) => e.type === "MAINTENANCE" || e.type === "REPAIR");

  return (
    <Drawer
      open={!!instrument}
      onClose={onClose}
      width="xl"
      title={instrument.name}
      description={`${instrument.model || ""} · ${instrument.serialNumber}`}
      footer={
        <>
          <Button variant="outline">Schedule Calibration</Button>
          <Button>Edit Instrument</Button>
        </>
      }
    >
      <div className="space-y-8">
        {/* Status banner */}
        <div className={`flex items-center justify-between p-4 rounded-lg border ${
          instrument.status === "ONLINE" ? "bg-success-soft border-success/15" :
          instrument.status === "MAINTENANCE" ? "bg-warning-soft border-warning/15" :
          instrument.status === "OFFLINE" ? "bg-gray-lighter border-border" :
          "bg-critical-soft border-critical/15"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-surface ${
              instrument.status === "ONLINE" ? "text-success" :
              instrument.status === "MAINTENANCE" ? "text-warning" :
              instrument.status === "OFFLINE" ? "text-gray" :
              "text-critical"
            }`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-gray">Status</p>
              <p className="text-base font-semibold text-ink">{STATUS_LABEL[instrument.status] || instrument.status}</p>
            </div>
          </div>
          <div className="text-right text-[11px]">
            <p className="text-gray uppercase tracking-wider font-semibold">Today&apos;s Runs</p>
            <p className="text-2xl font-semibold text-ink font-mono-data mt-0.5">{instrument.todayRuns}</p>
          </div>
        </div>

        {/* Specs grid */}
        <Section title="Specifications">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Manufacturer" value={instrument.manufacturer || "—"} />
            <Field label="Model" value={instrument.model || "—"} />
            <Field label="Serial Number" value={<span className="font-mono-data">{instrument.serialNumber}</span>} />
            <Field label="Category" value={instrument.category} />
            <Field label="Location" value={instrument.location || "—"} />
            <Field label="Installed" value={instrument.installedAt ? fmtDate(instrument.installedAt) : "—"} />
            <Field label="Warranty Until" value={instrument.warrantyUntil ? fmtDate(instrument.warrantyUntil) : "—"} />
            <Field label="Total QC Runs" value={<span className="font-mono-data">{instrument._count.qcRuns}</span>} />
          </div>
        </Section>

        {/* Connectivity */}
        <Section title="Connectivity">
          <div className="border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${
                instrument.status === "ONLINE" ? "bg-success animate-pulse" :
                instrument.status === "MAINTENANCE" ? "bg-warning" : "bg-gray-light"
              }`} />
              <div>
                <p className="text-[12px] font-medium text-ink">
                  {instrument.status === "ONLINE" ? "Connected" : instrument.status === "MAINTENANCE" ? "Maintenance Mode" : "Disconnected"}
                </p>
                <p className="text-[11px] text-gray font-mono-data">{instrument.ipAddress || "No IP assigned"}</p>
              </div>
            </div>
            <button className="text-[11px] text-teal hover:underline">Test connection →</button>
          </div>
        </Section>

        {/* Associated test menu */}
        <Section title={`Associated Tests (${tests.length})`}>
          {tests.length === 0 ? (
            <p className="text-xs text-gray">No tests associated with this instrument</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tests.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-soft text-teal text-[11px] font-mono-data font-semibold rounded-md border border-teal/15">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>
                  {t}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Calibration history timeline */}
        <Section title="Calibration History">
          {calEvents.length === 0 ? (
            <p className="text-xs text-gray">No calibration events</p>
          ) : (
            <ol className="relative border-l-2 border-border ml-2 space-y-3">
              {calEvents.map((e) => (
                <li key={e.id} className="ml-5">
                  <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-info border-2 border-surface" />
                  <div className="bg-info-soft border border-info/15 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold text-ink">{e.title}</p>
                      <span className="text-[10px] text-gray font-mono-data">{fmtDateTime(e.timestamp)}</span>
                    </div>
                    {e.performedBy && <p className="text-[11px] text-gray mt-1">By {e.performedBy}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Section>

        {/* Maintenance log */}
        <Section title="Maintenance Log">
          {maintEvents.length === 0 ? (
            <p className="text-xs text-gray">No maintenance events</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-gray-lighter">
                    <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray">Type</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray">Description</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray">By</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray">When</th>
                  </tr>
                </thead>
                <tbody>
                  {maintEvents.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-3 py-2"><StatusBadge tone={e.type === "REPAIR" ? "critical" : "warning"}>{e.type}</StatusBadge></td>
                      <td className="px-3 py-2 text-ink-soft">{e.title}</td>
                      <td className="px-3 py-2 text-gray">{e.performedBy || "—"}</td>
                      <td className="px-3 py-2 text-gray font-mono-data text-[11px]">{fmtDate(e.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {instrument.notes && (
          <Section title="Notes">
            <p className="text-xs text-ink-soft p-3 bg-gray-lighter/50 rounded-lg border border-border">{instrument.notes}</p>
          </Section>
        )}
      </div>
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{label}</p>
      <p className="text-[13px] text-ink mt-0.5">{value}</p>
    </div>
  );
}

// ─── ADD MODAL ───────────────────────────────────────────────────────

function AddInstrumentModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", model: "", manufacturer: "", serialNumber: "", category: "HEMATOLOGY",
    status: "ONLINE", location: "", ipAddress: "", testCodes: "", notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name) e.name = "Required";
    if (!form.serialNumber) e.serialNumber = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    await fetch("/api/instruments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    onCreated();
    onClose();
    setForm({ name: "", model: "", manufacturer: "", serialNumber: "", category: "HEMATOLOGY", status: "ONLINE", location: "", ipAddress: "", testCodes: "", notes: "" });
    setErrors({});
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Instrument"
      description="Register a new analyzer in the lab"
      size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={saving}>Create Instrument</Button></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <Input label="Instrument name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        <Input label="Serial number" required value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} error={errors.serialNumber} />
        <Input label="Manufacturer" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
        <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="HEMATOLOGY">Hematology</option>
          <option value="CHEMISTRY">Clinical Chemistry</option>
          <option value="IMMUNOASSAY">Immunoassay</option>
          <option value="MICROBIOLOGY">Microbiology</option>
          <option value="GENERAL">General</option>
        </Select>
        <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
          <option value="MAINTENANCE">Maintenance</option>
        </Select>
        <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} hint="e.g. Beirut Central · Hematology Lab" />
        <Input label="IP address" value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} hint="Optional, for connectivity" />
        <div className="col-span-2">
          <Input label="Test codes" value={form.testCodes} onChange={(e) => setForm({ ...form, testCodes: e.target.value })} hint="Comma-separated, e.g. CBC,BMP" />
        </div>
        <div className="col-span-2">
          <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}
