import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { loanApplications, loanRepayments, loanDocuments } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
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

    const [repayments, documents] = await Promise.all([
      db.select().from(loanRepayments).where(eq(loanRepayments.applicationId, id)),
      db.select().from(loanDocuments).where(eq(loanDocuments.applicationId, id)),
    ]);

    return NextResponse.json({ application, repayments, documents });
  } catch (err) {
    console.error("[GET /api/loans/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;

    const db = getDb();
    const updateData: Record<string, unknown> = { updatedAt: sql`now()` };

    if (typeof body.status === "string") updateData.status = body.status;
    if (typeof body.notes === "string") updateData.notes = body.notes;
    if (typeof body.assigned_to === "string") updateData.assignedTo = body.assigned_to;
    if (typeof body.facility_letter_sent === "boolean") updateData.facilityLetterSent = body.facility_letter_sent;
    if (typeof body.ai_score === "number") updateData.aiScore = body.ai_score;
    if (typeof body.ai_verdict === "string") updateData.aiVerdict = body.ai_verdict;
    if (typeof body.ai_risk === "string") updateData.aiRisk = body.ai_risk;
    if (typeof body.ai_summary === "string") updateData.aiSummary = body.ai_summary;
    if (typeof body.broker_name === "string") updateData.brokerName = body.broker_name;
    if (typeof body.broker_email === "string") updateData.brokerEmail = body.broker_email;

    const [updated] = await db
      .update(loanApplications)
      .set(updateData)
      .where(eq(loanApplications.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/loans/[id]]", err);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [application] = await db
      .select({ status: loanApplications.status })
      .from(loanApplications)
      .where(eq(loanApplications.id, id));

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== "enquiry") {
      return NextResponse.json(
        { error: "Only enquiry-stage applications can be deleted" },
        { status: 400 }
      );
    }

    await db.delete(loanRepayments).where(eq(loanRepayments.applicationId, id));
    await db.delete(loanDocuments).where(eq(loanDocuments.applicationId, id));
    await db.delete(loanApplications).where(eq(loanApplications.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/loans/[id]]", err);
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
