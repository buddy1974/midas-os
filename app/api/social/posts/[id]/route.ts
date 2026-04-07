import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { socialPosts } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json() as Record<string, unknown>;
    const db = getDb();

    const updateData: Record<string, unknown> = {};
    if (typeof body.status === "string") {
      updateData.status = body.status;
      if (body.status === "posted") {
        updateData.postedAt = new Date();
      }
    }
    if (typeof body.content === "string") updateData.content = body.content;
    if (typeof body.hashtags === "string") updateData.hashtags = body.hashtags;

    const [updated] = await db
      .update(socialPosts)
      .set(updateData)
      .where(eq(socialPosts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/social/posts/[id]]", err);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [deleted] = await db
      .delete(socialPosts)
      .where(eq(socialPosts.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/social/posts/[id]]", err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
