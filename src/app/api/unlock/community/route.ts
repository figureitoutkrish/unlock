import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { links, analyticsEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { linkId } = body as { linkId?: string };

    if (!linkId) {
      return NextResponse.json({ error: "linkId is required" }, { status: 400 });
    }

    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.id, linkId))
      .limit(1);

    if (!link || !link.active) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (link.unlockMode !== "community_gate") {
      return NextResponse.json({ error: "Not a community gate link" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const country = req.headers.get("cf-ipcountry") ?? null;

    await db.insert(analyticsEvents).values({
      id: nanoid(),
      linkId: link.id,
      eventType: "unlock",
      createdAt: new Date(),
      meta: { source: "community_gate", country, ip },
    });

    const response = NextResponse.json({ destination: link.destination });

    // Cookie so return visits skip the gate
    response.cookies.set(`unlock_unlocked_${link.id}`, "1", {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("[/api/unlock/community]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
