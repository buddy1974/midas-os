import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { socialPosts, lots } from "@/lib/schema";
import { desc, eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const lotId = searchParams.get("lot_id")?.trim() ?? "";

  try {
    const db = getDb();

    const conditions = [];
    if (platform) conditions.push(eq(socialPosts.platform, platform));
    if (status) conditions.push(eq(socialPosts.status, status));
    if (lotId) conditions.push(eq(socialPosts.lotId, lotId));

    const rows = await db
      .select({
        id: socialPosts.id,
        lotId: socialPosts.lotId,
        platform: socialPosts.platform,
        content: socialPosts.content,
        hashtags: socialPosts.hashtags,
        status: socialPosts.status,
        tone: socialPosts.tone,
        generatedAt: socialPosts.generatedAt,
        postedAt: socialPosts.postedAt,
        createdAt: socialPosts.createdAt,
        lotAddress: lots.address,
      })
      .from(socialPosts)
      .leftJoin(lots, eq(socialPosts.lotId, lots.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(socialPosts.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/social/posts]", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const platform = typeof body.platform === "string" ? body.platform : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!platform || !content) {
      return NextResponse.json({ error: "platform and content are required" }, { status: 400 });
    }

    const db = getDb();
    const [inserted] = await db
      .insert(socialPosts)
      .values({
        lotId: typeof body.lot_id === "string" ? body.lot_id : null,
        platform,
        content,
        hashtags: typeof body.hashtags === "string" ? body.hashtags : null,
        tone: typeof body.tone === "string" ? body.tone : "professional",
        status: "draft",
      })
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("[POST /api/social/posts]", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
