import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { privateLenders, lenderDeals } from "@/lib/schema";
import { eq, and, notInArray } from "drizzle-orm";

const ACTIVE_STATUSES = ["enquiry", "terms_issued", "in_progress"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [lender] = await db
      .select()
      .from(privateLenders)
      .where(eq(privateLenders.id, id))
      .limit(1);

    if (!lender) {
      return NextResponse.json({ error: "Lender not found" }, { status: 404 });
    }

    const deals = await db
      .select()
      .from(lenderDeals)
      .where(eq(lenderDeals.lenderId, id));

    return NextResponse.json({ ...lender, deals });
  } catch (err) {
    console.error("[GET /api/lenders/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch lender" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json() as Record<string, unknown>;
    const db = getDb();

    const updateData: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name) updateData.name = body.name.trim();
    if (typeof body.email === "string") updateData.email = body.email.trim() || null;
    if (typeof body.phone === "string") updateData.phone = body.phone.trim() || null;
    if (typeof body.company === "string") updateData.company = body.company.trim() || null;
    if (typeof body.lender_type === "string") updateData.lenderType = body.lender_type;
    if (typeof body.max_loan_pence === "number") updateData.maxLoanPence = body.max_loan_pence;
    if (typeof body.min_loan_pence === "number") updateData.minLoanPence = body.min_loan_pence;
    if (typeof body.max_ltv === "number") updateData.maxLtv = body.max_ltv;
    if (typeof body.monthly_rate === "number") updateData.monthlyRate = String(body.monthly_rate);
    if (typeof body.charge_types === "string") updateData.chargeTypes = body.charge_types.trim() || null;
    if (typeof body.specialisms === "string") updateData.specialisms = body.specialisms.trim() || null;
    if (typeof body.status === "string") updateData.status = body.status;
    if (typeof body.notes === "string") updateData.notes = body.notes.trim() || null;
    if (typeof body.total_deals === "number") updateData.totalDeals = body.total_deals;
    if (body.last_deal_date instanceof Date) updateData.lastDealDate = body.last_deal_date;

    const [updated] = await db
      .update(privateLenders)
      .set(updateData)
      .where(eq(privateLenders.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Lender not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/lenders/[id]]", err);
    return NextResponse.json({ error: "Failed to update lender" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [activeDeals] = await db
      .select({ id: lenderDeals.id })
      .from(lenderDeals)
      .where(
        and(
          eq(lenderDeals.lenderId, id),
          notInArray(lenderDeals.status, ["completed", "declined", "withdrawn"])
        )
      )
      .limit(1);

    if (activeDeals) {
      return NextResponse.json(
        { error: "Cannot delete lender with active deals" },
        { status: 400 }
      );
    }

    await db.delete(privateLenders).where(eq(privateLenders.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/lenders/[id]]", err);
    return NextResponse.json({ error: "Failed to delete lender" }, { status: 500 });
  }
}
