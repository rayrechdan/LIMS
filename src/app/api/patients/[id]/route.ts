import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await db.patient.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { test: true } } },
      },
      samples: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ patient });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const patient = await db.patient.update({
    where: { id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      gender: body.gender,
      phone: body.phone,
      email: body.email,
      address: body.address,
      bloodType: body.bloodType,
      allergies: body.allergies,
      insuranceName: body.insuranceName,
      insuranceNumber: body.insuranceNumber,
    },
  });

  await logAudit({ action: "UPDATE", entityType: "PATIENT", entityId: id, userId: session.user.id });
  return NextResponse.json({ patient });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.patient.delete({ where: { id } });
  await logAudit({ action: "DELETE", entityType: "PATIENT", entityId: id, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
