import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contacts } from "@/lib/schema";
import type { NewContact } from "@/lib/schema";
import { desc, and, ilike, eq, or } from "drizzle-orm";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const contactType = searchParams.get("contact_type")?.trim() ?? "";

    const db = getDb();
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(contacts.name, `%${search}%`),
          ilike(contacts.email, `%${search}%`)
        )
      );
    }
    if (status) conditions.push(eq(contacts.status, status));
    if (contactType) conditions.push(eq(contacts.contactType, contactType));

    const rows = await db
      .select()
      .from(contacts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contacts.score), desc(contacts.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/contacts]", err);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim() : null;
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const score = typeof body.score === "number" ? Math.min(100, Math.max(0, body.score)) : 0;

    const newContact: NewContact = {
      name,
      email,
      phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
      contactType: typeof body.contact_type === "string" ? body.contact_type : null,
      score,
      status: typeof body.status === "string" ? body.status : "cold",
      budgetMin: typeof body.budget_min === "number" ? body.budget_min : null,
      budgetMax: typeof body.budget_max === "number" ? body.budget_max : null,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    };

    const db = getDb();
    const [inserted] = await db.insert(contacts).values(newContact).returning();
    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("[POST /api/contacts]", err);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
