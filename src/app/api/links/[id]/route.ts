import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { links } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { writeToKV, deleteFromKV } from "@/lib/kv";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Only allow updating safe fields
  const allowed = [
    "label",
    "destination",
    "active",
    "unlockMode",
    "emailGateHeadline",
    "emailGateCta",
    "communityType",
    "communityUrl",
    "communityLabel",
  ] as const;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  try {
    const [updated] = await db
      .update(links)
      .set(updates)
      .where(and(eq(links.id, id), eq(links.userId, userId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Keep KV in sync with the updated link
    await writeToKV({
      id: updated.id,
      userId: updated.userId,
      destination: updated.destination,
      unlockMode: updated.unlockMode,
      emailGateHeadline: updated.emailGateHeadline ?? null,
      communityType: updated.communityType ?? null,
      communityUrl: updated.communityUrl ?? null,
      communityLabel: updated.communityLabel ?? null,
      active: updated.active,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/links/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(links)
      .where(and(eq(links.id, id), eq(links.userId, userId)))
      .returning({ id: links.id });

    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Remove from KV so the redirect engine stops serving it
    await deleteFromKV(id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/links/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
