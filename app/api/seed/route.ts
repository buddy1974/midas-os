import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { users, lots, contacts, activityLog, newsletterSubscribers, events, eventRegistrations } from "@/lib/schema";
import type { NewUser, NewLot, NewContact, NewActivityLog, NewNewsletterSubscriber, NewEvent, NewEventRegistration } from "@/lib/schema";

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

  const seedSubscribers: NewNewsletterSubscriber[] = [
    {
      email: "james.wilson@property.co.uk",
      name: "James Wilson",
      status: "confirmed",
      investorType: "hmo",
      source: "manual",
      token: "tok_james_wilson_001",
    },
    {
      email: "priya.sharma@invest.com",
      name: "Priya Sharma",
      status: "confirmed",
      investorType: "btl",
      source: "website",
      token: "tok_priya_sharma_002",
    },
    {
      email: "marcus.obi@gmail.com",
      name: "Marcus Obi",
      status: "confirmed",
      investorType: "hmo",
      source: "event",
      token: "tok_marcus_obi_003",
    },
    {
      email: "angela.chen@portfolio.uk",
      name: "Angela Chen",
      status: "confirmed",
      investorType: "commercial",
      source: "manual",
      token: "tok_angela_chen_004",
    },
    {
      email: "derek.brown@london.com",
      name: "Derek Brown",
      status: "confirmed",
      investorType: "btl",
      source: "mailchimp_import",
      token: "tok_derek_brown_005",
    },
    {
      email: "sara.ahmed@invest.uk",
      name: "Sara Ahmed",
      status: "confirmed",
      investorType: "land",
      source: "website",
      token: "tok_sara_ahmed_006",
    },
    {
      email: "tom.forde@capital.com",
      name: "Tom Forde",
      status: "unsubscribed",
      investorType: "general",
      source: "website",
      token: "tok_tom_forde_007",
    },
    {
      email: "yemi.adeyemi@btlinvest.co.uk",
      name: "Yemi Adeyemi",
      status: "confirmed",
      investorType: "hmo",
      source: "event",
      token: "tok_yemi_adeyemi_008",
    },
  ];

  const seedEvents: NewEvent[] = [
    {
      title: "Midas Spring Auction 2026",
      eventType: "auction",
      status: "upcoming",
      location: "Online — Live Stream",
      zoomLink: "https://zoom.us/j/midas-spring-2026",
      eventDate: new Date("2026-04-14T12:00:00Z"),
      endTime: new Date("2026-04-14T15:00:00Z"),
      maxCapacity: 500,
      pricePence: 0,
      description:
        "Midas Property Auctions Spring Sale 2026. 12 lots across London and Essex. Legal packs available. Register to bid in advance.",
    },
    {
      title: "Harrow School Business Networking Evening",
      eventType: "networking",
      status: "upcoming",
      location: "Harrow School, Harrow on the Hill, HA1 3HP",
      eventDate: new Date("2026-04-14T18:00:00Z"),
      endTime: new Date("2026-04-14T22:30:00Z"),
      maxCapacity: 200,
      pricePence: 6000,
      description:
        "High-quality networking evening at Harrow School. Keynote: Lord Bilimoria (Founder of Cobra Beer). Dinner and drinks included. Serious business owners and property professionals.",
    },
    {
      title: "How to Buy Below Market Value at Auction",
      eventType: "webinar",
      status: "upcoming",
      location: "Zoom — Online",
      zoomLink: "https://zoom.us/j/midas-webinar-bmv",
      eventDate: new Date("2026-04-27T18:00:00Z"),
      endTime: new Date("2026-04-27T19:30:00Z"),
      maxCapacity: 100,
      pricePence: 0,
      description:
        "Sam Fongho shares his exact system for finding and winning below-market-value properties at UK auction. Legal pack analysis, bidding strategy, creative finance options.",
    },
  ];

  const db = getDb();
  await db.insert(users).values(seedUsers).onConflictDoNothing();
  await db.insert(lots).values(seedLots);
  await db.insert(contacts).values(seedContacts);
  await db.insert(activityLog).values(seedActivity);
  await db.insert(newsletterSubscribers).values(seedSubscribers).onConflictDoNothing();

  const insertedEvents = await db.insert(events).values(seedEvents).returning();
  const springAuction = insertedEvents[0];

  if (springAuction) {
    const seedRegistrations: NewEventRegistration[] = [
      { eventId: springAuction.id, name: "James Wilson", email: "james.wilson@property.co.uk", investorType: "hmo", source: "direct", status: "registered" },
      { eventId: springAuction.id, name: "Priya Sharma", email: "priya.sharma@invest.com", investorType: "btl", source: "newsletter", status: "registered" },
      { eventId: springAuction.id, name: "Marcus Obi", email: "marcus.obi@gmail.com", investorType: "hmo", source: "social", status: "registered" },
      { eventId: springAuction.id, name: "Angela Chen", email: "angela.chen@portfolio.uk", investorType: "commercial", source: "direct", status: "registered" },
    ];
    await db.insert(eventRegistrations).values(seedRegistrations);
  }

  return NextResponse.json({ success: true, message: "Seeded" });
}
