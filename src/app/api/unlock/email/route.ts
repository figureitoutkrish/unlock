import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { links, capturedEmails, analyticsEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// CORS — the Cloudflare Worker serves the email gate HTML from a different
// domain, so browsers need these headers to allow the cross-origin fetch.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, linkId } = body as { email?: string; linkId?: string };

    if (!email || !linkId) {
      return NextResponse.json(
        { error: "email and linkId are required" },
        { status: 400, headers: CORS }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400, headers: CORS }
      );
    }

    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.id, linkId))
      .limit(1);

    if (!link || !link.active) {
      return NextResponse.json(
        { error: "Link not found" },
        { status: 404, headers: CORS }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const country = req.headers.get("cf-ipcountry") ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;
    const now = new Date();

    // Duplicate check — if already captured, silently succeed so the visitor
    // still gets redirected without seeing an error.
    const [existing] = await db
      .select({ id: capturedEmails.id })
      .from(capturedEmails)
      .where(
        and(
          eq(capturedEmails.linkId, link.id),
          eq(capturedEmails.email, email.toLowerCase().trim())
        )
      )
      .limit(1);

    if (!existing) {
      await Promise.all([
        db.insert(capturedEmails).values({
          id: nanoid(),
          linkId: link.id,
          userId: link.userId,
          email: email.toLowerCase().trim(),
          capturedAt: now,
          visitorIp: ip,
          country,
          userAgent,
        }),
        db.insert(analyticsEvents).values({
          id: nanoid(),
          linkId: link.id,
          eventType: "unlock",
          createdAt: now,
          meta: { email: email.toLowerCase().trim(), source: "email_gate" },
        }),
      ]);
    }

    const response = NextResponse.json(
      { destination: link.destination },
      { status: 200, headers: CORS }
    );

    // Cookie lets the Next.js unlock page skip the gate on return visits.
    response.cookies.set(`unlock_unlocked_${link.id}`, "1", {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("[/api/unlock/email]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS }
    );
  }
}
