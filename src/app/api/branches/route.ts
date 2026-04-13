import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const branches = await db.branch.findMany({ orderBy: [{ isMain: "desc" }, { name: "asc" }] });
  // Augment with counts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const enriched = await Promise.all(
    branches.map(async (b) => {
      const [staffCount, todaySamples] = await Promise.all([
        db.user.count({ where: { department: b.name, isActive: true } }),
        db.sample.count({ where: { collectedAt: { gte: today } } }), // global for now
      ]);
      return { ...b, staffCount, todaySamples: Math.floor(todaySamples / branches.length) };
    })
  );
  return NextResponse.json({ branches: enriched });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const branch = await db.branch.create({
    data: {
      code: body.code,
      name: body.name,
      nameAr: body.nameAr || null,
      address: body.address || null,
      city: body.city || null,
      phone: body.phone || null,
      email: body.email || null,
      managerName: body.managerName || null,
      managerPhone: body.managerPhone || null,
      isActive: body.isActive ?? true,
      homeCollection: body.homeCollection ?? false,
      collectionZone: body.collectionZone || null,
      services: body.services || null,
      hours: body.hours || null,
    },
  });
  await logAudit({ action: "CREATE", entityType: "BRANCH", entityId: branch.id, userId: session.user.id });
  return NextResponse.json({ branch });
}
