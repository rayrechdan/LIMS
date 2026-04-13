import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { genOrderNumber, genBarcode } from "@/lib/format";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status");
  const orders = await db.testOrder.findMany({
    where: status ? { status } : undefined,
    include: {
      patient: true,
      doctor: true,
      items: { include: { test: { include: { category: true } } } },
      samples: { include: { results: { select: { id: true, status: true } } } },
    },
    orderBy: { orderedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const tests = await db.test.findMany({ where: { id: { in: body.testIds || [] } } });
  const totalPrice = tests.reduce((s, t) => s + t.price, 0);

  const order = await db.testOrder.create({
    data: {
      orderNumber: genOrderNumber(),
      patientId: body.patientId,
      doctorId: body.doctorId || null,
      priority: body.priority || "ROUTINE",
      diagnosis: body.diagnosis || null,
      clinicalNotes: body.clinicalNotes || null,
      totalPrice,
      items: {
        create: tests.map((t) => ({ testId: t.id, price: t.price })),
      },
    },
    include: { items: { include: { test: true } } },
  });

  // Auto-generate samples grouped by specimen type
  const specimenGroups = new Map<string, typeof tests>();
  for (const t of tests) {
    if (!specimenGroups.has(t.specimenType)) specimenGroups.set(t.specimenType, []);
    specimenGroups.get(t.specimenType)!.push(t);
  }

  for (const [specimenType, groupTests] of specimenGroups.entries()) {
    const sample = await db.sample.create({
      data: {
        barcode: genBarcode(),
        orderId: order.id,
        patientId: body.patientId,
        specimenType,
        containerType: groupTests[0].containerType || null,
        collectedById: session.user.id,
      },
    });
    await db.chainOfCustody.create({
      data: { sampleId: sample.id, userId: session.user.id, action: "COLLECTED", location: "Collection Point" },
    });

    // Pre-create pending results for each parameter
    for (const t of groupTests) {
      const params = await db.testParameter.findMany({ where: { testId: t.id } });
      for (const p of params) {
        await db.result.create({
          data: { sampleId: sample.id, parameterId: p.id, status: "PENDING" },
        });
      }
    }
  }

  await logAudit({
    action: "CREATE",
    entityType: "ORDER",
    entityId: order.id,
    userId: session.user.id,
    metadata: { orderNumber: order.orderNumber, tests: tests.length },
  });

  return NextResponse.json({ order });
}
