import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { portfolios, portfolioProperties } from "@/lib/schema";
import { eq } from "drizzle-orm";

function calcMetrics(props: typeof portfolioProperties.$inferSelect[]) {
  const totalValue = props.reduce((s, p) => s + (p.currentValuePence ?? 0), 0);
  const totalDebt = props.reduce((s, p) => s + (p.outstandingMortgagePence ?? 0), 0);
  const totalEquity = totalValue - totalDebt;
  const annualRent = props.reduce((s, p) => s + (p.monthlyRentPence ?? 0), 0) * 12;
  const grossYield = totalValue > 0 ? parseFloat(((annualRent / totalValue) * 100).toFixed(2)) : 0;
  const monthlyCashflow = props.reduce(
    (s, p) => s + (p.monthlyRentPence ?? 0) - (p.monthlyMortgagePence ?? 0) - (p.monthlyCostsPence ?? 0),
    0
  );
  const ltv = totalValue > 0 ? parseFloat(((totalDebt / totalValue) * 100).toFixed(2)) : 0;
  return { totalValue, totalDebt, totalEquity, grossYield, monthlyCashflow, ltv };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, id))
      .limit(1);

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    const props = await db
      .select()
      .from(portfolioProperties)
      .where(eq(portfolioProperties.portfolioId, id));

    const metrics = calcMetrics(props);
    return NextResponse.json({ ...portfolio, properties: props, metrics });
  } catch (err) {
    console.error("[GET /api/portfolios/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 });
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

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.owner_name === "string" && body.owner_name) updateData.ownerName = body.owner_name.trim();
    if (typeof body.owner_email === "string") updateData.ownerEmail = body.owner_email.trim() || null;
    if (typeof body.portfolio_name === "string") updateData.portfolioName = body.portfolio_name.trim() || null;
    if (typeof body.strategy === "string") updateData.strategy = body.strategy;
    if (typeof body.notes === "string") updateData.notes = body.notes.trim() || null;
    if (typeof body.contact_id === "string") updateData.contactId = body.contact_id || null;

    const [updated] = await db
      .update(portfolios)
      .set(updateData)
      .where(eq(portfolios.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/portfolios/[id]]", err);
    return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    await db.delete(portfolioProperties).where(eq(portfolioProperties.portfolioId, id));
    await db.delete(portfolios).where(eq(portfolios.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/portfolios/[id]]", err);
    return NextResponse.json({ error: "Failed to delete portfolio" }, { status: 500 });
  }
}
