"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "@/lib/language";

const navigation = [
  { name: { en: "Dashboard", ar: "لوحة القيادة" }, href: "/doctor", icon: "dashboard" },
  { name: { en: "My Patients", ar: "مرضاي" }, href: "/doctor/patients", icon: "users" },
  { name: { en: "Pending Results", ar: "النتائج المعلقة" }, href: "/doctor/pending", icon: "clock" },
  { name: { en: "Reports", ar: "التقارير" }, href: "/doctor/reports", icon: "file" },
  { name: { en: "Settings", ar: "الإعدادات" }, href: "/doctor/settings", icon: "gear" },
];

const icons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  file: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  gear: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { lang, setLang, t } = useLanguage();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    if (userMenuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userMenuOpen]);

  const currentItem = [...navigation].reverse().find((i) => pathname.startsWith(i.href));
  const pageTitle = currentItem ? t(currentItem.name.en, currentItem.name.ar) : "Dashboard";

  return (
    <div className="min-h-screen flex bg-base">
      {/* ─── SIDEBAR ─── */}
      <aside className="sidebar-wrapper fixed top-0 left-0 h-screen flex flex-col w-[240px] z-40">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/15">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-white text-sm font-semibold tracking-wide truncate">Klev LIMS</h1>
              <p className="text-white/40 text-[10px] tracking-widest uppercase">{t("Doctor Portal", "بوابة الأطباء")}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = item.href === "/doctor"
                ? pathname === "/doctor"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                    isActive
                      ? "sidebar-nav-active bg-white/15 text-white font-medium"
                      : "text-white/65 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span className="flex-shrink-0">{icons[item.icon]}</span>
                  <span>{t(item.name.en, item.name.ar)}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User card */}
        <div className="border-t border-white/10 p-3 relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/8 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-semibold">
                {session?.user?.firstName?.[0] || "?"}{session?.user?.lastName?.[0] || ""}
              </span>
            </div>
            <div className="min-w-0 text-left flex-1">
              <p className="text-white/85 text-[12px] font-medium truncate">Dr. {session?.user?.firstName || ""} {session?.user?.lastName || ""}</p>
              <p className="text-white/35 text-[10px]">Referring Physician</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-white/30 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {userMenuOpen && session && (
            <div className="absolute bottom-full mb-2 left-3 right-3 bg-surface rounded-lg shadow-xl border border-border overflow-hidden animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-ink">Dr. {session.user.firstName} {session.user.lastName}</p>
                <p className="text-xs text-gray">{session.user.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-critical hover:bg-critical-soft transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  {t("Sign out", "تسجيل الخروج")}
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <div className="flex-1 ml-[240px]">
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-border flex items-center justify-between px-8">
          <h2 className="text-sm font-semibold text-teal">{pageTitle}</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-lighter rounded-lg p-0.5">
              <button onClick={() => setLang("en")} className={`px-2.5 py-1 text-[11px] font-medium rounded-md ${lang === "en" ? "bg-surface text-teal shadow-sm" : "text-gray"}`}>EN</button>
              <button onClick={() => setLang("ar")} className={`px-2.5 py-1 text-[11px] font-medium rounded-md ${lang === "ar" ? "bg-surface text-teal shadow-sm" : "text-gray"}`}>AR</button>
            </div>
            <div className="text-[11px] text-gray font-mono-data">
              {new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
        </header>
        <main className="p-6 lg:p-8 animate-fade-in max-w-[1440px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
