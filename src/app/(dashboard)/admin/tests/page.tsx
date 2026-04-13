"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtMoney } from "@/lib/format";

type Range = { gender: "MALE" | "FEMALE" | "ALL"; ageMin: number; ageMax: number; low: number | null; high: number | null; text: string | null };
type Parameter = { id: string; code: string; name: string; unit: string | null; refRangeLow: number | null; refRangeHigh: number | null; refRangeText: string | null; ranges?: Range[] };
type Test = {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  categoryId: string;
  category: { id: string; name: string };
  specimenType: string;
  containerType: string | null;
  price: number;
  turnaroundHours: number;
  method: string | null;
  isActive: boolean;
  parameters: Parameter[];
};

const SPECIMENS = ["BLOOD", "URINE", "STOOL", "TISSUE", "SWAB", "CSF", "OTHER"];
const AGE_BANDS = [
  { label: "<18 years", ageMin: 0, ageMax: 17 },
  { label: "18–60 years", ageMin: 18, ageMax: 60 },
  { label: "60+ years", ageMin: 61, ageMax: 120 },
];

export default function TestCatalogPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [editTest, setEditTest] = useState<Test | null>(null);
  const [editTab, setEditTab] = useState<"details" | "ranges" | "pricing">("details");
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/tests");
    const d = await r.json();
    setTests(d.tests || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = Array.from(new Map(tests.map((t) => [t.category.id, t.category])).values());

  const filtered = tests.filter((t) => {
    if (search && !`${t.code} ${t.name}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && t.categoryId !== categoryFilter) return false;
    if (statusFilter === "active" && !t.isActive) return false;
    if (statusFilter === "inactive" && t.isActive) return false;
    return true;
  });

  function openEdit(t: Test, tab: "details" | "ranges" | "pricing" = "details") {
    setEditTest(t);
    setEditTab(tab);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-xs text-gray hover:text-teal">← Back to admin</Link>
        <PageHeader
          title="Test Catalog"
          description="Configure tests, parameters, reference ranges, and pricing"
          actions={
            <Button onClick={() => setAddOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Test
            </Button>
          }
        />
      </div>

      <Card>
        <div className="px-6 py-3 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input type="search" placeholder="Search by code or name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="max-w-[200px]">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
          <span className="text-xs text-gray ml-auto">{filtered.length} tests</span>
        </div>

        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Test Name</th>
                <th>Category</th>
                <th>Sample Type</th>
                <th>TAT</th>
                <th>Price</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-12 text-gray">Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray">No tests match the filters</td></tr>}
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono-data text-[12px] text-teal">{t.code}</td>
                  <td>
                    <p className="font-medium text-ink">{t.name}</p>
                    <p className="text-[11px] text-gray">{t.parameters.length} parameter{t.parameters.length === 1 ? "" : "s"}</p>
                  </td>
                  <td className="text-gray text-[12px]">{t.category.name}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-soft">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-light"></span>
                      {t.specimenType}
                    </span>
                  </td>
                  <td className="font-mono-data text-[12px] text-gray">{t.turnaroundHours}h</td>
                  <td className="font-mono-data">{fmtMoney(t.price)}</td>
                  <td>
                    {t.isActive
                      ? <StatusBadge tone="success">● Active</StatusBadge>
                      : <StatusBadge tone="neutral">● Inactive</StatusBadge>}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <IconButton title="Edit" onClick={() => openEdit(t, "details")}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </IconButton>
                      <IconButton title="Reference Ranges" onClick={() => openEdit(t, "ranges")}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
                      </IconButton>
                      <IconButton title="Pricing" onClick={() => openEdit(t, "pricing")}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <EditTestModal
        test={editTest}
        tab={editTab}
        setTab={setEditTab}
        onClose={() => setEditTest(null)}
        onSaved={load}
        categories={categories}
      />

      <AddTestModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={load} categories={categories} />
    </div>
  );
}

function IconButton({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} className="p-1.5 rounded-md text-gray hover:text-teal hover:bg-teal-soft transition-colors">
      {children}
    </button>
  );
}

// ─── EDIT TEST MODAL ────────────────────────────────────────────────

function EditTestModal({
  test, tab, setTab, onClose, onSaved, categories,
}: {
  test: Test | null;
  tab: "details" | "ranges" | "pricing";
  setTab: (t: "details" | "ranges" | "pricing") => void;
  onClose: () => void;
  onSaved: () => void;
  categories: { id: string; name: string }[];
}) {
  const [form, setForm] = useState({
    code: "", name: "", nameAr: "", description: "", categoryId: "", specimenType: "BLOOD",
    containerType: "", price: "0", turnaroundHours: "24", method: "", isActive: true,
  });
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [rangesByParam, setRangesByParam] = useState<Record<string, Record<string, Range>>>({});
  const [saving, setSaving] = useState(false);
  const [activeParamId, setActiveParamId] = useState<string | null>(null);

  useEffect(() => {
    if (!test) return;
    setForm({
      code: test.code,
      name: test.name,
      nameAr: test.nameAr || "",
      description: test.description || "",
      categoryId: test.categoryId,
      specimenType: test.specimenType,
      containerType: test.containerType || "",
      price: String(test.price),
      turnaroundHours: String(test.turnaroundHours),
      method: test.method || "",
      isActive: test.isActive,
    });

    // Fetch full test with ranges
    fetch(`/api/tests/${test.id}`)
      .then((r) => r.json())
      .then((d) => {
        const t: Test = d.test;
        setParameters(t.parameters);
        setActiveParamId(t.parameters[0]?.id || null);
        // Build ranges map: paramId -> "GENDER:ageMin-ageMax" -> range
        const map: Record<string, Record<string, Range>> = {};
        for (const p of t.parameters) {
          map[p.id] = {};
          for (const g of ["MALE", "FEMALE"] as const) {
            for (const band of AGE_BANDS) {
              const key = `${g}:${band.ageMin}-${band.ageMax}`;
              const existing = (p.ranges || []).find(
                (r) => r.gender === g && r.ageMin === band.ageMin && r.ageMax === band.ageMax
              );
              map[p.id][key] = existing || {
                gender: g,
                ageMin: band.ageMin,
                ageMax: band.ageMax,
                low: p.refRangeLow,
                high: p.refRangeHigh,
                text: p.refRangeText,
              };
            }
          }
        }
        setRangesByParam(map);
      });
  }, [test]);

  function updateRange(paramId: string, key: string, field: "low" | "high", value: string) {
    setRangesByParam((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        [key]: { ...prev[paramId][key], [field]: value === "" ? null : parseFloat(value) },
      },
    }));
  }

  async function saveDetails() {
    if (!test) return;
    setSaving(true);
    await fetch(`/api/tests/${test.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  async function saveRanges() {
    if (!test) return;
    setSaving(true);
    const payload = {
      parameters: parameters.map((p) => ({
        parameterId: p.id,
        ranges: Object.values(rangesByParam[p.id] || {}).filter((r) => r.low != null || r.high != null),
      })),
    };
    await fetch(`/api/tests/${test.id}/ranges`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  if (!test) return null;

  return (
    <Modal
      open={!!test}
      onClose={onClose}
      title={`Edit · ${test.name}`}
      description={`${test.code} · ${test.parameters.length} parameter${test.parameters.length === 1 ? "" : "s"}`}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {tab === "ranges" ? (
            <Button onClick={saveRanges} loading={saving}>Save Ranges</Button>
          ) : (
            <Button onClick={saveDetails} loading={saving}>Save Changes</Button>
          )}
        </>
      }
    >
      <div className="border-b border-border -mt-2 -mx-6 px-6">
        <div className="flex items-center gap-1">
          {(["details", "ranges", "pricing"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
                tab === t ? "text-teal" : "text-gray hover:text-ink"
              }`}
            >
              {t === "details" ? "Test Details" : t === "ranges" ? "Reference Ranges" : "Pricing"}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal" />}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-5">
        {tab === "details" && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Test code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Input label="Test name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="col-span-2">
              <Input label="Name (AR)" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            </div>
            <Select label="Category / Department" required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Sample type" required value={form.specimenType} onChange={(e) => setForm({ ...form, specimenType: e.target.value })}>
              {SPECIMENS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Container type" value={form.containerType} onChange={(e) => setForm({ ...form, containerType: e.target.value })} hint="e.g. EDTA, SST" />
            <Input label="Method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} hint="e.g. Spectrophotometry" />
            <Input label="TAT (hours)" type="number" required value={form.turnaroundHours} onChange={(e) => setForm({ ...form, turnaroundHours: e.target.value })} />
            <Input label="Price (USD)" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <div className="col-span-2">
              <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="col-span-2 flex items-center gap-3 p-3 bg-gray-lighter/40 rounded-lg border border-border">
              <input type="checkbox" id="active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-teal cursor-pointer" />
              <label htmlFor="active" className="text-[13px] text-ink-soft cursor-pointer">Active — available for ordering</label>
            </div>
          </div>
        )}

        {tab === "ranges" && (
          <div className="grid grid-cols-12 gap-4">
            {/* Parameter list */}
            <div className="col-span-3 border-r border-border pr-4 max-h-[60vh] overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wider text-gray font-semibold mb-2">Parameters</p>
              <div className="space-y-1">
                {parameters.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveParamId(p.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-[12px] transition-colors ${
                      activeParamId === p.id ? "bg-teal-soft text-teal font-medium" : "text-ink-soft hover:bg-gray-lighter"
                    }`}
                  >
                    <p className="font-mono-data text-[10px] text-gray">{p.code}</p>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Range editor for active parameter */}
            <div className="col-span-9">
              {(() => {
                const p = parameters.find((x) => x.id === activeParamId);
                if (!p) return <p className="text-sm text-gray">Select a parameter</p>;
                const map = rangesByParam[p.id] || {};
                return (
                  <>
                    <div className="mb-3 flex items-baseline justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-ink">{p.name}</h3>
                        <p className="text-[11px] text-gray font-mono-data">{p.code} {p.unit && `· ${p.unit}`}</p>
                      </div>
                    </div>

                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="bg-gray-lighter">
                            <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray">Group</th>
                            <th className="text-center px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray">Low</th>
                            <th className="text-center px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray">High</th>
                            <th className="text-center px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(["MALE", "FEMALE"] as const).map((gender) =>
                            AGE_BANDS.map((band, bIdx) => {
                              const key = `${gender}:${band.ageMin}-${band.ageMax}`;
                              const r = map[key] || { gender, ageMin: band.ageMin, ageMax: band.ageMax, low: null, high: null, text: null };
                              return (
                                <tr key={`${gender}-${bIdx}`} className={(gender === "FEMALE" ? "bg-gray-lighter/30 " : "") + "border-t border-border"}>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${gender === "MALE" ? "bg-info-soft text-info" : "bg-critical-soft text-critical"}`}>
                                        {gender === "MALE" ? "M" : "F"}
                                      </span>
                                      <span className="text-ink-soft">{band.label}</span>
                                    </div>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={r.low ?? ""}
                                      onChange={(e) => updateRange(p.id, key, "low", e.target.value)}
                                      className="font-mono-data text-center"
                                      placeholder="—"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={r.high ?? ""}
                                      onChange={(e) => updateRange(p.id, key, "high", e.target.value)}
                                      className="font-mono-data text-center"
                                      placeholder="—"
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-center text-gray font-mono-data">{p.unit || "—"}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-gray mt-3">
                      Reference ranges are applied automatically when results are entered, based on the patient&apos;s age and gender.
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {tab === "pricing" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Standard price (USD)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <Input label="Turnaround time (hours)" type="number" value={form.turnaroundHours} onChange={(e) => setForm({ ...form, turnaroundHours: e.target.value })} />
            </div>
            <div className="p-4 bg-teal-soft rounded-lg border border-teal/15">
              <p className="text-[11px] uppercase tracking-wider text-teal font-semibold">Insurance Tariffs</p>
              <p className="text-xs text-gray mt-1">Insurance-specific pricing tiers can be configured here in a later release.</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── ADD TEST MODAL ─────────────────────────────────────────────────

function AddTestModal({
  open, onClose, onCreated, categories,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  categories: { id: string; name: string }[];
}) {
  const [form, setForm] = useState({
    code: "", name: "", categoryId: "", specimenType: "BLOOD", containerType: "", price: "0", turnaroundHours: "24", method: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.code) e.code = "Required";
    if (!form.name) e.name = "Required";
    if (!form.categoryId) e.categoryId = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    await fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, parameters: [] }),
    });
    setSaving(false);
    onCreated();
    onClose();
    setForm({ code: "", name: "", categoryId: "", specimenType: "BLOOD", containerType: "", price: "0", turnaroundHours: "24", method: "" });
    setErrors({});
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Test"
      description="Create a new test in the catalog. Parameters and ranges can be configured after creation."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Create Test</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Input label="Test code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} error={errors.code} hint="e.g. CBC, LIPID" />
        <Input label="Test name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        <Select label="Category" required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} error={errors.categoryId}>
          <option value="">— Select —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Sample type" required value={form.specimenType} onChange={(e) => setForm({ ...form, specimenType: e.target.value })}>
          {SPECIMENS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input label="Container type" value={form.containerType} onChange={(e) => setForm({ ...form, containerType: e.target.value })} />
        <Input label="Method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} />
        <Input label="Price (USD)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <Input label="TAT (hours)" type="number" value={form.turnaroundHours} onChange={(e) => setForm({ ...form, turnaroundHours: e.target.value })} />
      </div>
    </Modal>
  );
}
