import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { loanDocuments } from "@/lib/schema";
import type { NewLoanDocument } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const documents = await db
      .select()
      .from(loanDocuments)
      .where(eq(loanDocuments.applicationId, id))
      .orderBy(desc(loanDocuments.createdAt));

    return NextResponse.json(documents);
  } catch (err) {
    console.error("[GET /api/loans/[id]/documents]", err);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;

    const documentType = typeof body.document_type === "string" ? body.document_type : "other";
    const fileName = typeof body.file_name === "string" ? body.file_name.trim() : "";
    const fileUrl = typeof body.file_url === "string" ? body.file_url.trim() : "";
    const uploadedBy = typeof body.uploaded_by === "string" ? body.uploaded_by : null;

    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { error: "file_name and file_url are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const newDoc: NewLoanDocument = {
      applicationId: id,
      documentType,
      fileName,
      fileUrl,
      uploadedBy,
    };

    const [document] = await db.insert(loanDocuments).values(newDoc).returning();
    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    console.error("[POST /api/loans/[id]/documents]", err);
    return NextResponse.json({ error: "Failed to add document" }, { status: 500 });
  }
}
