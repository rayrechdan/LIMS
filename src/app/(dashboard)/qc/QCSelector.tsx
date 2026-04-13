"use client";

import { useRouter } from "next/navigation";

export function QCSelector({
  analyte,
  level,
  analytes,
  levels,
}: {
  analyte: string;
  level: string;
  analytes: { value: string; label: string }[];
  levels: string[];
}) {
  const router = useRouter();

  function update(next: { analyte?: string; level?: string }) {
    const params = new URLSearchParams();
    params.set("analyte", next.analyte ?? analyte);
    params.set("level", next.level ?? level);
    router.push(`/qc?${params.toString()}`);
  }

  return (
    <>
      <Pill value={analyte} onChange={(v) => update({ analyte: v })} options={analytes} />
      <Pill value={level} onChange={(v) => update({ level: v })} options={levels.map((l) => ({ value: l, label: l }))} />
    </>
  );
}

function Pill({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pr-8 pl-3 py-1.5 text-[12px] font-medium rounded-md border border-border bg-surface text-ink-soft hover:border-teal/30 cursor-pointer focus:outline-none focus:border-teal-light max-w-[220px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
