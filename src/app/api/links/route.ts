import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { links } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { writeToKV } from "@/lib/kv";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      destination,
      label,
      unlockMode,
      emailGateHeadline,
      emailGateCta,
      communityType,
      communityUrl,
      communityLabel,
    } = body;

    if (!destination) {
      return NextResponse.json({ error: "destination is required" }, { status: 400 });
    }

    const id = nanoid(8);
    const now = new Date();

    await db.insert(links).values({
      id,
      userId,
      destination,
      label: label ?? null,
      unlockMode: unlockMode ?? "instant",
      emailGateHeadline: emailGateHeadline ?? null,
      emailGateCta: emailGateCta ?? null,
      communityType: communityType ?? null,
      communityUrl: communityUrl ?? null,
      communityLabel: communityLabel ?? null,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    // Write to Cloudflare KV so the redirect engine can serve it
    await writeToKV({
      id,
      userId,
      destination,
      unlockMode: unlockMode ?? "instant",
      emailGateHeadline: emailGateHeadline ?? null,
      communityType: communityType ?? null,
      communityUrl: communityUrl ?? null,
      communityLabel: communityLabel ?? null,
      active: true,
    });

    return NextResponse.json({ id, destination, unlockMode });
  } catch (err) {
    console.error("[POST /api/links]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userLinks = await db
      .select()
      .from(links)
      .where(eq(links.userId, userId))
      .orderBy(desc(links.createdAt));

    return NextResponse.json(userLinks);
  } catch (err) {
    console.error("[GET /api/links]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
