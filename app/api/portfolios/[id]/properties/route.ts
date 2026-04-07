import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { portfolios, portfolioProperties } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const props = await db
      .select()
      .from(portfolioProperties)
      .where(eq(portfolioProperties.portfolioId, id));

    return NextResponse.json(props);
  } catch (err) {
    console.error("[GET /api/portfolios/[id]/properties]", err);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json() as Record<string, unknown>;
    const address = typeof body.address === "string" ? body.address.trim() : "";
    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    const db = getDb();
    const [portfolio] = await db
      .select({ id: portfolios.id })
      .from(portfolios)
      .where(eq(portfolios.id, id))
      .limit(1);

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    const [inserted] = await db
      .insert(portfolioProperties)
      .values({
        portfolioId: id,
        address,
        propertyType: typeof body.property_type === "string" ? body.property_type.trim() || null : null,
        purchasePricePence: typeof body.purchase_price_pence === "number" ? body.purchase_price_pence : null,
        currentValuePence: typeof body.current_value_pence === "number" ? body.current_value_pence : null,
        outstandingMortgagePence: typeof body.outstanding_mortgage_pence === "number" ? body.outstanding_mortgage_pence : 0,
        monthlyRentPence: typeof body.monthly_rent_pence === "number" ? body.monthly_rent_pence : 0,
        monthlyMortgagePence: typeof body.monthly_mortgage_pence === "number" ? body.monthly_mortgage_pence : 0,
        monthlyCostsPence: typeof body.monthly_costs_pence === "number" ? body.monthly_costs_pence : 0,
        purchaseDate: typeof body.purchase_date === "string" && body.purchase_date ? new Date(body.purchase_date) : null,
        bedrooms: typeof body.bedrooms === "number" ? body.bedrooms : null,
        notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      })
      .returning();

    // Calculated metrics for this property
    const currentValue = inserted.currentValuePence ?? 0;
    const mortgage = inserted.outstandingMortgagePence ?? 0;
    const rent = inserted.monthlyRentPence ?? 0;
    const mortgagePayment = inserted.monthlyMortgagePence ?? 0;
    const costs = inserted.monthlyCostsPence ?? 0;
    const equity = currentValue - mortgage;
    const netCashflow = rent - mortgagePayment - costs;
    const yield_ = currentValue > 0 ? parseFloat(((rent * 12 / currentValue) * 100).toFixed(2)) : 0;

    return NextResponse.json({ ...inserted, equity, netCashflow, yield: yield_ }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/portfolios/[id]/properties]", err);
    return NextResponse.json({ error: "Failed to add property" }, { status: 500 });
  }
}
