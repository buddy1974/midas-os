import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { privateLenders } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface MatchedLender {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  lenderType: string | null;
  maxLoanPence: number | null;
  minLoanPence: number | null;
  maxLtv: number | null;
  monthlyRate: string | null;
  chargeTypes: string | null;
  specialisms: string | null;
  status: string | null;
  totalDeals: number | null;
  lastDealDate: Date | null;
  matchScore: number;
  createdAt: Date;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const loanAmountPence = typeof body.loan_amount_pence === "number" ? body.loan_amount_pence : 0;
    const propertyValuePence = typeof body.property_value_pence === "number" ? body.property_value_pence : 0;
    const chargeType = typeof body.charge_type === "string" ? body.charge_type.trim() : "";
    const loanPurpose = typeof body.loan_purpose === "string" ? body.loan_purpose.trim() : "";

    if (!loanAmountPence) {
      return NextResponse.json({ error: "loan_amount_pence is required" }, { status: 400 });
    }

    const requiredLtv = propertyValuePence > 0
      ? Math.round((loanAmountPence / propertyValuePence) * 100)
      : 0;

    const db = getDb();
    const activeLenders = await db
      .select()
      .from(privateLenders)
      .where(eq(privateLenders.status, "active"));

    // Filter matching lenders
    const matched: MatchedLender[] = [];
    for (const lender of activeLenders) {
      const maxLoan = lender.maxLoanPence ?? 0;
      const minLoan = lender.minLoanPence ?? 0;
      const maxLtv = lender.maxLtv ?? 0;
      const lenderCharges = lender.chargeTypes ?? "";

      if (maxLoan > 0 && loanAmountPence > maxLoan) continue;
      if (minLoan > 0 && loanAmountPence < minLoan) continue;
      if (requiredLtv > 0 && maxLtv > 0 && requiredLtv > maxLtv) continue;
      if (chargeType && !lenderCharges.toLowerCase().includes(chargeType.toLowerCase())) continue;

      // Score: 0-100
      let score = 50;

      // Rate competitiveness (lower is better)
      const rate = parseFloat(String(lender.monthlyRate ?? "1.5"));
      if (rate <= 0.5) score += 20;
      else if (rate <= 0.75) score += 15;
      else if (rate <= 1.0) score += 10;
      else if (rate <= 1.25) score += 5;

      // Specialism match
      const specialisms = (lender.specialisms ?? "").toLowerCase();
      if (loanPurpose && specialisms.includes(loanPurpose.toLowerCase())) score += 15;

      // Experience (total deals)
      const deals = lender.totalDeals ?? 0;
      if (deals >= 20) score += 10;
      else if (deals >= 10) score += 7;
      else if (deals >= 5) score += 4;

      // Recency (last deal within 3 months = 5 points)
      if (lender.lastDealDate) {
        const monthsAgo = (Date.now() - new Date(lender.lastDealDate).getTime()) / (30 * 24 * 60 * 60 * 1000);
        if (monthsAgo <= 3) score += 5;
      }

      score = Math.min(100, score);
      matched.push({ ...lender, matchScore: score });
    }

    // Sort by rate ascending
    matched.sort((a, b) => {
      const rA = parseFloat(String(a.monthlyRate ?? "99"));
      const rB = parseFloat(String(b.monthlyRate ?? "99"));
      return rA - rB;
    });

    return NextResponse.json({ requiredLtv, lenders: matched });
  } catch (err) {
    console.error("[POST /api/lenders/match]", err);
    return NextResponse.json({ error: "Failed to match lenders" }, { status: 500 });
  }
}
