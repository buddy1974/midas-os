import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  newsletterSubscribers,
  newsletterSends,
  newsletterDrafts,
} from "@/lib/schema";
import { eq } from "drizzle-orm";

interface SendBody {
  draftId?: string;
  subject: string;
  previewText?: string;
  templateType: string;
  htmlBody: string;
  segment: string;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "Email not configured", demo: true },
      { status: 503 }
    );
  }

  try {
    const body = await req.json() as SendBody;
    const { draftId, subject, templateType, htmlBody, segment } = body;

    if (!subject || !htmlBody || !segment) {
      return NextResponse.json(
        { error: "subject, htmlBody, and segment are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Fetch subscribers based on segment
    let subscriberQuery = db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, "confirmed"));

    const allSubscribers = await subscriberQuery;

    const filtered =
      segment === "all"
        ? allSubscribers
        : allSubscribers.filter((s) => s.investorType === segment);

    const BATCH_SIZE = 50;
    let sent = 0;
    let failed = 0;
    const resendIds: string[] = [];

    for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
      const batch = filtered.slice(i, i + BATCH_SIZE);

      const promises = batch.map(async (subscriber) => {
        const firstName = subscriber.name?.split(" ")[0] ?? "Investor";
        const unsubscribeUrl = `${process.env.NEXTAUTH_URL ?? ""}/api/newsletter/unsubscribe?token=${subscriber.token}`;

        const personalHtml = htmlBody
          .replace(/\{\{FIRST_NAME\}\}/g, firstName)
          .replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);

        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Midas Property Auctions <sam@midaspropertyauctions.co.uk>",
              to: [subscriber.email],
              subject,
              html: personalHtml,
            }),
          });

          if (res.ok) {
            const data = await res.json() as { id?: string };
            if (data.id) resendIds.push(data.id);
            sent++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      });

      await Promise.all(promises);

      if (i + BATCH_SIZE < filtered.length) {
        await sleep(100);
      }
    }

    // Record the send
    const [sendRecord] = await db
      .insert(newsletterSends)
      .values({
        subject,
        templateType,
        segment,
        recipientCount: sent,
        resendMessageId: resendIds[0] ?? null,
        status: "sent",
      })
      .returning();

    // Update draft if provided
    if (draftId) {
      await db
        .update(newsletterDrafts)
        .set({ status: "sent", sentAt: new Date(), recipientCount: sent })
        .where(eq(newsletterDrafts.id, draftId));
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      sendId: sendRecord?.id,
    });
  } catch (err) {
    console.error("[POST /api/newsletter/send]", err);
    return NextResponse.json({ error: "Failed to send campaign" }, { status: 500 });
  }
}
