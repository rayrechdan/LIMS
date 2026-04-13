import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const tests = await db.test.findMany({
    where: { isActive: true },
    include: { category: true, parameters: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ category: { sortOrder: "asc" } }, { code: "asc" }],
  });
  return NextResponse.json({ tests });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const test = await db.test.create({
    data: {
      code: body.code,
      name: body.name,
      nameAr: body.nameAr || null,
      description: body.description || null,
      categoryId: body.categoryId,
      specimenType: body.specimenType,
      containerType: body.containerType || null,
      price: parseFloat(body.price) || 0,
      turnaroundHours: parseInt(body.turnaroundHours) || 24,
      method: body.method || null,
      parameters: {
        create: (body.parameters || []).map((p: { code: string; name: string; unit?: string; refRangeLow?: number; refRangeHigh?: number; refRangeText?: string }, i: number) => ({
          code: p.code,
          name: p.name,
          unit: p.unit || null,
          refRangeLow: p.refRangeLow ?? null,
          refRangeHigh: p.refRangeHigh ?? null,
          refRangeText: p.refRangeText || null,
          sortOrder: i,
        })),
      },
    },
  });

  await logAudit({ action: "CREATE", entityType: "TEST", entityId: test.id, userId: session.user.id });
  return NextResponse.json({ test });
}
