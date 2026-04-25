import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { loanApplications } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { getOpenAI, hasOpenAI } from "@/lib/openai";

interface AiScoreResponse {
  score: number;
  verdict: "Strong" | "Acceptable" | "Decline";
  risk: "Low" | "Medium" | "High";
  summary: string;
  concerns: string[];
  positives: string[];
}

function fmtPence(p: number): string {
  return `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;
}

function demoScore(ltv: number, hasCcj: boolean, hasBankruptcy: boolean, missedPayments: boolean): AiScoreResponse {
  let score = 80;
  if (hasCcj) score -= 30;
  if (hasBankruptcy) score -= 40;
  if (ltv > 75) score -= 15;
  if (missedPayments) score -= 20;
  score = Math.max(0, Math.min(100, score));

  const verdict = score >= 70 ? "Strong" : score >= 50 ? "Acceptable" : "Decline";
  const risk = score >= 70 ? "Low" : score >= 50 ? "Medium" : "High";

  return {
    score,
    verdict,
    risk,
    summary: `Demo score: ${score}/100. LTV at ${ltv.toFixed(1)}% is ${ltv <= 75 ? "within" : "above"} standard limits. ${hasCcj || hasBankruptcy ? "Adverse credit history noted." : "Clean credit profile."} Application requires further review.`,
    concerns: [
      ...(hasCcj ? ["CCJ recorded — requires explanation"] : []),
      ...(hasBankruptcy ? ["Prior bankruptcy — high risk flag"] : []),
      ...(ltv > 75 ? [`LTV ${ltv.toFixed(1)}% exceeds standard 75% threshold`] : []),
      ...(missedPayments ? ["Missed payment history flagged"] : []),
    ].slice(0, 3),
    positives: [
      ...(ltv <= 65 ? ["Strong LTV — well within maximum"] : []),
      ...(!hasCcj && !hasBankruptcy ? ["Clean credit background"] : []),
      ...(!missedPayments ? ["No missed payment history"] : []),
    ].slice(0, 3),
  };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [application] = await db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.id, id));

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const ltvNum = Number(application.ltv ?? 0);

    let result: AiScoreResponse;

    if (!hasOpenAI()) {
      result = demoScore(
        ltvNum,
        application.hasCcj ?? false,
        application.hasBankruptcy ?? false,
        application.missedPayments ?? false
      );
    } else {
      const rentalLine = application.estimatedRentalPence
        ? `Est. rental income: ${fmtPence(application.estimatedRentalPence)}/mo`
        : "";

      const userPrompt = `UK Bridging Loan Application:

Loan: ${fmtPence(application.loanAmountPence)} over ${application.loanTermMonths} months
Purpose: ${application.loanPurpose ?? "Not specified"}
Monthly Rate: ${application.monthlyRate ?? "0.85"}%

Property: ${application.propertyAddress}
Type: ${application.propertyType ?? "Not specified"}
Value: ${application.propertyValuePence ? fmtPence(application.propertyValuePence) : "Not specified"}
LTV: ${ltvNum.toFixed(1)}%

Applicant: ${application.applicantType ?? "personal"}
Background flags:
  CCJ: ${application.hasCcj ? "Yes" : "No"}
  Bankruptcy: ${application.hasBankruptcy ? "Yes" : "No"}
  Missed payments: ${application.missedPayments ? "Yes" : "No"}
  Arrears: ${application.hasArrears ? "Yes" : "No"}

Repayment method: ${application.repaymentMethod ?? "sale"}
${rentalLine}

Underwrite this application for a UK private lender. Max LTV 75% first charge, 65% second charge.`;

      try {
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          max_tokens: 500,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: `You are a UK private bridging lender underwriter. Score loan applications for Midas Property Auctions.

Return ONLY JSON:
{
  "score": number 0-100,
  "verdict": "Strong"|"Acceptable"|"Decline",
  "risk": "Low"|"Medium"|"High",
  "summary": string (3 sentences max, plain English, specific to this deal),
  "concerns": string[] (max 3 items, key risks to flag),
  "positives": string[] (max 3 items, strengths of this application)
}`,
            },
            { role: "user", content: userPrompt },
          ],
        });

        const text = completion.choices[0].message.content ?? "";
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          result = JSON.parse(jsonMatch?.[0] ?? "{}") as AiScoreResponse;
        } catch {
          result = demoScore(ltvNum, application.hasCcj ?? false, application.hasBankruptcy ?? false, application.missedPayments ?? false);
        }
      } catch {
        result = demoScore(ltvNum, application.hasCcj ?? false, application.hasBankruptcy ?? false, application.missedPayments ?? false);
      }
    }

    // Update application
    const [updated] = await db
      .update(loanApplications)
      .set({
        aiScore: result.score,
        aiVerdict: result.verdict,
        aiRisk: result.risk,
        aiSummary: result.summary,
        updatedAt: sql`now()`,
      })
      .where(eq(loanApplications.id, id))
      .returning();

    return NextResponse.json({ application: updated, scoreDetails: result });
  } catch (err) {
    console.error("[POST /api/loans/[id]/score]", err);
    return NextResponse.json({ error: "Failed to score application" }, { status: 500 });
  }
}
