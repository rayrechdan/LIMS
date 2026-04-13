import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.firstName !== undefined) data.firstName = body.firstName;
  if (body.lastName !== undefined) data.lastName = body.lastName;
  if (body.email !== undefined) data.email = body.email;
  if (body.role !== undefined) data.role = body.role;
  if (body.department !== undefined) data.department = body.department;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.licenseNo !== undefined) data.licenseNo = body.licenseNo;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);

  const user = await db.user.update({ where: { id }, data });
  await logAudit({
    action: body.password ? "PASSWORD_RESET" : (body.isActive === false ? "DISABLE" : body.isActive === true ? "ENABLE" : "UPDATE"),
    entityType: "USER",
    entityId: id,
    userId: session.user.id,
  });
  return NextResponse.json({ user });
}
