import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { lots } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const VALID_STAGES = [
  "sourcing",
  "legal_pack",
  "live",
  "completed",
  "unsold",
] as const;

type PipelineStage = (typeof VALID_STAGES)[number];

function isValidStage(stage: string): stage is PipelineStage {
  return (VALID_STAGES as readonly string[]).includes(stage);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;

    if (body.pipeline_stage !== undefined) {
      if (typeof body.pipeline_stage !== "string" || !isValidStage(body.pipeline_stage)) {
        return NextResponse.json(
          { error: `Invalid stage. Valid stages: ${VALID_STAGES.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const db = getDb();
    const updateData: Record<string, unknown> = { updatedAt: sql`now()` };
    if (typeof body.pipeline_stage === "string") updateData.pipelineStage = body.pipeline_stage as PipelineStage;
    if (typeof body.cover_image === "string") updateData.coverImage = body.cover_image || null;
    if (Array.isArray(body.images)) updateData.images = JSON.stringify(body.images);

    const [updated] = await db
      .update(lots)
      .set(updateData)
      .where(eq(lots.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/lots/[id]]", err);
    return NextResponse.json({ error: "Failed to update lot" }, { status: 500 });
  }
}
