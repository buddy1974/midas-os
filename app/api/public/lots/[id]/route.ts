import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { lots } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [lot] = await db
      .select({
        id: lots.id,
        address: lots.address,
        guidePrice: lots.guidePrice,
        propertyType: lots.propertyType,
        bedrooms: lots.bedrooms,
        pipelineStage: lots.pipelineStage,
      })
      .from(lots)
      .where(eq(lots.id, id))
      .limit(1);

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }
    return NextResponse.json(lot);
  } catch (err) {
    console.error("[GET /api/public/lots/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch lot" }, { status: 500 });
  }
}
