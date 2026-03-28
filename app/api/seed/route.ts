import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { users, lots, contacts, activityLog } from "@/lib/schema";
import type { NewUser, NewLot, NewContact, NewActivityLog } from "@/lib/schema";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seed route disabled in production" },
      { status: 403 }
    );
  }

  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hashedPassword = await bcrypt.hash("MidasOS2026!", 12);

  const seedUsers: NewUser[] = [
    {
      name: "Sam Fongho",
      email: "sam@midaspropertyauctions.co.uk",
      password: hashedPassword,
      role: "admin",
    },
  ];

  const seedLots: NewLot[] = [
    {
      address: "22 Fletcher Road, Birmingham, B12 9LT",
      guidePrice: 12000000,
      arv: 18700000,
      bedrooms: 3,
      propertyType: "Residential",
      pipelineStage: "completed",
      soldPrice: 18750000,
      notes: "Sold at auction. Excellent return.",
    },
    {
      address: "5 Weald Lane, Harrow, HA3 5QP",
      guidePrice: 9500000,
      arv: 14000000,
      bedrooms: 4,
      propertyType: "HMO",
      pipelineStage: "legal_pack",
      notes: "Legal pack downloaded. Auction ready.",
    },
    {
      address: "Unit 3, Clarendon Business Park, Leeds, LS2 7EN",
      guidePrice: 25000000,
      arv: 32000000,
      bedrooms: null,
      propertyType: "Commercial",
      pipelineStage: "sourcing",
      notes: "Initial valuation complete. Due diligence ongoing.",
    },
  ];

  const seedContacts: NewContact[] = [
    {
      name: "Marcus Okonkwo",
      email: "marcus.o@gmail.com",
      phone: "+44 7700 900001",
      contactType: "investor",
      score: 88,
      status: "hot",
      budgetMin: 10000000,
      budgetMax: 30000000,
      notes: "Registered to bid. Very active.",
    },
    {
      name: "Priya Sharma",
      email: "priya.s@outlook.com",
      phone: "+44 7700 900002",
      contactType: "buyer",
      score: 62,
      status: "warm",
      budgetMin: 8000000,
      budgetMax: 15000000,
      notes: "Newsletter subscriber. Interested in residential.",
    },
    {
      name: "James Hutchinson",
      email: "j.hutchinson@investco.co.uk",
      phone: "+44 7700 900003",
      contactType: "investor",
      score: 95,
      status: "vip",
      budgetMin: 50000000,
      budgetMax: 200000000,
      notes: "VIP investor. Meeting request pending.",
    },
    {
      name: "Angela Winters",
      email: "angela.w@vendco.co.uk",
      phone: "+44 7700 900004",
      contactType: "vendor",
      score: 45,
      status: "cold",
      budgetMin: null,
      budgetMax: null,
      notes: "Vendor contact for Leeds commercial unit.",
    },
    {
      name: "Derek Boateng",
      email: "derek.b@propertyleads.co.uk",
      phone: "+44 7700 900005",
      contactType: "lead",
      score: 30,
      status: "cold",
      budgetMin: 5000000,
      budgetMax: 10000000,
      notes: "Inbound lead. Not yet qualified.",
    },
  ];

  const seedActivity: NewActivityLog[] = [
    {
      eventType: "lot_added",
      description: "New lot added: 202A Bennetts Castle Lane, RM8 3XP",
      metadata: { lot_stage: "legal_pack" },
    },
    {
      eventType: "contact_added",
      description: "New subscriber registered: Priya Sharma",
      metadata: { contact_type: "investor" },
    },
    {
      eventType: "lot_sold",
      description: "LOT SOLD: 22 Fletcher Road, Dagenham — £187,500",
      metadata: { sold_price: 187500, over_guide_pct: 17 },
    },
    {
      eventType: "campaign_sent",
      description: "Campaign sent: £160k Creative Finance — 2,847 recipients",
      metadata: { recipient_count: 2847 },
    },
  ];

  const db = getDb();
  await db.insert(users).values(seedUsers).onConflictDoNothing();
  await db.insert(lots).values(seedLots);
  await db.insert(contacts).values(seedContacts);
  await db.insert(activityLog).values(seedActivity);

  return NextResponse.json({ success: true, message: "Seeded" });
}
