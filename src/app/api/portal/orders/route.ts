import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await db.patient.findUnique({ where: { userId: session.user.id } });
  if (!patient) return NextResponse.json({ orders: [] });

  const orders = await db.testOrder.findMany({
    where: { patientId: patient.id },
    orderBy: { orderedAt: "desc" },
    include: { items: { include: { test: true } } },
  });
  return NextResponse.json({ orders });
}
