import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { startOfMonth } from "date-fns";

export async function GET() {
  const doctors = await db.doctor.findMany({
    orderBy: { lastName: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  const monthStart = startOfMonth(new Date());
  const enriched = await Promise.all(
    doctors.map(async (d) => {
      const thisMonth = await db.testOrder.count({
        where: { doctorId: d.id, orderedAt: { gte: monthStart } },
      });
      return { ...d, totalReferrals: d._count.orders, thisMonth };
    })
  );
  return NextResponse.json({ doctors: enriched });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const doctor = await db.doctor.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      specialty: body.specialty || null,
      licenseNo: body.licenseNo || null,
      phone: body.phone || null,
      email: body.email || null,
      clinic: body.clinic || null,
    },
  });
  await logAudit({ action: "CREATE", entityType: "DOCTOR", entityId: doctor.id, userId: session.user.id });
  return NextResponse.json({ doctor });
}
