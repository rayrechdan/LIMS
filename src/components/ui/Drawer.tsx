"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const widths = { md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <>
      <div
        onClick={onClose}
        className={cn("fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-200", open ? "opacity-100" : "opacity-0 pointer-events-none")}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-screen w-full bg-surface border-l border-border shadow-xl flex flex-col transition-transform duration-300 ease-out",
          widths[width],
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {(title || description) && (
          <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-3">
            <div className="min-w-0">
              {title && <h2 className="text-base font-semibold text-ink truncate">{title}</h2>}
              {description && <p className="text-xs text-gray mt-0.5">{description}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md text-gray hover:text-ink hover:bg-gray-lighter transition-colors flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="px-6 py-3 border-t border-border bg-gray-lighter/40 flex items-center justify-end gap-2">{footer}</div>
        )}
      </aside>
    </>
  );
}
