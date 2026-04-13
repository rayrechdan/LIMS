"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/lib/language";

const navigation = [
  { name: { en: "Dashboard", ar: "لوحة القيادة" }, href: "/portal", icon: "dashboard" },
  { name: { en: "My Results", ar: "نتائجي" }, href: "/portal/results", icon: "flask" },
  { name: { en: "Health Trends", ar: "الاتجاهات الصحية" }, href: "/portal/trends", icon: "trend" },
  { name: { en: "Appointments", ar: "المواعيد" }, href: "/portal/appointments", icon: "calendar" },
  { name: { en: "Billing", ar: "الفواتير" }, href: "/portal/billing", icon: "dollar" },
  { name: { en: "Profile", ar: "الملف الشخصي" }, href: "/portal/profile", icon: "user" },
  { name: { en: "Privacy", ar: "الخصوصية" }, href: "/portal/privacy", icon: "shield" },
  { name: { en: "Help", ar: "المساعدة" }, href: "/portal/help", icon: "help" },
];

const icons: Record<string, React.ReactNode> = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  flask: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>,
  trend: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>,
  help: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { lang, setLang, t } = useLanguage();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/patient/login");
  }, [status, router]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    if (userMenuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userMenuOpen]);

  const currentItem = [...navigation].sort((a, b) => b.href.length - a.href.length).find((i) => pathname.startsWith(i.href));
  const pageTitle = currentItem ? t(currentItem.name.en, currentItem.name.ar) : t("Dashboard", "لوحة القيادة");

  return (
    <div className="min-h-screen flex bg-base">
      {/* ─── SIDEBAR ─── */}
      <aside className={`sidebar-wrapper fixed top-0 ${lang === "ar" ? "right-0" : "left-0"} h-screen flex flex-col w-[240px] z-40`}>
        <div className="flex items-center h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/15">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-white text-sm font-semibold tracking-wide truncate">Klev LIMS</h1>
              <p className="text-white/40 text-[10px] tracking-widest uppercase">{t("Patient Portal", "بوابة المرضى")}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                    isActive ? "sidebar-nav-active bg-white/15 text-white font-medium" : "text-white/65 hover:bg-white/8 hover:text-white"
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
          <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/8 transition-colors">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-semibold">
                {session?.user?.firstName?.[0] || "?"}{session?.user?.lastName?.[0] || ""}
              </span>
            </div>
            <div className="min-w-0 text-left flex-1">
              <p className="text-white/85 text-[12px] font-medium truncate">{session?.user?.firstName || ""} {session?.user?.lastName || ""}</p>
              <p className="text-white/35 text-[10px]">{t("Patient", "مريض")}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-white/30 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          {userMenuOpen && session && (
            <div className="absolute bottom-full mb-2 left-3 right-3 bg-surface rounded-lg shadow-xl border border-border overflow-hidden animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-ink">{session.user.firstName} {session.user.lastName}</p>
                <p className="text-xs text-gray">{session.user.email}</p>
              </div>
              <div className="p-1.5">
                <Link href="/portal/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-ink-soft hover:bg-gray-lighter transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
                  {t("Profile", "الملف الشخصي")}
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/auth/patient/login" })} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-critical hover:bg-critical-soft transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  {t("Sign out", "تسجيل الخروج")}
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <div className={`flex-1 ${lang === "ar" ? "mr-[240px]" : "ml-[240px]"}`}>
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-border flex items-center justify-between px-8">
          <h2 className="text-sm font-semibold text-teal">{pageTitle}</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-lighter rounded-lg p-0.5">
              <button onClick={() => setLang("en")} className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${lang === "en" ? "bg-surface text-teal shadow-sm" : "text-gray"}`}>EN</button>
              <button onClick={() => setLang("ar")} className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${lang === "ar" ? "bg-surface text-teal shadow-sm" : "text-gray"}`}>AR</button>
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
