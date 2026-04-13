import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const items = await db.inventoryItem.findMany({
    include: { lots: { orderBy: { expiryDate: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const item = await db.inventoryItem.create({
    data: {
      sku: body.sku,
      name: body.name,
      category: body.category,
      unit: body.unit,
      minStock: parseFloat(body.minStock) || 0,
      currentStock: parseFloat(body.currentStock) || 0,
      supplier: body.supplier || null,
    },
  });
  await logAudit({ action: "CREATE", entityType: "INVENTORY_ITEM", entityId: item.id, userId: session.user.id });
  return NextResponse.json({ item });
}
