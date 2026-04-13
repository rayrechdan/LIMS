import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.rejectReason) updates.rejectReason = body.rejectReason;
  if (body.status === "RECEIVED") {
    updates.receivedAt = new Date();
    updates.receivedById = session.user.id;
  }

  const sample = await db.sample.update({ where: { id }, data: updates });

  if (body.status) {
    await db.chainOfCustody.create({
      data: {
        sampleId: id,
        userId: session.user.id,
        action: body.status,
        notes: body.notes || null,
      },
    });
  }

  await logAudit({ action: "UPDATE", entityType: "SAMPLE", entityId: id, userId: session.user.id, metadata: { status: body.status } });
  return NextResponse.json({ sample });
}
