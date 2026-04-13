import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Bulk-replace reference ranges for a test's parameters
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: testId } = await params;
  const body = await req.json();
  // body: { parameters: [{ parameterId, ranges: [{ gender, ageMin, ageMax, low, high, text }] }] }

  const params2 = await db.testParameter.findMany({ where: { testId } });
  const validIds = new Set(params2.map((p) => p.id));

  for (const p of body.parameters || []) {
    if (!validIds.has(p.parameterId)) continue;
    await db.referenceRange.deleteMany({ where: { parameterId: p.parameterId } });
    if (p.ranges?.length) {
      await db.referenceRange.createMany({
        data: p.ranges.map((r: { gender: string; ageMin: number; ageMax: number; low: number | null; high: number | null; text: string | null }) => ({
          parameterId: p.parameterId,
          gender: r.gender,
          ageMin: r.ageMin,
          ageMax: r.ageMax,
          low: r.low,
          high: r.high,
          text: r.text || null,
        })),
      });
    }
  }

  await logAudit({ action: "UPDATE_RANGES", entityType: "TEST", entityId: testId, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
