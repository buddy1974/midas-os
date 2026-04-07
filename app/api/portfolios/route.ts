import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { portfolios, portfolioProperties } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  try {
    const db = getDb();
    const rows = await db.select().from(portfolios);

    const enriched = await Promise.all(
      rows.map(async (portfolio) => {
        const props = await db
          .select()
          .from(portfolioProperties)
          .where(eq(portfolioProperties.portfolioId, portfolio.id));

        const totalValue = props.reduce((s, p) => s + (p.currentValuePence ?? 0), 0);
        const totalDebt = props.reduce((s, p) => s + (p.outstandingMortgagePence ?? 0), 0);
        const totalEquity = totalValue - totalDebt;
        const annualRent = props.reduce((s, p) => s + (p.monthlyRentPence ?? 0), 0) * 12;
        const grossYield = totalValue > 0 ? parseFloat(((annualRent / totalValue) * 100).toFixed(2)) : 0;
        const monthlyCashflow = props.reduce(
          (s, p) => s + (p.monthlyRentPence ?? 0) - (p.monthlyMortgagePence ?? 0) - (p.monthlyCostsPence ?? 0),
          0
        );

        return {
          ...portfolio,
          totalProperties: props.length,
          totalValue,
          totalDebt,
          totalEquity,
          grossYield,
          monthlyCashflow,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("[GET /api/portfolios]", err);
    return NextResponse.json({ error: "Failed to fetch portfolios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const ownerName = typeof body.owner_name === "string" ? body.owner_name.trim() : "";
    if (!ownerName) {
      return NextResponse.json({ error: "owner_name is required" }, { status: 400 });
    }

    const db = getDb();
    const [inserted] = await db
      .insert(portfolios)
      .values({
        ownerName,
        ownerEmail: typeof body.owner_email === "string" ? body.owner_email.trim() || null : null,
        contactId: typeof body.contact_id === "string" ? body.contact_id : null,
        portfolioName: typeof body.portfolio_name === "string" ? body.portfolio_name.trim() || null : null,
        strategy: typeof body.strategy === "string" ? body.strategy : "btl",
        notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      })
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("[POST /api/portfolios]", err);
    return NextResponse.json({ error: "Failed to create portfolio" }, { status: 500 });
  }
}
