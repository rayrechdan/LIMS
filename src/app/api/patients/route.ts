import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { genMRN } from "@/lib/format";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = req.nextUrl.searchParams.get("q") || "";

  const patients = await db.patient.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { mrn: { contains: q } },
            { phone: { contains: q } },
            { nationalId: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ patients });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const patient = await db.patient.create({
    data: {
      mrn: body.mrn || genMRN(),
      firstName: body.firstName,
      lastName: body.lastName,
      firstNameAr: body.firstNameAr || null,
      lastNameAr: body.lastNameAr || null,
      dateOfBirth: new Date(body.dateOfBirth),
      gender: body.gender,
      nationalId: body.nationalId || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      bloodType: body.bloodType || null,
      allergies: body.allergies || null,
      insuranceName: body.insuranceName || null,
      insuranceNumber: body.insuranceNumber || null,
    },
  });

  await logAudit({
    action: "CREATE",
    entityType: "PATIENT",
    entityId: patient.id,
    userId: session.user.id,
    metadata: { mrn: patient.mrn },
  });

  return NextResponse.json({ patient });
}
