import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await db.patient.findUnique({
    where: { userId: session.user.id },
    include: {
      orders: {
        orderBy: { orderedAt: "desc" },
        include: {
          doctor: true,
          samples: {
            include: {
              results: {
                include: { parameter: { include: { test: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!patient) return NextResponse.json({ rows: [] });

  // Build a row per result
  const rows = patient.orders.flatMap((o) =>
    o.samples.flatMap((s) =>
      s.results.map((r) => {
        let status: "NORMAL" | "ABNORMAL" | "CRITICAL" | "PENDING" = "PENDING";
        if (r.status === "VALIDATED") {
          if (r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH") status = "CRITICAL";
          else if (r.flag && r.flag !== "NORMAL") status = "ABNORMAL";
          else status = "NORMAL";
        }
        return {
          id: r.id,
          testCode: r.parameter.test.code,
          testName: r.parameter.test.name,
          doctor: o.doctor ? `Dr. ${o.doctor.firstName} ${o.doctor.lastName}` : "—",
          sampleDate: s.collectedAt,
          resultDate: r.validatedAt,
          status,
          orderNumber: o.orderNumber,
        };
      })
    )
  );

  return NextResponse.json({ rows });
}
