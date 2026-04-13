import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

const sections = [
  { href: "/admin/users", title: "Users & Roles", desc: "Manage staff accounts, roles, and permissions", icon: "users" },
  { href: "/admin/tests", title: "Test Catalog", desc: "Configure tests, parameters, and reference ranges", icon: "flask" },
  { href: "/admin/branches", title: "Branches", desc: "Lab locations, hours, and services", icon: "building" },
  { href: "/admin/instruments", title: "Instruments", desc: "Analyzers, calibration, and connectivity", icon: "instrument" },
  { href: "/admin/doctors", title: "Doctors", desc: "Referring physicians directory", icon: "doctor" },
  { href: "/admin/settings", title: "Lab Settings", desc: "Lab name, branding, and preferences", icon: "gear" },
];

const icons: Record<string, React.ReactNode> = {
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  flask: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>,
  building: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M8 10h.01"/></svg>,
  instrument: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><circle cx="7" cy="9" r="1"/><line x1="11" y1="9" x2="17" y2="9"/></svg>,
  doctor: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  gear: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

export default async function AdminPage() {
  const [users, tests, doctors, branches, instruments] = await Promise.all([
    db.user.count(),
    db.test.count(),
    db.doctor.count(),
    db.branch.count(),
    db.instrument.count(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Administration" description="Manage users, catalog, and lab configuration" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="hover:border-teal/30 hover:shadow-card-lg transition-all cursor-pointer">
              <div className="p-6 flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-teal-soft text-teal flex items-center justify-center flex-shrink-0">
                  {icons[s.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-ink">{s.title}</h3>
                  <p className="text-xs text-gray mt-0.5">{s.desc}</p>
                  <p className="text-[11px] text-teal mt-2 font-mono-data">
                    {s.href === "/admin/users" && `${users} users`}
                    {s.href === "/admin/tests" && `${tests} tests`}
                    {s.href === "/admin/branches" && `${branches} branches`}
                    {s.href === "/admin/instruments" && `${instruments} instruments`}
                    {s.href === "/admin/doctors" && `${doctors} doctors`}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
