"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tab = { value: string; label: ReactNode; count?: number };

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-1">
        {tabs.map((t) => {
          const isActive = active === t.value;
          return (
            <button
              key={t.value}
              onClick={() => onChange(t.value)}
              className={cn(
                "relative px-4 py-3 text-[13px] font-medium transition-colors",
                isActive ? "text-teal" : "text-gray hover:text-ink"
              )}
            >
              <span className="flex items-center gap-2">
                {t.label}
                {t.count != null && (
                  <span className={cn("inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full font-mono-data", isActive ? "bg-teal text-white" : "bg-gray-lighter text-gray")}>
                    {t.count}
                  </span>
                )}
              </span>
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal rounded-t" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
