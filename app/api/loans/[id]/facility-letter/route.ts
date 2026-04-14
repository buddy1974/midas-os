import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { loanApplications } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

function fmtPence(p: number): string {
  return `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;
}

function demoLetter(app: {
  applicantName: string;
  companyName: string | null;
  applicantEmail: string;
  loanAmountPence: number;
  monthlyRate: string | null;
  loanTermMonths: number;
  propertyAddress: string;
  propertyValuePence: number | null;
  ltv: string | null;
  chargeType: string | null;
}): string {
  const total = fmtPence(
    app.loanAmountPence * Number(app.monthlyRate ?? 0.85) / 100 * app.loanTermMonths
  );
  return `PRIVATE & CONFIDENTIAL
SUBJECT TO CONTRACT

${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}

${app.applicantName}${app.companyName ? `\n${app.companyName}` : ""}

Dear ${app.applicantName.split(" ")[0]},

RE: BRIDGING LOAN FACILITY — SUBJECT TO CONTRACT

We are pleased to set out the indicative terms for a bridging loan facility from Midas Property Auctions (the "Lender") to ${app.companyName ?? app.applicantName} (the "Borrower"):

FACILITY DETAILS
─────────────────────────────────────────────
Facility Amount:      ${fmtPence(app.loanAmountPence)}
Monthly Interest:     ${app.monthlyRate ?? "0.85"}%
Term:                 ${app.loanTermMonths} months
Total Interest:       ${total}
Charge:               ${app.chargeType === "second" ? "Second" : "First"} Legal Charge
─────────────────────────────────────────────

SECURITY PROPERTY
Security:             ${app.propertyAddress}
Estimated Value:      ${app.propertyValuePence ? fmtPence(app.propertyValuePence) : "TBC"}
LTV:                  ${app.ltv ? Number(app.ltv).toFixed(1) : "TBC"}%

CONDITIONS PRECEDENT
This facility is offered subject to, inter alia:
1. Satisfactory valuation by a lender-approved RICS surveyor;
2. Satisfactory title and legal due diligence;
3. Evidence of planning permission or permitted development rights (if applicable);
4. Satisfactory ID and AML verification;
5. Receipt of signed facility letter and payment of arrangement fee;
6. No material adverse change in the Borrower's financial position.

INTEREST AND REPAYMENT
Interest is charged monthly on the outstanding balance at the rate specified above. The facility operates on an interest-only basis. The full principal sum plus any accrued interest is repayable on the earlier of: (a) the facility end date; (b) sale of the security property; or (c) refinance onto term finance.

LEGAL REQUIREMENTS
The Borrower must instruct solicitors acceptable to the Lender. All legal costs (Borrower's and Lender's) are payable by the Borrower. A first/second legal charge will be registered at HM Land Registry.

ARRANGEMENT FEE
An arrangement fee of 2% of the facility amount is payable on drawdown.

DECLARATION
This offer is made in good faith and is subject to formal credit approval and satisfactory completion of due diligence. This letter does not constitute a binding offer and Midas Property Auctions reserves the right to withdraw or amend these terms at any time prior to completion.

For queries, please contact:
Sam Fongho
Midas Property Auctions
Stanmore Business & Innovation Centre
Stanmore Place, London HA7 1BT
Tel: 07454 753318

Yours sincerely,

Sam Fongho
Director — Midas Property Auctions`;
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

    const validStatuses = ["terms_issued", "under_assessment", "enquiry", "documents_requested"];
    if (!validStatuses.includes(application.status ?? "")) {
      return NextResponse.json(
        { error: "Facility letter can only be generated for active pipeline applications" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    let letterContent: string;

    if (!apiKey) {
      letterContent = demoLetter(application);
    } else {
      const totalInterest = fmtPence(
        Math.round(application.loanAmountPence * Number(application.monthlyRate ?? 0.85) / 100 * application.loanTermMonths)
      );

      const userPrompt = `Draft a bridging loan facility letter for:

Borrower: ${application.applicantName}
${application.companyName ? `Company: ${application.companyName}` : ""}
Email: ${application.applicantEmail}

Facility Amount: ${fmtPence(application.loanAmountPence)}
Monthly Interest Rate: ${application.monthlyRate ?? "0.85"}%
Term: ${application.loanTermMonths} months
Total Interest: ${totalInterest}
Charge: ${application.chargeType === "second" ? "second" : "first"} charge

Security Property: ${application.propertyAddress}
Estimated Value: ${application.propertyValuePence ? fmtPence(application.propertyValuePence) : "TBC"}
LTV: ${application.ltv ? Number(application.ltv).toFixed(1) : "TBC"}%

Lender: Midas Property Auctions
Stanmore Business & Innovation Centre
Stanmore Place, London HA7 1BT
Contact: Sam Fongho — 07454 753318

Include:
- Facility details
- Key conditions precedent
- Interest and repayment terms
- Security requirements
- Legal requirements
- Standard declarations
- Signature block

Mark clearly: SUBJECT TO CONTRACT
This is a draft for review, not a binding offer.`;

      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 2000,
          system: `You are a UK solicitor drafting a bridging loan facility letter for Midas Property Auctions, a private lender based in London. Use formal UK legal letter format. UK English. Professional.`,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!anthropicRes.ok) {
        letterContent = demoLetter(application);
      } else {
        const data = await anthropicRes.json() as { content?: Array<{ text?: string }> };
        letterContent = data.content?.[0]?.text ?? demoLetter(application);
      }
    }

    // Mark facility letter sent
    await db
      .update(loanApplications)
      .set({ facilityLetterSent: true, updatedAt: sql`now()` })
      .where(eq(loanApplications.id, id));

    return NextResponse.json({
      letter: letterContent,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/loans/[id]/facility-letter]", err);
    return NextResponse.json({ error: "Failed to generate facility letter" }, { status: 500 });
  }
}
