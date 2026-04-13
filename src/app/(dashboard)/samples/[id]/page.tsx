import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { AutoStatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime, calcAge } from "@/lib/format";

export default async function SampleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = await db.sample.findUnique({
    where: { id },
    include: {
      patient: true,
      order: { include: { items: { include: { test: true } }, doctor: true } },
      collectedBy: true,
      receivedBy: true,
      custody: { include: { user: true }, orderBy: { timestamp: "desc" } },
      results: { include: { parameter: { include: { test: true } } } },
    },
  });
  if (!sample) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/samples" className="text-xs text-gray hover:text-teal">← Back to samples</Link>
        <div className="flex items-end justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-ink font-mono-data">{sample.barcode}</h1>
            <p className="text-sm text-gray mt-1">{sample.specimenType} sample · Order {sample.order.orderNumber}</p>
          </div>
          <AutoStatusBadge status={sample.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Patient</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p className="font-semibold text-ink">{sample.patient.firstName} {sample.patient.lastName}</p>
            <p className="text-xs text-gray font-mono-data">{sample.patient.mrn} · {calcAge(sample.patient.dateOfBirth)}y · {sample.patient.gender}</p>
            <Link href={`/patients/${sample.patient.id}`} className="inline-block text-xs text-teal hover:underline">View patient →</Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Specimen</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Type" value={sample.specimenType} />
            <Row label="Container" value={sample.containerType || "—"} />
            <Row label="Volume" value={sample.volume ? `${sample.volume} ${sample.volumeUnit || ""}` : "—"} />
            <Row label="Collected" value={fmtDateTime(sample.collectedAt)} />
            <Row label="By" value={sample.collectedBy ? `${sample.collectedBy.firstName} ${sample.collectedBy.lastName}` : "—"} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Order</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Order #" value={<span className="font-mono-data text-teal">{sample.order.orderNumber}</span>} />
            <Row label="Doctor" value={sample.order.doctor ? `Dr. ${sample.order.doctor.firstName} ${sample.order.doctor.lastName}` : "—"} />
            <Row label="Priority" value={<AutoStatusBadge status={sample.order.priority} />} />
            <Row label="Tests" value={sample.order.items.map((i) => i.test.code).join(", ")} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Results</CardTitle></CardHeader>
        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Parameter</th>
                <th>Value</th>
                <th>Unit</th>
                <th>Reference</th>
                <th>Flag</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sample.results.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray">No results yet</td></tr>
              ) : sample.results.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono-data text-[11px] text-gray">{r.parameter.test.code}</td>
                  <td className="font-medium">{r.parameter.name}</td>
                  <td className="font-mono-data text-ink">{r.valueNumeric ?? r.valueText ?? "—"}</td>
                  <td className="text-gray text-[12px]">{r.parameter.unit || "—"}</td>
                  <td className="text-gray text-[12px] font-mono-data">{r.parameter.refRangeLow != null ? `${r.parameter.refRangeLow}–${r.parameter.refRangeHigh}` : r.parameter.refRangeText || "—"}</td>
                  <td>{r.flag ? <AutoStatusBadge status={r.flag} /> : "—"}</td>
                  <td><AutoStatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Chain of Custody</CardTitle></CardHeader>
        <CardBody>
          <ol className="relative border-l-2 border-border ml-2 space-y-4">
            {sample.custody.map((c) => (
              <li key={c.id} className="ml-5">
                <span className="absolute -left-2 w-3 h-3 rounded-full bg-teal border-2 border-surface" />
                <div className="bg-gray-lighter/50 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{c.action}</p>
                    <span className="text-[11px] text-gray font-mono-data">{fmtDateTime(c.timestamp)}</span>
                  </div>
                  <p className="text-xs text-gray mt-1">
                    {c.user.firstName} {c.user.lastName}
                    {c.location && ` · ${c.location}`}
                  </p>
                  {c.notes && <p className="text-xs text-ink-soft mt-1">{c.notes}</p>}
                </div>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-gray">{label}</dt>
      <dd className="text-[13px] text-ink text-right">{value}</dd>
    </div>
  );
}
