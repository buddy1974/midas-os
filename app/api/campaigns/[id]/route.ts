import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { campaigns } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [campaign] = await db
      .select({ status: campaigns.status })
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    if (campaign.status === "sent") {
      return NextResponse.json(
        { error: "Cannot delete a sent campaign" },
        { status: 400 }
      );
    }

    await db.delete(campaigns).where(eq(campaigns.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/campaigns/[id]]", err);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
