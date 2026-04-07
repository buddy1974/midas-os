import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { lenderDeals, privateLenders } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const deals = await db
      .select()
      .from(lenderDeals)
      .where(eq(lenderDeals.lenderId, id));

    return NextResponse.json(deals);
  } catch (err) {
    console.error("[GET /api/lenders/[id]/deals]", err);
    return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json() as Record<string, unknown>;
    const loanAmountPence = typeof body.loan_amount_pence === "number" ? body.loan_amount_pence : 0;
    if (!loanAmountPence) {
      return NextResponse.json({ error: "loan_amount_pence is required" }, { status: 400 });
    }

    const db = getDb();
    const [lender] = await db
      .select({ id: privateLenders.id })
      .from(privateLenders)
      .where(eq(privateLenders.id, id))
      .limit(1);

    if (!lender) {
      return NextResponse.json({ error: "Lender not found" }, { status: 404 });
    }

    const propertyValuePence = typeof body.property_value_pence === "number" ? body.property_value_pence : null;
    const ltv = propertyValuePence && propertyValuePence > 0
      ? parseFloat(((loanAmountPence / propertyValuePence) * 100).toFixed(2))
      : null;

    const [inserted] = await db
      .insert(lenderDeals)
      .values({
        lenderId: id,
        lotId: typeof body.lot_id === "string" ? body.lot_id : null,
        borrowerName: typeof body.borrower_name === "string" ? body.borrower_name.trim() || null : null,
        borrowerEmail: typeof body.borrower_email === "string" ? body.borrower_email.trim() || null : null,
        loanAmountPence,
        propertyValuePence,
        ltv: ltv !== null ? String(ltv) : null,
        monthlyRate: typeof body.monthly_rate === "number" ? String(body.monthly_rate) : null,
        termMonths: typeof body.term_months === "number" ? body.term_months : null,
        chargeType: typeof body.charge_type === "string" ? body.charge_type.trim() || null : null,
        status: "enquiry",
        notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      })
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("[POST /api/lenders/[id]/deals]", err);
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
