import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default async function DoctorSettingsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const doctor = await db.doctor.findUnique({ where: { userId: session.user.id } });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Field label="Name" value={doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "—"} />
            <Field label="Email" value={session.user.email} />
            <Field label="Specialty" value={doctor?.specialty || "—"} />
            <Field label="License #" value={doctor?.licenseNo || "—"} />
            <Field label="Phone" value={doctor?.phone || "—"} />
            <Field label="Clinic / Hospital" value={doctor?.clinic || "—"} />
            <div className="pt-3 border-t border-border">
              <Button variant="outline" size="sm">Edit Profile</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <ToggleRow label="Email me when results are released" defaultChecked />
            <ToggleRow label="SMS alerts for critical results" defaultChecked />
            <ToggleRow label="Daily summary of pending results" />
            <ToggleRow label="Weekly activity report" defaultChecked />
            <div className="pt-3 border-t border-border">
              <Button size="sm">Save Preferences</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Security</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs text-gray">Last sign-in: <span className="font-mono-data text-ink">just now</span></p>
            <p className="text-xs text-gray">Session: <span className="text-ink">Beirut, Lebanon</span></p>
            <div className="pt-3 border-t border-border space-y-2">
              <Button variant="outline" size="sm">Change Password</Button>
              <Button variant="outline" size="sm" className="w-full">Enable Two-Factor Auth</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Language & Display</CardTitle></CardHeader>
          <CardBody className="space-y-3 text-sm">
            <p className="text-xs text-gray">Use the language toggle in the header to switch between English and Arabic. Your preference is saved per device.</p>
            <p className="text-xs text-gray">Reports are always available in both EN and AR formats.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-[11px] uppercase tracking-wider text-gray font-semibold">{label}</p>
      <p className="text-[13px] text-ink text-right">{value}</p>
    </div>
  );
}

function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-[13px] text-ink-soft">{label}</span>
      <span className="relative inline-flex items-center">
        <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
        <span className="w-10 h-5 bg-gray-light rounded-full peer-checked:bg-teal transition-colors" />
        <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
