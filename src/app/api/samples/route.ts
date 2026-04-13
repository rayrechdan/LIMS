import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { genBarcode } from "@/lib/format";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status");
  const q = req.nextUrl.searchParams.get("q");

  const samples = await db.sample.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { barcode: { contains: q } },
              { patient: { firstName: { contains: q } } },
              { patient: { lastName: { contains: q } } },
              { patient: { mrn: { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      patient: true,
      order: { include: { items: { include: { test: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ samples });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const sample = await db.sample.create({
    data: {
      barcode: body.barcode || genBarcode(),
      orderId: body.orderId,
      patientId: body.patientId,
      specimenType: body.specimenType,
      containerType: body.containerType || null,
      volume: body.volume || null,
      volumeUnit: body.volumeUnit || null,
      collectedById: session.user.id,
      notes: body.notes || null,
    },
  });

  await db.chainOfCustody.create({
    data: {
      sampleId: sample.id,
      userId: session.user.id,
      action: "COLLECTED",
      location: "Collection Point",
    },
  });

  await logAudit({
    action: "CREATE",
    entityType: "SAMPLE",
    entityId: sample.id,
    userId: session.user.id,
    metadata: { barcode: sample.barcode },
  });

  return NextResponse.json({ sample });
}
