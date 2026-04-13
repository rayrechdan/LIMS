"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fmtMoney } from "@/lib/format";

type Test = { id: string; code: string; name: string; price: number };

const BRANCHES: Record<string, { name: string; address: string; phone: string }> = {
  "BRT-CTR": { name: "Beirut Central", address: "Hamra Street, Building 42, Beirut", phone: "+961 1 234 567" },
  "JOU-BR": { name: "Jounieh Branch", address: "Maameltein Highway, Jounieh", phone: "+961 9 555 333" },
  "TRP-BR": { name: "Tripoli Branch", address: "Azmi Street, Tripoli", phone: "+961 6 777 888" },
};

export default function BookConfirmPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [data, setData] = useState<{
    collectionType: "WALKIN" | "HOME";
    branch: string;
    date: string;
    time: string;
    total: number;
    fastingRequired: boolean;
  } | null>(null);
  const [referenceNumber] = useState(() => `APT-${Date.now().toString(36).toUpperCase().slice(-8)}`);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("portal-booking-confirmed") : null;
    if (!saved) {
      router.push("/portal/appointments/book");
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      setData(parsed);
      fetch("/api/tests").then((r) => r.json()).then((d) => {
        const all: Test[] = d.tests || [];
        setTests(all.filter((t) => (parsed.testIds || []).includes(t.id)));
      });
    } catch {}
  }, [router]);

  function startNewBooking() {
    localStorage.removeItem("portal-booking");
    localStorage.removeItem("portal-booking-confirmed");
    router.push("/portal");
  }

  if (!data) return <div className="text-sm text-gray">Loading…</div>;

  const branch = BRANCHES[data.branch];
  const dateObj = new Date(data.date);
  const formattedDate = dateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-start justify-center py-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-soft mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-teal/10 animate-ping" />
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-ink">Appointment Confirmed</h1>
          <p className="text-sm text-gray mt-2">
            We&apos;ve booked your slot. A confirmation has been sent to your email and SMS.
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 bg-teal-soft rounded-full">
            <span className="text-[10px] uppercase tracking-wider text-teal font-semibold">Reference</span>
            <span className="text-[12px] font-mono-data font-bold text-teal">{referenceNumber}</span>
          </div>
        </div>

        {/* Summary card */}
        <Card>
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-teal-mist to-teal-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-teal font-semibold">Booking Details</p>
                <p className="text-base font-semibold text-ink mt-0.5">{formattedDate} at {data.time}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface border border-teal/20 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Tests */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray font-semibold mb-2">Tests Ordered</p>
              <ul className="border border-border rounded-lg divide-y divide-border">
                {tests.map((t) => (
                  <li key={t.id} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="font-mono-data text-[10px] text-teal">{t.code}</p>
                      <p className="text-[13px] text-ink">{t.name}</p>
                    </div>
                    <p className="font-mono-data text-[13px] font-semibold text-ink">{fmtMoney(t.price)}</p>
                  </li>
                ))}
                <li className="flex items-center justify-between px-3 py-2.5 bg-gray-lighter/40">
                  <p className="text-[11px] uppercase tracking-wider text-gray font-semibold">Estimated Total</p>
                  <p className="font-mono-data text-base font-bold text-ink">{fmtMoney(data.total)}</p>
                </li>
              </ul>
            </div>

            {/* Collection details */}
            <div className="grid grid-cols-2 gap-4">
              <DetailBlock
                icon="map"
                label="Collection"
                value={data.collectionType === "HOME" ? "Home Visit" : "Walk-in"}
                sub={data.collectionType === "HOME" ? "At your registered address" : branch?.name}
              />
              <DetailBlock
                icon="clock"
                label="Date & Time"
                value={dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                sub={data.time}
              />
            </div>

            {/* Branch / address */}
            {data.collectionType === "WALKIN" && branch && (
              <div className="border border-border rounded-lg p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-soft text-teal flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/></svg>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-ink">{branch.name}</p>
                  <p className="text-[11px] text-gray">{branch.address}</p>
                  <p className="text-[11px] text-gray font-mono-data mt-0.5">{branch.phone}</p>
                </div>
                <a href="#" className="text-[11px] text-teal font-semibold hover:underline flex-shrink-0">View map →</a>
              </div>
            )}

            {/* Prep instructions */}
            <div className={`rounded-lg p-4 ${data.fastingRequired ? "bg-warning-soft border border-warning/20" : "bg-info-soft border border-info/20"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${data.fastingRequired ? "bg-warning text-white" : "bg-info text-white"}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <div>
                  <p className={`text-[12px] font-semibold ${data.fastingRequired ? "text-warning" : "text-info"}`}>
                    Preparation Instructions
                  </p>
                  <ul className="text-[11px] text-ink-soft mt-1.5 space-y-1 list-disc list-inside">
                    {data.fastingRequired && <li><strong>Fast for at least 8 hours</strong> before your appointment. Water is allowed.</li>}
                    <li>Bring a valid ID and your insurance card if applicable.</li>
                    <li>Arrive 10 minutes early to complete check-in.</li>
                    <li>Wear loose clothing for easy blood draw access.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button variant="outline" className="w-full">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
            Add to Calendar
          </Button>
          <Button variant="outline" className="w-full">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PDF
          </Button>
          <Button onClick={startNewBooking} className="w-full">
            Back to Dashboard
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Button>
        </div>

        <p className="text-center text-[11px] text-gray">
          Need to reschedule or cancel? Visit{" "}
          <Link href="/portal/appointments" className="text-teal font-semibold hover:underline">My Appointments</Link>
          {" "}or contact us at <span className="font-mono-data">+961 1 234 567</span>
        </p>
      </div>
    </div>
  );
}

function DetailBlock({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  const icons: Record<string, React.ReactNode> = {
    map: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  };
  return (
    <div className="border border-border rounded-lg p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-teal-soft text-teal flex items-center justify-center flex-shrink-0">{icons[icon]}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{label}</p>
        <p className="text-[14px] font-semibold text-ink mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-gray font-mono-data">{sub}</p>}
      </div>
    </div>
  );
}
