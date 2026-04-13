"use client";

export function StepWizard({ current, steps }: { current: number; steps?: { n: number; label: string }[] }) {
  const items = steps || [
    { n: 1, label: "Test Selection" },
    { n: 2, label: "Date & Time" },
    { n: 3, label: "Confirmation" },
  ];
  return (
    <div className="bg-surface rounded-lg border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
      <div className="flex items-center gap-2">
        {items.map((s, i) => {
          const isActive = s.n === current;
          const isDone = s.n < current;
          return (
            <div key={s.n} className="flex items-center flex-1">
              <div className={`flex items-center gap-3 ${i < items.length - 1 ? "flex-1" : ""}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition-colors ${
                  isActive ? "bg-teal text-white ring-4 ring-teal/15" : isDone ? "bg-teal text-white" : "bg-gray-lighter text-gray"
                }`}>
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : s.n}
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">Step {s.n}</p>
                  <p className={`text-[13px] font-semibold ${isActive ? "text-teal" : isDone ? "text-ink-soft" : "text-gray"}`}>{s.label}</p>
                </div>
                {i < items.length - 1 && <div className={`flex-1 h-0.5 mx-3 rounded ${isDone ? "bg-teal" : "bg-gray-lighter"}`} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
