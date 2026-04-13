import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const passwordHash = await bcrypt.hash(body.password || "changeme123", 10);
  const user = await db.user.create({
    data: {
      email: body.email,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role || "TECHNICIAN",
      department: body.department || null,
      phone: body.phone || null,
      licenseNo: body.licenseNo || null,
    },
  });
  await logAudit({ action: "CREATE", entityType: "USER", entityId: user.id, userId: session.user.id, metadata: { email: user.email, role: user.role } });
  return NextResponse.json({ user });
}
