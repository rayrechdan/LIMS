import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/lib/format";

export default async function AuditLogPage() {
  const logs = await db.auditLog.findMany({
    take: 200,
    orderBy: { timestamp: "desc" },
    include: { user: true },
  });

  function tone(action: string) {
    if (action === "DELETE") return "critical" as const;
    if (action === "CREATE") return "success" as const;
    if (action === "UPDATE") return "info" as const;
    if (action === "VALIDATE") return "teal" as const;
    return "neutral" as const;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Trail" description="Immutable log of all system activity" />
      <Card>
        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray">No activity yet</td></tr>
              ) : logs.map((l) => {
                let meta: Record<string, unknown> = {};
                try { meta = l.metadata ? JSON.parse(l.metadata) : {}; } catch {}
                return (
                  <tr key={l.id}>
                    <td className="font-mono-data text-[11px] text-gray">{fmtDateTime(l.timestamp)}</td>
                    <td>{l.user.firstName} {l.user.lastName} <span className="text-gray text-[11px]">({l.user.role})</span></td>
                    <td><StatusBadge tone={tone(l.action)}>{l.action}</StatusBadge></td>
                    <td className="text-gray text-[12px]">{l.entityType}</td>
                    <td className="font-mono-data text-[11px] text-gray">{l.entityId?.slice(0, 8) || "—"}</td>
                    <td className="text-[11px] text-gray font-mono-data truncate max-w-sm">{Object.entries(meta).map(([k, v]) => `${k}=${v}`).join(" ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
