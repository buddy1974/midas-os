import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { campaigns } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

type TemplateType =
  | "auction_alert"
  | "deal_spotlight"
  | "event_invite"
  | "legal_pack"
  | "registration_close"
  | "monthly_digest";

const BODY_COPY: Record<TemplateType, string> = {
  auction_alert:
    "A new auction lot has just been listed on the Midas platform. This property matches your investment criteria and we believe it represents an exceptional opportunity in the current market.",
  deal_spotlight:
    "We have identified an exceptional deal that we wanted to share with you exclusively. This opportunity offers strong equity potential and aligns perfectly with current market conditions.",
  event_invite:
    "You're invited to our upcoming event. As a valued member of the Midas investor community, we'd love for you to join us for an exclusive evening of networking and property insights.",
  legal_pack:
    "The legal pack is now available for download. We encourage you to review the documentation carefully and consult with your solicitor before the auction date.",
  registration_close:
    "Final reminder — registration closes soon for our next auction. Secure your bidder registration now to avoid missing out on some outstanding lots.",
  monthly_digest:
    "Here's your monthly market digest from Midas Property Auctions. Inside you'll find the latest auction results, market analysis, and upcoming opportunities selected for your portfolio.",
};

function buildEmailHtml(subject: string, templateType: string): string {
  const copy =
    BODY_COPY[(templateType as TemplateType)] ??
    "Thank you for being a valued member of the Midas investor community.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080809;">
    <tr>
      <td align="center" style="padding:28px 24px;">
        <img src="https://midas-property-sam.vercel.app/logo.png" alt="Midas Property Auctions" style="height:50px;width:auto;display:inline-block;" />
      </td>
    </tr>
  </table>
  <!-- Body -->
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td style="background:#ffffff;padding:40px 32px 32px;">
        <h1 style="margin:0 0 20px;font-size:22px;color:#1a1a1a;line-height:1.3;">${subject}</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6;">Dear [First Name],</p>
        <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6;">${copy}</p>
        <!-- CTA -->
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#C9A84C;border-radius:4px;">
              <a href="#" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:bold;color:#080809;text-decoration:none;letter-spacing:1px;">View Details</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background:#f9f9f9;padding:24px 32px;border-top:1px solid #eeeeee;">
        <p style="margin:0 0 4px;font-size:12px;color:#888888;">Midas Property Group · Stanmore Business Centre, London HA7 1BT · +44 207 206 2691</p>
        <p style="margin:0;font-size:11px;color:#aaaaaa;">
          <a href="#" style="color:#aaaaaa;">Unsubscribe</a> ·
          <a href="#" style="color:#aaaaaa;">Privacy Policy</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

interface ResendSuccessResponse {
  id: string;
}

interface ResendErrorResponse {
  message?: string;
  name?: string;
  statusCode?: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json() as Record<string, unknown>;
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const segment = typeof body.segment === "string" ? body.segment.trim() : "";
  const templateType =
    typeof body.template_type === "string" ? body.template_type : "auction_alert";
  const recipientCount =
    typeof body.recipient_count === "number" ? body.recipient_count : 1;

  if (!subject) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }
  if (!segment) {
    return NextResponse.json({ error: "segment is required" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      {
        error: "Email service not configured",
        demo: true,
        message: "Add RESEND_API_KEY to .env.local",
      },
      { status: 503 }
    );
  }

  const html = buildEmailHtml(subject, templateType);

  let resendData: ResendSuccessResponse;
  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Midas Property Auctions <noreply@midaspropertyauctions.co.uk>",
        to: ["sam@midaspropertyauctions.co.uk"],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errData = await resendRes.json() as ResendErrorResponse;

      // Mark campaign as failed
      try {
        const db = getDb();
        await db
          .update(campaigns)
          .set({ status: "failed", updatedAt: sql`now()` })
          .where(eq(campaigns.id, id));
      } catch (dbErr) {
        console.error("[Send] DB update failed:", dbErr);
      }

      return NextResponse.json(
        { error: "Send failed", detail: errData },
        { status: 502 }
      );
    }

    resendData = await resendRes.json() as ResendSuccessResponse;
  } catch (err) {
    console.error("[Send] Resend fetch error:", err);
    return NextResponse.json({ error: "Send failed" }, { status: 502 });
  }

  // Update campaign to sent
  try {
    const db = getDb();
    await db
      .update(campaigns)
      .set({
        status: "sent",
        sentAt: new Date(),
        resendMessageId: resendData.id,
        recipientCount,
        updatedAt: sql`now()`,
      })
      .where(eq(campaigns.id, id));
  } catch (dbErr) {
    console.error("[Send] Failed to update campaign status:", dbErr);
  }

  return NextResponse.json({ success: true, messageId: resendData.id });
}
