"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { StepWizard } from "@/components/ui/StepWizard";
import { fmtMoney } from "@/lib/format";

type Test = { id: string; code: string; name: string; price: number; specimenType: string };

const BRANCHES = [
  { code: "BRT-CTR", name: "Beirut Central", address: "Hamra Street, Building 42" },
  { code: "JOU-BR", name: "Jounieh Branch", address: "Maameltein Highway" },
  { code: "TRP-BR", name: "Tripoli Branch", address: "Azmi Street" },
];

const TIME_SECTIONS = [
  { key: "morning", label: "Morning", icon: "sunrise", slots: ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] },
  { key: "afternoon", label: "Afternoon", icon: "sun", slots: ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"] },
  { key: "evening", label: "Evening", icon: "moon", slots: ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30"] },
];

// Pseudo-random "unavailable" slots for visual variety
const UNAVAILABLE_SLOTS = new Set(["08:00", "09:30", "13:00", "14:30", "18:00"]);

export default function BookStep2Page() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [collectionType, setCollectionType] = useState<"WALKIN" | "HOME">("WALKIN");
  const [fastingRequired, setFastingRequired] = useState(false);

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [branch, setBranch] = useState(BRANCHES[0].code);

  // Restore selection from step 1
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("portal-booking") : null;
    if (!saved) {
      router.push("/portal/appointments/book");
      return;
    }
    try {
      const data = JSON.parse(saved);
      setCollectionType(data.collectionType || "WALKIN");
      setFastingRequired(!!data.fastingRequired);
      // Fetch tests
      fetch("/api/tests").then((r) => r.json()).then((d) => {
        const all: Test[] = d.tests || [];
        setTests(all.filter((t) => (data.testIds || []).includes(t.id)));
      });
    } catch {}
  }, [router]);

  const subtotal = tests.reduce((s, t) => s + t.price, 0);
  const homeFee = collectionType === "HOME" ? 15 : 0;
  const total = subtotal + homeFee;

  // ─── Calendar generation ───
  const monthName = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDayOfMonth = viewMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function isAvailable(date: Date) {
    if (date < today) return false;
    const day = date.getDay();
    if (day === 0) return false; // Sundays unavailable
    return true;
  }

  function changeMonth(delta: number) {
    const next = new Date(viewMonth);
    next.setMonth(next.getMonth() + delta);
    setViewMonth(next);
  }

  function selectDate(date: Date) {
    if (!isAvailable(date)) return;
    setSelectedDate(date);
    setSelectedTime(null);
  }

  function confirmBooking() {
    if (!selectedDate || !selectedTime) return;
    localStorage.setItem("portal-booking-confirmed", JSON.stringify({
      testIds: tests.map((t) => t.id),
      collectionType,
      branch,
      date: selectedDate.toISOString(),
      time: selectedTime,
      total,
      fastingRequired,
    }));
    router.push("/portal/appointments/book/confirm");
  }

  // Build calendar grid
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/appointments/book" className="text-xs text-gray hover:text-teal">← Back to test selection</Link>
        <PageHeader title="Choose Date & Time" description="Pick a convenient slot for your appointment" />
      </div>

      <StepWizard current={2} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── LEFT: Calendar ─── */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>{monthName}</CardTitle>
                <div className="flex items-center gap-1">
                  <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-md border border-border hover:border-teal/30 text-gray hover:text-teal flex items-center justify-center transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-md border border-border hover:border-teal/30 text-gray hover:text-teal flex items-center justify-center transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {/* Weekday header */}
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-gray py-1">{d}</div>
                ))}
              </div>

              {/* Date grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((date, i) => {
                  if (!date) return <div key={i} />;
                  const available = isAvailable(date);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <button
                      key={i}
                      onClick={() => selectDate(date)}
                      disabled={!available}
                      className={`relative aspect-square rounded-lg text-[13px] font-medium transition-all ${
                        isSelected
                          ? "bg-teal text-white shadow-md ring-2 ring-teal/30"
                          : available
                          ? "bg-teal-soft text-teal hover:bg-teal-mist hover:scale-105"
                          : "bg-gray-lighter/40 text-gray-light cursor-not-allowed line-through"
                      }`}
                    >
                      {date.getDate()}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-around text-[10px] text-gray">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-soft border border-teal/30" />Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal" />Selected</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-lighter" />Unavailable</span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* ─── CENTER: Time slots ─── */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Available Times</CardTitle>
                <p className="text-xs text-gray mt-0.5">
                  {selectedDate
                    ? selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                    : "Select a date first"}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {!selectedDate ? (
                <div className="py-12 text-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-light"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <p className="text-sm text-gray">Pick a date from the calendar</p>
                </div>
              ) : (
                <div className="space-y-5 max-h-[480px] overflow-y-auto">
                  {TIME_SECTIONS.map((section) => (
                    <div key={section.key}>
                      <div className="flex items-center gap-2 mb-2">
                        <SectionIcon icon={section.icon} />
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray">{section.label}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {section.slots.map((slot) => {
                          const unavailable = UNAVAILABLE_SLOTS.has(slot);
                          const isSelected = selectedTime === slot;
                          return (
                            <button
                              key={slot}
                              onClick={() => !unavailable && setSelectedTime(slot)}
                              disabled={unavailable}
                              className={`px-2 py-2 text-[12px] font-mono-data font-semibold rounded-md border transition-all ${
                                isSelected
                                  ? "bg-teal text-white border-teal"
                                  : unavailable
                                  ? "bg-gray-lighter/40 text-gray-light border-border line-through cursor-not-allowed"
                                  : "bg-surface text-ink-soft border-border hover:border-teal/50 hover:bg-teal-soft"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ─── RIGHT: Summary ─── */}
        <div className="lg:col-span-3">
          <Card className="sticky top-20">
            <CardHeader><CardTitle>Booking Summary</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              {/* Branch select if walk-in */}
              {collectionType === "WALKIN" && (
                <div>
                  <label className="block text-[11px] font-medium text-gray mb-1.5">Branch</label>
                  <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                    {BRANCHES.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                  </select>
                  <p className="text-[10px] text-gray mt-1">{BRANCHES.find((b) => b.code === branch)?.address}</p>
                </div>
              )}

              <div className="space-y-2 text-[12px]">
                <SummaryRow label="Tests" value={`${tests.length} selected`} />
                <SummaryRow label="Collection" value={collectionType === "HOME" ? "Home Visit" : "Walk-in"} />
                <SummaryRow label="Date" value={selectedDate ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"} />
                <SummaryRow label="Time" value={selectedTime || "—"} />
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-gray font-semibold">Estimated total</span>
                  <span className="text-xl font-semibold font-mono-data text-ink">{fmtMoney(total)}</span>
                </div>
              </div>

              {fastingRequired && (
                <div className="flex items-start gap-2 p-2.5 bg-warning-soft border border-warning/20 rounded-lg">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                  <p className="text-[10px] text-warning font-medium">Fasting required for 8h before collection</p>
                </div>
              )}

              <Button
                onClick={confirmBooking}
                disabled={!selectedDate || !selectedTime}
                className="w-full"
                size="lg"
              >
                Confirm Booking
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SectionIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    sunrise: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/></svg>,
    sun: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  };
  return icons[icon];
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase tracking-wider text-gray font-semibold">{label}</span>
      <span className="text-[12px] text-ink text-right">{value}</span>
    </div>
  );
}
