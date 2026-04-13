import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const branch = await db.branch.update({
    where: { id },
    data: {
      name: body.name,
      nameAr: body.nameAr,
      address: body.address,
      city: body.city,
      phone: body.phone,
      email: body.email,
      managerName: body.managerName,
      managerPhone: body.managerPhone,
      isActive: body.isActive,
      homeCollection: body.homeCollection,
      collectionZone: body.collectionZone,
      services: body.services,
      hours: body.hours,
    },
  });
  await logAudit({ action: "UPDATE", entityType: "BRANCH", entityId: id, userId: session.user.id });
  return NextResponse.json({ branch });
}
