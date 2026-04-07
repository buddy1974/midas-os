import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return new NextResponse(errorPage("Invalid unsubscribe link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    const db = getDb();
    const [subscriber] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.token, token))
      .limit(1);

    if (!subscriber) {
      return new NextResponse(errorPage("Unsubscribe link not found."), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    await db
      .update(newsletterSubscribers)
      .set({ status: "unsubscribed" })
      .where(eq(newsletterSubscribers.token, token));

    return new NextResponse(successPage(), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    console.error("[GET /api/newsletter/unsubscribe]", err);
    return new NextResponse(errorPage("Something went wrong. Please try again."), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}

function successPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Unsubscribed — Midas Property Auctions</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0a0a; color: #e0e0e0; font-family: Georgia, serif;
    display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: #111; border: 1px solid #c9a84c33; border-radius: 8px;
    padding: 48px 40px; max-width: 480px; text-align: center; }
  .logo { color: #c9a84c; font-size: 2rem; letter-spacing: 0.3em;
    text-transform: uppercase; margin-bottom: 8px; }
  .sub { color: #888; font-size: 0.7rem; letter-spacing: 0.2em;
    text-transform: uppercase; margin-bottom: 32px; }
  h1 { font-size: 1.25rem; color: #e0e0e0; margin-bottom: 16px; }
  p { color: #888; font-size: 0.9rem; line-height: 1.6; }
  .divider { width: 40px; height: 1px; background: #c9a84c; margin: 24px auto; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">MIDAS</div>
  <div class="sub">Property Auctions</div>
  <div class="divider"></div>
  <h1>You have been unsubscribed</h1>
  <p>You have been unsubscribed from Midas Property Auctions newsletter. You will no longer receive emails from us.</p>
</div>
</body>
</html>`;
}

function errorPage(message: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Error — Midas Property Auctions</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0a0a; color: #e0e0e0; font-family: Georgia, serif;
    display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: #111; border: 1px solid #c9a84c33; border-radius: 8px;
    padding: 48px 40px; max-width: 480px; text-align: center; }
  .logo { color: #c9a84c; font-size: 2rem; letter-spacing: 0.3em;
    text-transform: uppercase; margin-bottom: 8px; }
  h1 { font-size: 1.25rem; color: #e0e0e0; margin-bottom: 16px; margin-top: 24px; }
  p { color: #888; font-size: 0.9rem; line-height: 1.6; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">MIDAS</div>
  <h1>Error</h1>
  <p>${message}</p>
</div>
</body>
</html>`;
}
