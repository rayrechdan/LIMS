import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function SettingsAdminPage() {
  const settings = await db.labSettings.findFirst();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-xs text-gray hover:text-teal">← Back to admin</Link>
        <PageHeader title="Lab Settings" description="Lab branding and operational preferences" />
      </div>
      <Card>
        <CardHeader><CardTitle>Lab Information</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 text-sm">
          <Row label="Lab Name" value={settings?.labName || "—"} />
          <Row label="Lab Name (AR)" value={settings?.labNameAr || "—"} />
          <Row label="License #" value={settings?.licenseNumber || "—"} />
          <Row label="Phone" value={settings?.phone || "—"} />
          <Row label="Email" value={settings?.email || "—"} />
          <Row label="Timezone" value={settings?.defaultTimezone || "—"} />
          <div className="col-span-2"><Row label="Address" value={settings?.address || "—"} /></div>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-gray font-semibold">{label}</p>
      <p className="text-sm text-ink mt-1">{value}</p>
    </div>
  );
}
