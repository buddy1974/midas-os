import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { portfolioProperties } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; propId: string }> }
) {
  const { id, propId } = await params;
  try {
    const body = await req.json() as Record<string, unknown>;
    const db = getDb();

    const updateData: Record<string, unknown> = {};
    if (typeof body.address === "string" && body.address) updateData.address = body.address.trim();
    if (typeof body.property_type === "string") updateData.propertyType = body.property_type.trim() || null;
    if (typeof body.purchase_price_pence === "number") updateData.purchasePricePence = body.purchase_price_pence;
    if (typeof body.current_value_pence === "number") updateData.currentValuePence = body.current_value_pence;
    if (typeof body.outstanding_mortgage_pence === "number") updateData.outstandingMortgagePence = body.outstanding_mortgage_pence;
    if (typeof body.monthly_rent_pence === "number") updateData.monthlyRentPence = body.monthly_rent_pence;
    if (typeof body.monthly_mortgage_pence === "number") updateData.monthlyMortgagePence = body.monthly_mortgage_pence;
    if (typeof body.monthly_costs_pence === "number") updateData.monthlyCostsPence = body.monthly_costs_pence;
    if (typeof body.bedrooms === "number") updateData.bedrooms = body.bedrooms;
    if (typeof body.notes === "string") updateData.notes = body.notes.trim() || null;
    if (typeof body.purchase_date === "string" && body.purchase_date) updateData.purchaseDate = new Date(body.purchase_date);

    const [updated] = await db
      .update(portfolioProperties)
      .set(updateData)
      .where(and(eq(portfolioProperties.id, propId), eq(portfolioProperties.portfolioId, id)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/portfolios/[id]/properties/[propId]]", err);
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; propId: string }> }
) {
  const { id, propId } = await params;
  try {
    const db = getDb();
    await db
      .delete(portfolioProperties)
      .where(and(eq(portfolioProperties.id, propId), eq(portfolioProperties.portfolioId, id)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/portfolios/[id]/properties/[propId]]", err);
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}
