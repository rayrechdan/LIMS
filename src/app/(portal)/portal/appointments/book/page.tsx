"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StepWizard } from "@/components/ui/StepWizard";
import { fmtMoney } from "@/lib/format";

type Test = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  turnaroundHours: number;
  specimenType: string;
  category: { id: string; name: string };
};

const POPULAR_CODES = ["CBC", "BMP", "LIPID", "HBA1C", "TSH", "UA"];
const FASTING_TESTS = ["LIPID", "BMP", "HBA1C"];

export default function BookStep1Page() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [collectionType, setCollectionType] = useState<"WALKIN" | "HOME">("WALKIN");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tests").then((r) => r.json()).then((d) => {
      setTests(d.tests || []);
      setLoading(false);
    });
    // Restore previous selection
    const saved = typeof window !== "undefined" ? localStorage.getItem("portal-booking") : null;
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.testIds) setSelectedIds(data.testIds);
        if (data.collectionType) setCollectionType(data.collectionType);
      } catch {}
    }
  }, []);

  const categories = Array.from(new Map(tests.map((t) => [t.category.id, t.category])).values());
  const popular = tests.filter((t) => POPULAR_CODES.includes(t.code));

  const filtered = tests.filter((t) => {
    if (activeCategory !== "ALL" && t.category.id !== activeCategory) return false;
    if (search && !`${t.code} ${t.name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedTests = tests.filter((t) => selectedIds.includes(t.id));
  const subtotal = selectedTests.reduce((s, t) => s + t.price, 0);
  const homeFee = collectionType === "HOME" ? 15 : 0;
  const total = subtotal + homeFee;
  const fastingRequired = selectedTests.some((t) => FASTING_TESTS.includes(t.code));

  function toggleTest(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function continueToDateTime() {
    if (selectedIds.length === 0) return;
    localStorage.setItem("portal-booking", JSON.stringify({ testIds: selectedIds, collectionType, fastingRequired, total }));
    router.push("/portal/appointments/book/datetime");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/appointments" className="text-xs text-gray hover:text-teal">← Back to appointments</Link>
        <PageHeader title="Book an Appointment" description="Choose the tests you'd like to schedule" />
      </div>

      {/* Step wizard */}
      <StepWizard current={1} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── LEFT: Test selection ─── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Collection type */}
          <Card>
            <CardHeader><CardTitle>Collection Type</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { v: "WALKIN", icon: "building", title: "Walk-in", desc: "Visit any of our branches", note: "Free" },
                  { v: "HOME", icon: "home", title: "Home Visit", desc: "Sample collected at your address", note: "+ $15 fee" },
                ] as const).map((opt) => {
                  const active = collectionType === opt.v;
                  return (
                    <button
                      key={opt.v}
                      onClick={() => setCollectionType(opt.v)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        active ? "bg-teal-soft border-teal/30 ring-1 ring-teal/20" : "bg-surface border-border hover:border-teal/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-teal text-white" : "bg-gray-lighter text-gray"}`}>
                          {opt.icon === "building" ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/></svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          )}
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-teal" : "text-gray"}`}>{opt.note}</span>
                      </div>
                      <p className={`text-sm font-semibold mt-3 ${active ? "text-teal" : "text-ink"}`}>{opt.title}</p>
                      <p className="text-[11px] text-gray mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Search */}
          <Card>
            <div className="px-6 py-3 border-b border-border">
              <div className="relative">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tests by name or code…" className="pl-9" />
              </div>
            </div>

            {/* Popular tests grid */}
            {!search && activeCategory === "ALL" && (
              <div className="px-6 py-5 border-b border-border bg-gray-lighter/30">
                <p className="text-[10px] uppercase tracking-wider text-gray font-semibold mb-3">Popular Tests</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {loading && <p className="text-xs text-gray col-span-3">Loading…</p>}
                  {popular.map((t) => (
                    <PopularTestCard
                      key={t.id}
                      test={t}
                      checked={selectedIds.includes(t.id)}
                      onToggle={() => toggleTest(t.id)}
                      fasting={FASTING_TESTS.includes(t.code)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Category filter */}
            <div className="px-6 py-3 border-b border-border flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-gray mr-1">Browse:</span>
              <button
                onClick={() => setActiveCategory("ALL")}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  activeCategory === "ALL" ? "bg-teal text-white border-teal" : "bg-surface text-gray border-border hover:border-teal/30"
                }`}
              >
                All tests
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

            {/* Filtered list */}
            <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
              {loading && <p className="text-xs text-gray text-center py-6">Loading…</p>}
              {!loading && filtered.length === 0 && <p className="text-xs text-gray text-center py-6">No tests found</p>}
              {filtered.map((t) => (
                <TestRow key={t.id} test={t} checked={selectedIds.includes(t.id)} onToggle={() => toggleTest(t.id)} fasting={FASTING_TESTS.includes(t.code)} />
              ))}
            </div>
          </Card>
        </div>

        {/* ─── RIGHT: Summary sidebar ─── */}
        <div className="lg:col-span-4">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Selected Tests</CardTitle>
              <span className="text-[11px] text-gray font-mono-data">{selectedIds.length} item{selectedIds.length === 1 ? "" : "s"}</span>
            </CardHeader>
            <CardBody className="space-y-4">
              {selectedTests.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gray-lighter text-gray flex items-center justify-center mb-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>
                  </div>
                  <p className="text-sm text-gray">No tests selected</p>
                  <p className="text-[11px] text-gray-light mt-1">Choose from the list to begin</p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto">
                  {selectedTests.map((t) => (
                    <li key={t.id} className="flex items-start justify-between gap-2 p-2 rounded-md bg-teal-soft/40">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono-data text-[10px] text-teal">{t.code}</p>
                        <p className="text-[12px] font-medium text-ink truncate">{t.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono-data text-[12px] text-ink">{fmtMoney(t.price)}</p>
                        <button onClick={() => toggleTest(t.id)} className="text-[10px] text-critical hover:underline">Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Totals */}
              {selectedTests.length > 0 && (
                <div className="border-t border-border pt-3 space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between text-gray">
                    <span>Subtotal</span>
                    <span className="font-mono-data">{fmtMoney(subtotal)}</span>
                  </div>
                  {homeFee > 0 && (
                    <div className="flex items-center justify-between text-gray">
                      <span>Home collection</span>
                      <span className="font-mono-data">+ {fmtMoney(homeFee)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs font-semibold text-ink-soft">Estimated total</span>
                    <span className="text-xl font-semibold font-mono-data text-ink">{fmtMoney(total)}</span>
                  </div>
                </div>
              )}

              {fastingRequired && selectedTests.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-warning-soft border border-warning/20 rounded-lg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                  <p className="text-[11px] text-warning font-medium">Fasting required for one or more selected tests. Please don&apos;t eat for at least 8 hours before collection.</p>
                </div>
              )}

              <Button
                onClick={continueToDateTime}
                disabled={selectedIds.length === 0}
                className="w-full"
                size="lg"
              >
                Choose Date &amp; Time
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PopularTestCard({ test, checked, onToggle, fasting }: { test: Test; checked: boolean; onToggle: () => void; fasting: boolean }) {
  return (
    <button
      onClick={onToggle}
      className={`text-left p-4 rounded-lg border transition-all relative ${
        checked ? "bg-teal-soft border-teal/30 ring-1 ring-teal/20" : "bg-surface border-border hover:border-teal/30 hover:shadow-sm"
      }`}
    >
      {checked && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal text-white flex items-center justify-center">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
      )}
      <div className="flex items-center gap-2 mb-2">
        <p className="font-mono-data text-[11px] text-teal">{test.code}</p>
        {fasting && (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-warning bg-warning-soft px-1.5 py-0.5 rounded">
            Fasting
          </span>
        )}
      </div>
      <p className="text-[13px] font-semibold text-ink leading-tight">{test.name}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-gray">{test.specimenType} · {test.turnaroundHours}h</span>
        <span className="font-mono-data text-[13px] font-semibold text-ink">{fmtMoney(test.price)}</span>
      </div>
    </button>
  );
}

function TestRow({ test, checked, onToggle, fasting }: { test: Test; checked: boolean; onToggle: () => void; fasting: boolean }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
        checked ? "bg-teal-soft border-teal/30" : "bg-surface border-border hover:border-teal/30"
      }`}
    >
      <span className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 ${checked ? "bg-teal border-teal" : "border-border"}`}>
        {checked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-mono-data text-[10px] text-teal">{test.code}</p>
          {fasting && <span className="text-[9px] font-bold uppercase text-warning bg-warning-soft px-1.5 py-0.5 rounded">Fasting</span>}
          <span className="text-[10px] text-gray">{test.category.name}</span>
        </div>
        <p className="text-[13px] font-medium text-ink truncate">{test.name}</p>
      </div>
      <span className="font-mono-data text-[13px] font-semibold text-ink flex-shrink-0">{fmtMoney(test.price)}</span>
    </button>
  );
}

