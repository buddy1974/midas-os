import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { privateLenders, lenderDeals } from "@/lib/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim() ?? "";
  const lenderType = searchParams.get("lender_type")?.trim() ?? "";
  const minLoan = searchParams.get("min_loan") ? parseInt(searchParams.get("min_loan")!) : null;
  const maxLoan = searchParams.get("max_loan") ? parseInt(searchParams.get("max_loan")!) : null;
  const chargeType = searchParams.get("charge_type")?.trim() ?? "";

  try {
    const db = getDb();
    const conditions = [];
    if (status) conditions.push(eq(privateLenders.status, status));
    if (lenderType) conditions.push(eq(privateLenders.lenderType, lenderType));
    if (minLoan !== null) conditions.push(lte(privateLenders.minLoanPence, minLoan));
    if (maxLoan !== null) conditions.push(gte(privateLenders.maxLoanPence, maxLoan));

    const rows = await db
      .select()
      .from(privateLenders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get deal counts per lender
    const dealCounts = await db
      .select({
        lenderId: lenderDeals.lenderId,
        count: sql<number>`count(*)::int`,
      })
      .from(lenderDeals)
      .groupBy(lenderDeals.lenderId);

    const countMap = new Map(dealCounts.map((d) => [d.lenderId, d.count]));

    let result = rows.map((l) => ({ ...l, dealCount: countMap.get(l.id) ?? 0 }));

    if (chargeType) {
      result = result.filter((l) => l.chargeTypes?.includes(chargeType));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/lenders]", err);
    return NextResponse.json({ error: "Failed to fetch lenders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const db = getDb();
    const [inserted] = await db
      .insert(privateLenders)
      .values({
        name,
        email: typeof body.email === "string" ? body.email.trim() || null : null,
        phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
        company: typeof body.company === "string" ? body.company.trim() || null : null,
        lenderType: typeof body.lender_type === "string" ? body.lender_type : "individual",
        maxLoanPence: typeof body.max_loan_pence === "number" ? body.max_loan_pence : null,
        minLoanPence: typeof body.min_loan_pence === "number" ? body.min_loan_pence : null,
        maxLtv: typeof body.max_ltv === "number" ? body.max_ltv : null,
        monthlyRate: typeof body.monthly_rate === "number" ? String(body.monthly_rate) : null,
        chargeTypes: typeof body.charge_types === "string" ? body.charge_types.trim() || null : null,
        specialisms: typeof body.specialisms === "string" ? body.specialisms.trim() || null : null,
        status: typeof body.status === "string" ? body.status : "active",
        notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
        totalDeals: 0,
      })
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("[POST /api/lenders]", err);
    return NextResponse.json({ error: "Failed to create lender" }, { status: 500 });
  }
}
