import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const instruments = await db.instrument.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      events: { orderBy: { timestamp: "desc" }, take: 8 },
      _count: { select: { qcRuns: true } },
    },
  });

  // Augment each with today's QC run count
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const enriched = await Promise.all(
    instruments.map(async (i) => {
      const todayRuns = await db.qCRun.count({ where: { instrumentId: i.id, runAt: { gte: today } } });
      return { ...i, todayRuns };
    })
  );
  return NextResponse.json({ instruments: enriched });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const instrument = await db.instrument.create({
    data: {
      name: body.name,
      model: body.model || null,
      manufacturer: body.manufacturer || null,
      serialNumber: body.serialNumber,
      category: body.category || "GENERAL",
      status: body.status || "ONLINE",
      location: body.location || null,
      ipAddress: body.ipAddress || null,
      installedAt: body.installedAt ? new Date(body.installedAt) : null,
      warrantyUntil: body.warrantyUntil ? new Date(body.warrantyUntil) : null,
      testCodes: body.testCodes || null,
      notes: body.notes || null,
    },
  });
  await logAudit({ action: "CREATE", entityType: "INSTRUMENT", entityId: instrument.id, userId: session.user.id });
  return NextResponse.json({ instrument });
}
