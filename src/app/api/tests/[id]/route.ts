import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const test = await db.test.findUnique({
    where: { id },
    include: {
      category: true,
      parameters: { include: { ranges: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ test });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.code !== undefined) data.code = body.code;
  if (body.name !== undefined) data.name = body.name;
  if (body.nameAr !== undefined) data.nameAr = body.nameAr;
  if (body.description !== undefined) data.description = body.description;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId;
  if (body.specimenType !== undefined) data.specimenType = body.specimenType;
  if (body.containerType !== undefined) data.containerType = body.containerType;
  if (body.price !== undefined) data.price = parseFloat(body.price);
  if (body.turnaroundHours !== undefined) data.turnaroundHours = parseInt(body.turnaroundHours);
  if (body.method !== undefined) data.method = body.method;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const test = await db.test.update({ where: { id }, data });
  await logAudit({ action: "UPDATE", entityType: "TEST", entityId: id, userId: session.user.id });
  return NextResponse.json({ test });
}
