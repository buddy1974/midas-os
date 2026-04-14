import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { loanApplications, loanRepayments, contacts } from "@/lib/schema";
import type { NewLoanApplication, NewLoanRepayment, NewContact } from "@/lib/schema";
import { desc, eq, and, gte, lte, SQL } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const applicantType = searchParams.get("applicant_type");
    const source = searchParams.get("source");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const db = getDb();
    const conditions: SQL[] = [];

    if (status) conditions.push(eq(loanApplications.status, status));
    if (applicantType) conditions.push(eq(loanApplications.applicantType, applicantType));
    if (source) conditions.push(eq(loanApplications.source, source));
    if (dateFrom) conditions.push(gte(loanApplications.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(loanApplications.createdAt, new Date(dateTo)));

    const apps = await db
      .select()
      .from(loanApplications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(loanApplications.createdAt));

    const enriched = apps.map((app) => {
      const rate = Number(app.monthlyRate ?? 0.85);
      const monthlyInterest = Math.round(app.loanAmountPence * (rate / 100));
      const totalInterest = monthlyInterest * app.loanTermMonths;
      const ltvCalc = app.propertyValuePence
        ? Number(((app.loanAmountPence / app.propertyValuePence) * 100).toFixed(2))
        : null;
      return {
        ...app,
        ltvCalc,
        monthlyInterest,
        totalInterest,
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("[GET /api/loans]", err);
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    // 1. Validate required fields
    const applicantName = typeof body.applicant_name === "string" ? body.applicant_name.trim() : "";
    const applicantEmail = typeof body.applicant_email === "string" ? body.applicant_email.trim() : "";
    const propertyAddress = typeof body.property_address === "string" ? body.property_address.trim() : "";
    const loanAmountPence = typeof body.loan_amount_pence === "number" ? body.loan_amount_pence : 0;
    const loanTermMonths = typeof body.loan_term_months === "number" ? body.loan_term_months : 0;
    const propertyValuePence = typeof body.property_value_pence === "number" ? body.property_value_pence : 0;

    const missing: string[] = [];
    if (!applicantName) missing.push("applicant_name");
    if (!applicantEmail) missing.push("applicant_email");
    if (!propertyAddress) missing.push("property_address");
    if (!loanAmountPence) missing.push("loan_amount_pence");
    if (!loanTermMonths) missing.push("loan_term_months");
    if (!propertyValuePence) missing.push("property_value_pence");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // 2. Calculate LTV
    const ltv = Number(((loanAmountPence / propertyValuePence) * 100).toFixed(2));
    if (ltv > 85) {
      return NextResponse.json(
        { error: "LTV exceeds maximum 85%" },
        { status: 400 }
      );
    }

    // 3. Quick AI pre-score
    const hasCcj = body.has_ccj === true;
    const hasBankruptcy = body.has_bankruptcy === true;
    const missedPayments = body.missed_payments === true;

    let score = 80;
    if (hasCcj) score -= 30;
    if (hasBankruptcy) score -= 40;
    if (ltv > 75) score -= 15;
    if (missedPayments) score -= 20;
    score = Math.max(0, Math.min(100, score));

    const aiRisk = score >= 70 ? "Low" : score >= 50 ? "Medium" : "High";

    const monthlyRate = typeof body.monthly_rate === "number"
      ? body.monthly_rate
      : 0.85;
    const monthlyInterestPence = Math.round(loanAmountPence * (monthlyRate / 100));

    // 4. Insert application
    const newApp: NewLoanApplication = {
      loanType: typeof body.loan_type === "string" ? body.loan_type : "bridging",
      loanPurpose: typeof body.loan_purpose === "string" ? body.loan_purpose : null,
      loanAmountPence,
      loanTermMonths,
      monthlyRate: String(monthlyRate),
      repaymentMethod: typeof body.repayment_method === "string" ? body.repayment_method : "sale",
      propertyAddress,
      propertyType: typeof body.property_type === "string" ? body.property_type : null,
      propertyStatus: typeof body.property_status === "string" ? body.property_status : null,
      propertyValuePence,
      purchasePricePence: typeof body.purchase_price_pence === "number" ? body.purchase_price_pence : null,
      chargeType: typeof body.charge_type === "string" ? body.charge_type : "first",
      estimatedRentalPence: typeof body.estimated_rental_pence === "number" ? body.estimated_rental_pence : null,
      applicantType: typeof body.applicant_type === "string" ? body.applicant_type : "personal",
      applicantName,
      applicantEmail,
      applicantPhone: typeof body.applicant_phone === "string" ? body.applicant_phone : null,
      companyName: typeof body.company_name === "string" ? body.company_name : null,
      refusedMortgage: body.refused_mortgage === true,
      hasCcj,
      hasBankruptcy,
      missedPayments,
      hasArrears: body.has_arrears === true,
      aiScore: score,
      aiRisk,
      ltv: String(ltv),
      status: "enquiry",
      source: typeof body.source === "string" ? body.source : "website",
      brokerName: typeof body.broker_name === "string" ? body.broker_name : null,
      brokerEmail: typeof body.broker_email === "string" ? body.broker_email : null,
      assignedTo: null,
      facilityLetterSent: false,
    };

    const db = getDb();
    const [application] = await db.insert(loanApplications).values(newApp).returning();

    if (!application) {
      return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
    }

    // 5. Generate repayment schedule
    const now = new Date(application.createdAt ?? new Date());
    const repayments: NewLoanRepayment[] = [];

    for (let month = 1; month <= loanTermMonths; month++) {
      const dueDate = new Date(now.getTime() + month * 30 * 24 * 60 * 60 * 1000);
      const isFinalMonth = month === loanTermMonths;
      const amountPence = isFinalMonth
        ? monthlyInterestPence + loanAmountPence
        : monthlyInterestPence;

      repayments.push({
        applicationId: application.id,
        monthNumber: month,
        dueDate,
        amountPence,
        paid: false,
      });
    }

    const repaymentSchedule = await db.insert(loanRepayments).values(repayments).returning();

    // 6. Auto-create contact
    const newContact: NewContact = {
      name: applicantName,
      email: applicantEmail,
      phone: typeof body.applicant_phone === "string" ? body.applicant_phone : null,
      contactType: "lead",
      score: score,
      status: score >= 70 ? "warm" : "cold",
      notes: `Loan applicant — ${application.id.slice(0, 8)}`,
    };
    await db.insert(contacts).values(newContact).onConflictDoNothing();

    // 7. Return
    return NextResponse.json(
      { application, repaymentSchedule },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/loans]", err);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
