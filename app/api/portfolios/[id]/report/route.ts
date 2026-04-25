import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { portfolios, portfolioProperties } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getOpenAI, hasOpenAI } from "@/lib/openai";

interface AIReport {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  verdict: string;
  refinanceOpportunity: boolean;
  refinanceNote: string;
}

const DEMO_REPORT: AIReport = {
  summary: "This portfolio shows solid equity growth with balanced monthly cashflow. The strategy is well-aligned with current market conditions in the East London/Barking area.",
  strengths: ["Strong capital appreciation — all properties have grown significantly above purchase price", "Positive monthly cashflow across all units after costs"],
  concerns: ["Concentration risk — all properties in the same geographical area", "LTV could be optimised to release equity for further acquisitions"],
  recommendations: ["Consider a portfolio refinance to release equity for next acquisition", "Explore HMO conversion on the 3-bed terraced to boost yield from ~5.5% to 9%+", "Review management costs — could reduce by 1-2% with right lettings agent", "Consider adding a commercial unit to diversify strategy"],
  verdict: "A healthy BTL portfolio with strong growth — well-positioned for the next acquisition cycle.",
  refinanceOpportunity: true,
  refinanceNote: "Combined equity across all properties suggests a portfolio remortgage could release £100k+ for reinvestment at competitive LTV ratios.",
};

export async function POST(
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

    const totalValue = props.reduce((s, p) => s + (p.currentValuePence ?? 0), 0);
    const totalDebt = props.reduce((s, p) => s + (p.outstandingMortgagePence ?? 0), 0);
    const totalEquity = totalValue - totalDebt;
    const annualRent = props.reduce((s, p) => s + (p.monthlyRentPence ?? 0), 0) * 12;
    const grossYield = totalValue > 0 ? ((annualRent / totalValue) * 100).toFixed(2) : "0";
    const monthlyCashflow = props.reduce(
      (s, p) => s + (p.monthlyRentPence ?? 0) - (p.monthlyMortgagePence ?? 0) - (p.monthlyCostsPence ?? 0),
      0
    );
    const ltv = totalValue > 0 ? ((totalDebt / totalValue) * 100).toFixed(1) : "0";

    const fmt = (p: number) => `£${(p / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

    const propList = props
      .map(
        (p) =>
          `- ${p.address} | ${p.propertyType ?? "Unknown"} | Value: ${fmt(p.currentValuePence ?? 0)} | Rent: ${fmt(p.monthlyRentPence ?? 0)}/mo | Mortgage: ${fmt(p.monthlyMortgagePence ?? 0)}/mo | ${p.bedrooms ? p.bedrooms + " bed" : ""}`
      )
      .join("\n");

    if (!hasOpenAI()) {
      return NextResponse.json(DEMO_REPORT);
    }

    const userPrompt = `Analyse this UK property portfolio:
Owner: ${portfolio.ownerName}
Strategy: ${portfolio.strategy ?? "BTL"}
Properties: ${props.length}
Total Value: ${fmt(totalValue)}
Total Debt: ${fmt(totalDebt)}
Equity: ${fmt(totalEquity)}
LTV: ${ltv}%
Gross Yield: ${grossYield}%
Monthly Cashflow: ${fmt(monthlyCashflow)}

Properties:
${propList}`;

    const systemPrompt = `You are a UK property investment advisor working for Midas Property Auctions. You analyse investor portfolios and provide clear, actionable advice. UK English. Professional but direct.

Return ONLY valid JSON with exactly these keys:
{
  "summary": "string (2-3 sentences overview)",
  "strengths": ["string", "string"],
  "concerns": ["string", "string"],
  "recommendations": ["string", "string", "string"],
  "verdict": "string (one sentence overall verdict)",
  "refinanceOpportunity": boolean,
  "refinanceNote": "string (if true, explain why, otherwise empty string)"
}`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const text = completion.choices[0].message.content ?? "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const report = jsonMatch ? (JSON.parse(jsonMatch[0]) as AIReport) : DEMO_REPORT;

    return NextResponse.json(report);
  } catch (err) {
    console.error("[POST /api/portfolios/[id]/report]", err);
    return NextResponse.json(DEMO_REPORT);
  }
}
