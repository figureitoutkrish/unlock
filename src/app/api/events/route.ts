import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsEvents, links } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// Valid event types that the Cloudflare Worker can send
const VALID_EVENT_TYPES = new Set([
  "click",
  "unlock",
  "redirect",
  "iab_detected",
  "iab_escaped",
]);

export async function POST(req: NextRequest) {
  // Validate the shared secret sent by the Cloudflare Worker
  const secret = process.env.INTERNAL_SECRET;
  if (secret) {
    const incoming = req.headers.get("x-internal-secret");
    if (incoming !== secret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const { linkId, eventType, meta } = body as {
      linkId?: string;
      eventType?: string;
      meta?: Record<string, unknown>;
    };

    if (!linkId || !eventType) {
      return NextResponse.json(
        { error: "linkId and eventType are required" },
        { status: 400 }
      );
    }

    if (!VALID_EVENT_TYPES.has(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType: ${eventType}` },
        { status: 400 }
      );
    }

    // Verify the link exists
    const [link] = await db
      .select({ id: links.id })
      .from(links)
      .where(eq(links.id, linkId))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    await db.insert(analyticsEvents).values({
      id: nanoid(),
      linkId,
      eventType: eventType as
        | "click"
        | "unlock"
        | "redirect"
        | "iab_detected"
        | "iab_escaped",
      createdAt: new Date(),
      meta: meta ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/events]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
