import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { lots } from "@/lib/schema";
import type { NewLot } from "@/lib/schema";
import { desc } from "drizzle-orm";

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

export async function GET() {
  try {
    const db = getDb();
    const allLots = await db.select().from(lots).orderBy(desc(lots.createdAt));
    return NextResponse.json(allLots);
  } catch (err) {
    console.error("[GET /api/lots]", err);
    return NextResponse.json({ error: "Failed to fetch lots" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const address = typeof body.address === "string" ? body.address.trim() : "";
    const guidePrice = typeof body.guide_price === "number" ? body.guide_price : null;
    const propertyType = typeof body.property_type === "string" ? body.property_type : null;
    const pipelineStage =
      typeof body.pipeline_stage === "string" && isValidStage(body.pipeline_stage)
        ? body.pipeline_stage
        : "sourcing";

    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }
    if (guidePrice === null || guidePrice <= 0) {
      return NextResponse.json({ error: "guide_price must be a positive number" }, { status: 400 });
    }

    const newLot: NewLot = {
      address,
      guidePrice,
      propertyType,
      pipelineStage,
      bedrooms: typeof body.bedrooms === "number" ? body.bedrooms : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      coverImage: typeof body.cover_image === "string" ? body.cover_image || null : null,
      images: Array.isArray(body.images) ? JSON.stringify(body.images) : "[]",
    };

    const db = getDb();
    const [inserted] = await db.insert(lots).values(newLot).returning();
    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("[POST /api/lots]", err);
    return NextResponse.json({ error: "Failed to create lot" }, { status: 500 });
  }
}
