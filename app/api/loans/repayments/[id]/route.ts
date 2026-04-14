import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { loanRepayments } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as { paid?: boolean };

    if (typeof body.paid !== "boolean") {
      return NextResponse.json({ error: "paid (boolean) is required" }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(loanRepayments)
      .set({
        paid: body.paid,
        paidDate: body.paid ? new Date() : null,
      })
      .where(eq(loanRepayments.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Repayment not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/loans/repayments/[id]]", err);
    return NextResponse.json({ error: "Failed to update repayment" }, { status: 500 });
  }
}
