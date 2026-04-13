"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "@/lib/language";

const navigation = [
  {
    section: { en: "MAIN", ar: "الرئيسية" },
    items: [
      { name: { en: "Dashboard", ar: "لوحة القيادة" }, href: "/dashboard", icon: "dashboard" },
      { name: { en: "Patients", ar: "المرضى" }, href: "/patients", icon: "user" },
      { name: { en: "Samples", ar: "العينات" }, href: "/samples", icon: "tube" },
      { name: { en: "Tests & Orders", ar: "الفحوصات والطلبات" }, href: "/orders", icon: "clipboard" },
      { name: { en: "Results", ar: "النتائج" }, href: "/results", icon: "flask" },
      { name: { en: "Reports", ar: "التقارير" }, href: "/reports", icon: "file" },
    ],
  },
  {
    section: { en: "PEOPLE & ASSETS", ar: "الأشخاص والأصول" },
    items: [
      { name: { en: "Doctors", ar: "الأطباء" }, href: "/admin/doctors", icon: "doctor" },
      { name: { en: "Staff", ar: "الموظفون" }, href: "/admin/users", icon: "users" },
      { name: { en: "Instruments", ar: "الأجهزة" }, href: "/admin/instruments", icon: "instrument" },
    ],
  },
  {
    section: { en: "OPERATIONS", ar: "العمليات" },
    items: [
      { name: { en: "QC", ar: "ضبط الجودة" }, href: "/qc", icon: "qc" },
      { name: { en: "Billing", ar: "الفواتير" }, href: "/billing", icon: "dollar" },
      { name: { en: "Analytics", ar: "التحليلات" }, href: "/analytics", icon: "chart" },
      { name: { en: "Inventory", ar: "المخزون" }, href: "/inventory", icon: "box" },
      { name: { en: "Audit Trail", ar: "سجل التدقيق" }, href: "/audit-log", icon: "shield" },
    ],
  },
  {
    section: { en: "SYSTEM", ar: "النظام" },
    items: [
      { name: { en: "Settings", ar: "الإعدادات" }, href: "/admin", icon: "gear" },
    ],
  },
];

const icons: Record<string, React.ReactNode> = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>,
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  tube: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2v17.5a3.5 3.5 0 1 1-7 0V2"/><line x1="6" y1="2" x2="16" y2="2"/><line x1="7.5" y1="13" x2="14.5" y2="13"/></svg>,
  clipboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  flask: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>,
  file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/></svg>,
  doctor: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2v6"/><path d="M8 5h6"/><path d="M5 22V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v14"/><path d="M9 22v-6h6v6"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  instrument: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><circle cx="7" cy="9" r="1"/><line x1="11" y1="9" x2="17" y2="9"/></svg>,
  qc: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg>,
  box: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>,
  gear: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

const BRANCHES = [
  { code: "ALL", name: "All Branches" },
  { code: "BRT-CTR", name: "Beirut Central" },
  { code: "JOU-BR", name: "Jounieh Branch" },
  { code: "TRP-BR", name: "Tripoli Branch" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { lang, setLang, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [branch, setBranch] = useState("ALL");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) setBranchOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const allItems = navigation.flatMap((s) => s.items);
  const currentItem = [...allItems].sort((a, b) => b.href.length - a.href.length).find((i) => pathname.startsWith(i.href));
  const pageTitle = currentItem ? t(currentItem.name.en, currentItem.name.ar) : t("Dashboard", "لوحة القيادة");
  const currentBranch = BRANCHES.find((b) => b.code === branch) || BRANCHES[0];

  return (
    <div className="min-h-screen flex bg-base">
      {/* ─── SIDEBAR ─── */}
      <aside className={`sidebar-wrapper fixed top-0 ${lang === "ar" ? "right-0" : "left-0"} h-screen flex flex-col transition-all duration-300 ease-in-out z-40 ${collapsed ? "w-[72px]" : "w-[240px]"}`}>
        <div className="relative flex items-center h-16 px-4 border-b border-white/10">
          {collapsed ? (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/15">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/15">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-white text-sm font-semibold tracking-wide truncate">Klev LIMS</h1>
                <p className="text-white/40 text-[10px] tracking-widest uppercase">{t("Laboratory", "المختبر")}</p>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className={`sidebar-collapse-btn absolute ${lang === "ar" ? "-left-3" : "-right-3"} top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-border shadow-md flex items-center justify-center text-gray hover:text-teal hover:shadow-lg transition-all z-50`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""} ${lang === "ar" ? "rotate-180" : ""}`}>
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navigation.map((section, sIdx) => (
            <div key={section.section.en} className={sIdx > 0 ? "mt-2 pt-2 border-t border-white/8" : ""}>
              {!collapsed && (
                <p className="px-3 mb-1.5 mt-2 text-[10px] font-semibold tracking-[0.15em] text-white/30 uppercase">
                  {t(section.section.en, section.section.ar)}
                </p>
              )}
              {collapsed && sIdx > 0 && <div className="my-2" />}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                        isActive ? "sidebar-nav-active bg-white/15 text-white font-medium" : "text-white/65 hover:bg-white/8 hover:text-white"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <span className="flex-shrink-0">{icons[item.icon]}</span>
                      {!collapsed && <span>{t(item.name.en, item.name.ar)}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* ─── MAIN ─── */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? (lang === "ar" ? "mr-[72px]" : "ml-[72px]") : (lang === "ar" ? "mr-[240px]" : "ml-[240px]")}`}>
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-border flex items-center justify-between px-8">
          <h2 className="text-sm font-semibold text-teal">{pageTitle}</h2>

          <div className="flex items-center gap-3">
            {/* Branch selector */}
            <div className="relative" ref={branchRef}>
              <button
                onClick={() => setBranchOpen(!branchOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-teal/30 transition-colors text-[12px]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><circle cx="12" cy="10" r="1.5" />
                </svg>
                <span className="text-ink-soft font-medium">{currentBranch.name}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              {branchOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  {BRANCHES.map((b) => (
                    <button
                      key={b.code}
                      onClick={() => { setBranch(b.code); setBranchOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[12px] hover:bg-teal-soft transition-colors flex items-center gap-2 ${branch === b.code ? "bg-teal-soft text-teal font-medium" : "text-ink-soft"}`}
                    >
                      {branch === b.code && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      <span className={branch === b.code ? "" : "ml-4"}>{b.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg text-gray hover:text-teal hover:bg-gray-lighter transition-colors">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-critical rounded-full ring-2 ring-white" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-lg shadow-xl border border-border overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-ink">Notifications</h4>
                    <span className="text-[10px] text-gray">3 new</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    <NotifItem icon="alert" tone="critical" text="Critical HGB result for Hadi Sleiman" time="5 min ago" />
                    <NotifItem icon="check" tone="success" text="QC run validated for Sysmex XN-1000" time="12 min ago" />
                    <NotifItem icon="warning" tone="warning" text="Sample LB-XYZ rejected — hemolyzed" time="25 min ago" />
                  </div>
                  <div className="px-4 py-2.5 border-t border-border bg-gray-lighter/40">
                    <Link href="/audit-log" className="text-xs text-teal hover:underline">View all activity →</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Lang toggle */}
            <div className="flex items-center bg-gray-lighter rounded-lg p-0.5">
              <button onClick={() => setLang("en")} className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${lang === "en" ? "bg-surface text-teal shadow-sm" : "text-gray"}`}>EN</button>
              <button onClick={() => setLang("ar")} className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${lang === "ar" ? "bg-surface text-teal shadow-sm" : "text-gray"}`}>AR</button>
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg hover:bg-gray-lighter transition-colors">
                <div className="w-7 h-7 rounded-full bg-teal text-white flex items-center justify-center text-[10px] font-semibold">
                  {session?.user?.firstName?.[0] || "?"}{session?.user?.lastName?.[0] || ""}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-[12px] font-medium text-ink leading-tight">{session?.user?.firstName || ""} {session?.user?.lastName || ""}</p>
                  <p className="text-[10px] text-teal font-semibold uppercase tracking-wider">{session?.user?.role || ""}</p>
                </div>
              </button>
              {userMenuOpen && session && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-lg shadow-xl border border-border overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-ink">{session.user.firstName} {session.user.lastName}</p>
                    <p className="text-xs text-gray">{session.user.email}</p>
                    <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider text-teal bg-teal-soft px-1.5 py-0.5 rounded">{session.user.role}</span>
                  </div>
                  <div className="p-1.5">
                    <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-ink-soft hover:bg-gray-lighter transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/></svg>
                      Settings
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-critical hover:bg-critical-soft transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      {t("Sign out", "تسجيل الخروج")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-6 lg:p-8 animate-fade-in max-w-[1440px] mx-auto">{children}</main>
      </div>
    </div>
  );
}

function NotifItem({ icon, tone, text, time }: { icon: string; tone: "critical" | "warning" | "success"; text: string; time: string }) {
  const tones = {
    critical: "bg-critical-soft text-critical",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
  };
  const icons: Record<string, React.ReactNode> = {
    alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,
    check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    warning: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>,
  };
  return (
    <div className="px-4 py-3 border-b border-border last:border-0 hover:bg-gray-lighter/40 transition-colors flex items-start gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>{icons[icon]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-ink-soft leading-tight">{text}</p>
        <p className="text-[10px] text-gray mt-1">{time}</p>
      </div>
    </div>
  );
}
