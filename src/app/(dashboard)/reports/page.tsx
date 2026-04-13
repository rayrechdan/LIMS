"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { AutoStatusBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime, fmtMoney, fmtDate } from "@/lib/format";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  orderedAt: string;
  patient: { firstName: string; lastName: string; mrn: string };
  doctor: { lastName: string } | null;
  items: { test: { code: string } }[];
  samples: { results: { status: string }[] }[];
};

export default function ReportsPage() {
  const [tab, setTab] = useState<"orders" | "builder">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/orders");
    const d = await r.json();
    setOrders((d.orders || []).filter((o: Order) => ["IN_PROGRESS", "COMPLETED"].includes(o.status)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Patient reports and custom report generation"
      />

      <Card>
        <Tabs
          tabs={[
            { value: "orders", label: "Order Reports", count: orders.length },
            { value: "builder", label: "Report Builder" },
          ]}
          active={tab}
          onChange={(v) => setTab(v as "orders" | "builder")}
        />

        {tab === "orders" && <OrdersTab orders={orders} loading={loading} />}
        {tab === "builder" && <ReportBuilderTab />}
      </Card>
    </div>
  );
}

// ─── ORDER REPORTS TAB ──────────────────────────────────────────────

function OrdersTab({ orders, loading }: { orders: Order[]; loading: boolean }) {
  return (
    <div className="overflow-auto">
      <table className="lims-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Tests</th>
            <th>Validated</th>
            <th>Status</th>
            <th>Ordered</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={8} className="text-center py-12 text-gray">Loading…</td></tr>}
          {!loading && orders.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray">No orders ready for reporting</td></tr>}
          {orders.map((o) => {
            const allResults = o.samples.flatMap((s) => s.results);
            const validated = allResults.filter((r) => r.status === "VALIDATED").length;
            const total = allResults.length;
            const pct = total ? Math.round((validated / total) * 100) : 0;
            return (
              <tr key={o.id}>
                <td className="font-mono-data text-[12px] text-teal">{o.orderNumber}</td>
                <td className="font-medium">{o.patient.firstName} {o.patient.lastName}</td>
                <td className="text-gray text-[12px]">{o.doctor ? `Dr. ${o.doctor.lastName}` : "—"}</td>
                <td className="text-gray text-[12px]">{o.items.map((i) => i.test.code).join(", ")}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-lighter rounded-full overflow-hidden">
                      <div className="h-full bg-teal" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-mono-data text-gray">{validated}/{total}</span>
                  </div>
                </td>
                <td><AutoStatusBadge status={o.status} /></td>
                <td className="text-gray text-[12px]">{fmtDateTime(o.orderedAt)}</td>
                <td className="text-right">
                  <Link href={`/reports/${o.id}`} className="text-xs text-teal hover:underline">
                    {pct === 100 ? "Sign & release →" : "Preview →"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── REPORT BUILDER TAB ─────────────────────────────────────────────

const REPORT_TYPES = [
  {
    key: "PATIENT",
    label: "Patient Report",
    desc: "Per-patient test history and result summaries",
    icon: "user",
    columns: ["Patient", "MRN", "Tests", "Status", "Date"],
  },
  {
    key: "TEST_SUMMARY",
    label: "Test Summary",
    desc: "Aggregate statistics by test (volume, TAT, revenue)",
    icon: "flask",
    columns: ["Test Code", "Test Name", "Volume", "Avg TAT", "Pass Rate", "Revenue"],
  },
  {
    key: "TAT",
    label: "TAT Report",
    desc: "Turnaround time analysis vs targets",
    icon: "clock",
    columns: ["Test", "Category", "Target TAT", "Actual TAT", "Within Target"],
  },
  {
    key: "FINANCIAL",
    label: "Financial Report",
    desc: "Revenue, payments, and outstanding balances",
    icon: "dollar",
    columns: ["Date", "Order #", "Patient", "Doctor", "Tests", "Amount", "Status"],
  },
  {
    key: "QC",
    label: "QC Report",
    desc: "Quality control and Westgard rule violations",
    icon: "check-shield",
    columns: ["Test", "Parameter", "Mean", "SD", "CV%", "Violations"],
  },
  {
    key: "CUSTOM",
    label: "Custom Report",
    desc: "Build a report with your own columns and filters",
    icon: "wrench",
    columns: ["Field 1", "Field 2", "Field 3", "Field 4"],
  },
] as const;

const SAMPLE_DATA: Record<string, (string | number)[][]> = {
  PATIENT: [
    ["Nour El-Amin", "MRN0000001", "CBC, BMP", "Released", "Apr 8, 2026"],
    ["Bassam Hariri", "MRN0000002", "Lipid, BMP", "Released", "Apr 7, 2026"],
    ["Layla Sayegh", "MRN0000003", "CBC", "In Progress", "Apr 6, 2026"],
    ["Ziad Maalouf", "MRN0000004", "TSH", "Released", "Apr 5, 2026"],
    ["Rima Najjar", "MRN0000005", "BMP, HbA1c", "Released", "Apr 5, 2026"],
  ],
  TEST_SUMMARY: [
    ["CBC", "Complete Blood Count", 142, "3.8h", "98%", "$3,550"],
    ["BMP", "Basic Metabolic Panel", 98, "5.2h", "97%", "$3,430"],
    ["LIPID", "Lipid Panel", 76, "7.1h", "99%", "$3,040"],
    ["HBA1C", "Hemoglobin A1c", 54, "10.3h", "100%", "$1,512"],
    ["TSH", "TSH", 41, "22.5h", "98%", "$1,230"],
  ],
  TAT: [
    ["CBC", "Hematology", "4h", "3.8h", "96%"],
    ["BMP", "Chemistry", "6h", "5.2h", "94%"],
    ["LIPID", "Chemistry", "8h", "7.1h", "97%"],
    ["HBA1C", "Endocrine", "12h", "10.3h", "99%"],
    ["TSH", "Endocrine", "24h", "22.5h", "92%"],
  ],
  FINANCIAL: [
    ["Apr 8", "ORD-2026-00045", "Nour El-Amin", "Dr. Mansour", "CBC, BMP", "$60.00", "Paid"],
    ["Apr 8", "ORD-2026-00044", "Bassam Hariri", "Dr. Aoun", "Lipid, BMP", "$75.00", "Paid"],
    ["Apr 7", "ORD-2026-00043", "Layla Sayegh", "—", "CBC", "$25.00", "Unpaid"],
    ["Apr 7", "ORD-2026-00042", "Ziad Maalouf", "Dr. Fares", "TSH", "$30.00", "Partial"],
    ["Apr 6", "ORD-2026-00041", "Rima Najjar", "Dr. Fares", "BMP, HbA1c", "$63.00", "Paid"],
  ],
  QC: [
    ["CBC", "WBC", "7.20", "0.18", "2.5%", "0"],
    ["CBC", "RBC", "5.10", "0.12", "2.4%", "0"],
    ["CBC", "HGB", "14.8", "0.31", "2.1%", "1"],
    ["BMP", "Glucose", "95.2", "2.10", "2.2%", "0"],
    ["BMP", "Creatinine", "0.92", "0.04", "4.3%", "2"],
  ],
  CUSTOM: [
    ["—", "—", "—", "—"],
    ["—", "—", "—", "—"],
    ["—", "—", "—", "—"],
  ],
};

function ReportBuilderTab() {
  const [type, setType] = useState<typeof REPORT_TYPES[number]["key"]>("PATIENT");
  const [from, setFrom] = useState("2026-04-01");
  const [to, setTo] = useState("2026-04-10");
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [testType, setTestType] = useState("");
  const [status, setStatus] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [format, setFormat] = useState<"PDF" | "EXCEL" | "CSV">("PDF");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const selected = REPORT_TYPES.find((r) => r.key === type)!;
  const data = SAMPLE_DATA[type] || [];

  return (
    <div className="grid grid-cols-12 gap-0 min-h-[640px]">
      {/* ─── LEFT PANEL (30%) ─── */}
      <div className="col-span-12 lg:col-span-4 border-r border-border">
        {/* Type selector */}
        <div className="p-5 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray mb-3">Report Type</p>
          <div className="space-y-1.5">
            {REPORT_TYPES.map((r) => {
              const isActive = type === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setType(r.key)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                    isActive ? "bg-teal-soft border-teal/30 ring-1 ring-teal/20" : "bg-surface border-border hover:border-teal/30"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? "bg-teal text-white" : "bg-gray-lighter text-gray"}`}>
                    {reportIcon(r.icon)}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[13px] font-medium ${isActive ? "text-teal" : "text-ink"}`}>{r.label}</p>
                    <p className="text-[10px] text-gray truncate leading-tight">{r.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Parameters */}
        <div className="p-5 space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray">Parameters</p>

          <div className="grid grid-cols-2 gap-3">
            <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All departments</option>
            <option value="hematology">Hematology</option>
            <option value="chemistry">Clinical Chemistry</option>
            <option value="endocrine">Endocrinology</option>
            <option value="microbiology">Microbiology</option>
          </Select>

          <Select label="Doctor" value={doctor} onChange={(e) => setDoctor(e.target.value)}>
            <option value="">All doctors</option>
            <option value="mansour">Dr. Mansour</option>
            <option value="fares">Dr. Fares</option>
            <option value="aoun">Dr. Aoun</option>
          </Select>

          <Select label="Test type" value={testType} onChange={(e) => setTestType(e.target.value)}>
            <option value="">All tests</option>
            <option value="CBC">CBC</option>
            <option value="BMP">BMP</option>
            <option value="LIPID">Lipid Panel</option>
            <option value="TSH">TSH</option>
          </Select>

          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
          </Select>

          <Select label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="none">None</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="department">Department</option>
            <option value="doctor">Doctor</option>
          </Select>

          <div>
            <p className="text-xs font-medium text-ink-soft mb-1.5">Output format</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["PDF", "EXCEL", "CSV"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`py-2 text-[12px] font-medium rounded-md border transition-colors ${
                    format === f ? "bg-teal text-white border-teal" : "bg-surface text-gray border-border hover:border-teal/30"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-5 border-t border-border space-y-2">
          <Button className="w-full" size="lg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Generate Report
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setScheduleOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Schedule Report
          </Button>
        </div>
      </div>

      {/* ─── RIGHT PANEL (70%) ─── */}
      <div className="col-span-12 lg:col-span-8 bg-gray-lighter/30">
        <div className="p-5 border-b border-border bg-surface flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray">Preview</p>
            <h3 className="text-base font-semibold text-ink mt-0.5">{selected.label}</h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray">
            <span className="px-2 py-1 bg-gray-lighter rounded font-mono-data">{from} → {to}</span>
            <span>·</span>
            <span>{data.length} rows shown</span>
          </div>
        </div>

        <div className="p-5">
          {/* Mock report header */}
          <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
            <div className="px-6 py-5 border-b-2 border-teal flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-teal">Klev Laboratory</h2>
                  <p className="text-[10px] text-gray uppercase tracking-wider">{selected.label}</p>
                </div>
              </div>
              <div className="text-right text-[11px] text-gray">
                <p>Generated {fmtDate(new Date())}</p>
                <p className="font-mono-data">{from} → {to}</p>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="lims-table">
                <thead>
                  <tr>
                    {selected.columns.map((c) => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={selected.columns.length} className="text-center py-12 text-gray">No data</td></tr>
                  ) : data.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => {
                        const isLast = j === row.length - 1;
                        const isMoney = typeof cell === "string" && cell.startsWith("$");
                        const isStatus = typeof cell === "string" && ["Released", "Paid", "Unpaid", "Partial", "In Progress"].includes(cell);
                        if (isStatus) {
                          return <td key={j}><AutoStatusBadge status={cell.replace(" ", "_").toUpperCase()} /></td>;
                        }
                        return (
                          <td key={j} className={(isMoney || j === 0 ? "font-mono-data " : "") + (isLast && type === "QC" && Number(cell) > 0 ? "text-critical font-semibold " : "")}>
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-border bg-gray-lighter/40 text-[10px] text-gray flex items-center justify-between">
              <span>Klev LIMS · Confidential</span>
              <span>Page 1 of 1</span>
            </div>
          </div>

          {/* Saved reports */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray">Saved Reports</h4>
              <Link href="#" className="text-[11px] text-teal hover:underline">View all →</Link>
            </div>
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
              <table className="lims-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Schedule</th>
                    <th>Last Run</th>
                    <th>Format</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Daily TAT Summary", type: "TAT", schedule: "Daily 8:00 AM", lastRun: "Apr 10, 2026 08:00", fmt: "PDF" },
                    { name: "Monthly Revenue", type: "Financial", schedule: "1st of month", lastRun: "Apr 1, 2026 09:15", fmt: "EXCEL" },
                    { name: "Weekly QC Review", type: "QC", schedule: "Mondays 9:00 AM", lastRun: "Apr 8, 2026 09:00", fmt: "PDF" },
                    { name: "Doctor Volume", type: "Custom", schedule: "Manual", lastRun: "Apr 5, 2026 14:22", fmt: "EXCEL" },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td className="font-medium">{r.name}</td>
                      <td className="text-gray text-[12px]">{r.type}</td>
                      <td>
                        {r.schedule === "Manual"
                          ? <StatusBadge tone="neutral">Manual</StatusBadge>
                          : <StatusBadge tone="teal">{r.schedule}</StatusBadge>}
                      </td>
                      <td className="text-gray text-[12px] font-mono-data">{r.lastRun}</td>
                      <td><StatusBadge tone={r.fmt === "PDF" ? "critical" : r.fmt === "EXCEL" ? "success" : "info"}>{r.fmt}</StatusBadge></td>
                      <td className="text-right">
                        <button className="text-xs text-teal hover:underline">Run →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ScheduleModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} reportName={selected.label} />
    </div>
  );
}

function reportIcon(name: string) {
  const props = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "user": return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case "flask": return <svg {...props}><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>;
    case "clock": return <svg {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "dollar": return <svg {...props}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case "check-shield": return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>;
    case "wrench": return <svg {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
    default: return null;
  }
}

function ScheduleModal({ open, onClose, reportName }: { open: boolean; onClose: () => void; reportName: string }) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [time, setTime] = useState("08:00");
  const [recipients, setRecipients] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Report"
      description={`Recurring delivery for: ${reportName}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save Schedule</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Schedule name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekly TAT Summary" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </Select>
          <Input label="Run at" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <Input label="Email recipients" value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="manager@lab.com, finance@lab.com" hint="Comma-separated email list" />
        <div className="p-3 bg-teal-soft border border-teal/15 rounded-lg flex items-start gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <p className="text-[11px] text-ink-soft">Reports will be generated and emailed automatically. The current parameters will be saved as the schedule template.</p>
        </div>
      </div>
    </Modal>
  );
}
