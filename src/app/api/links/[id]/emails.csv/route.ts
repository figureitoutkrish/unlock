import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { links, capturedEmails } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  // Verify ownership
  const [link] = await db
    .select({ id: links.id, label: links.label })
    .from(links)
    .where(and(eq(links.id, id), eq(links.userId, userId)))
    .limit(1);

  if (!link) return new NextResponse("Not found", { status: 404 });

  const emails = await db
    .select({
      email: capturedEmails.email,
      country: capturedEmails.country,
      capturedAt: capturedEmails.capturedAt,
    })
    .from(capturedEmails)
    .where(eq(capturedEmails.linkId, id))
    .orderBy(capturedEmails.capturedAt);

  const rows = [
    ["email", "country", "captured_at"],
    ...emails.map((e) => [
      e.email,
      e.country ?? "",
      new Date(e.capturedAt).toISOString(),
    ]),
  ];

  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");

  const filename = `${(link.label ?? id).replace(/[^a-z0-9]/gi, "_")}_emails.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
