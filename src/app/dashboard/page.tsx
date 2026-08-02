import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { links, users, analyticsEvents } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import LinkCard from "./LinkCard";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Sync user to our DB on first load
  const clerkUser = await currentUser();
  if (clerkUser) {
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    await db
      .insert(users)
      .values({ id: userId, email, plan: "free", createdAt: new Date() })
      .onConflictDoNothing();
  }

  // Fetch links with click + unlock counts
  const userLinks = await db
    .select({
      id: links.id,
      label: links.label,
      destination: links.destination,
      unlockMode: links.unlockMode,
      active: links.active,
      createdAt: links.createdAt,
      clicks: sql<number>`cast(count(case when ${analyticsEvents.eventType} = 'click' then 1 end) as int)`,
      unlocks: sql<number>`cast(count(case when ${analyticsEvents.eventType} = 'unlock' then 1 end) as int)`,
    })
    .from(links)
    .leftJoin(analyticsEvents, eq(analyticsEvents.linkId, links.id))
    .where(eq(links.userId, userId))
    .groupBy(
      links.id,
      links.label,
      links.destination,
      links.unlockMode,
      links.active,
      links.createdAt
    )
    .orderBy(desc(links.createdAt));

  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL ?? "";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Links</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {userLinks.length} link{userLinks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/links/new"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New link
        </Link>
      </div>

      {/* Empty state */}
      {userLinks.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-4">🔗</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No links yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
            Create your first smart link to start capturing emails and growing your audience.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Quick setup →
            </Link>
            <Link
              href="/dashboard/links/new"
              className="inline-flex items-center justify-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              Create manually
            </Link>
          </div>
        </div>
      )}

      {/* Link cards */}
      {userLinks.length > 0 && (
        <div className="space-y-3">
          {userLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              shortUrl={workerUrl ? `${workerUrl}/${link.id}` : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
