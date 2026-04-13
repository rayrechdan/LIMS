import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function calcFlag(value: number | null, low: number | null, high: number | null) {
  if (value == null || (low == null && high == null)) return null;
  if (low != null && value < low * 0.5) return "CRITICAL_LOW";
  if (high != null && value > high * 1.5) return "CRITICAL_HIGH";
  if (low != null && value < low) return "LOW";
  if (high != null && value > high) return "HIGH";
  return "NORMAL";
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const sampleId = req.nextUrl.searchParams.get("sampleId");

  const results = await db.result.findMany({
    where: { ...(status ? { status } : {}), ...(sampleId ? { sampleId } : {}) },
    include: {
      sample: { include: { patient: true, order: true } },
      parameter: { include: { test: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ results });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { resultId, valueNumeric, valueText, comment, action } = body;

  const existing = await db.result.findUnique({ where: { id: resultId }, include: { parameter: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "validate") {
    const r = await db.result.update({
      where: { id: resultId },
      data: { status: "VALIDATED", validatedById: session.user.id, validatedAt: new Date() },
    });
    await logAudit({ action: "VALIDATE", entityType: "RESULT", entityId: resultId, userId: session.user.id });
    return NextResponse.json({ result: r });
  }

  const flag = calcFlag(valueNumeric, existing.parameter.refRangeLow, existing.parameter.refRangeHigh);
  const r = await db.result.update({
    where: { id: resultId },
    data: {
      valueNumeric: valueNumeric ?? null,
      valueText: valueText ?? null,
      flag,
      comment: comment || null,
      status: "ENTERED",
      enteredById: session.user.id,
      enteredAt: new Date(),
    },
  });
  await logAudit({ action: "ENTER_RESULT", entityType: "RESULT", entityId: resultId, userId: session.user.id });
  return NextResponse.json({ result: r });
}
