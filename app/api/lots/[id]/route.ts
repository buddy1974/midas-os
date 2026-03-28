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

    if (!body.pipeline_stage || typeof body.pipeline_stage !== "string") {
      return NextResponse.json({ error: "pipeline_stage is required" }, { status: 400 });
    }

    if (!isValidStage(body.pipeline_stage)) {
      return NextResponse.json(
        { error: `Invalid stage. Valid stages: ${VALID_STAGES.join(", ")}` },
        { status: 400 }
      );
    }

    const db = getDb();
    const [updated] = await db
      .update(lots)
      .set({
        pipelineStage: body.pipeline_stage as PipelineStage,
        updatedAt: sql`now()`,
      })
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
