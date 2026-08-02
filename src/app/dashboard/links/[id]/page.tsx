import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { links, capturedEmails, analyticsEvents } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import EditLinkForm from "./EditLinkForm";
import EmailsTable from "./EmailsTable";
import CopyButton from "./CopyButton";

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const [link] = await db
    .select()
    .from(links)
    .where(and(eq(links.id, id), eq(links.userId, userId)))
    .limit(1);

  if (!link) notFound();

  const [stats] = await db
    .select({
      clicks: sql<number>`cast(count(case when ${analyticsEvents.eventType} = 'click' then 1 end) as int)`,
      unlocks: sql<number>`cast(count(case when ${analyticsEvents.eventType} = 'unlock' then 1 end) as int)`,
      redirects: sql<number>`cast(count(case when ${analyticsEvents.eventType} = 'redirect' then 1 end) as int)`,
    })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.linkId, id));

  const rawEmails = link.unlockMode === "email_gate"
    ? await db
        .select({
          id: capturedEmails.id,
          email: capturedEmails.email,
          country: capturedEmails.country,
          capturedAt: capturedEmails.capturedAt,
        })
        .from(capturedEmails)
        .where(eq(capturedEmails.linkId, id))
        .orderBy(capturedEmails.capturedAt)
    : [];

  // Serialize dates — Next.js cannot pass Date objects from server to client components
  const emails = rawEmails.map((e) => ({
    ...e,
    capturedAt: e.capturedAt.toISOString(),
  }));

  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL ?? "";
  const unlockUrl = workerUrl
    ? `${workerUrl}/${link.id}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/unlock/${link.id}`;

  // Contextual stats per mode
  const conversionRate =
    stats.clicks > 0 ? Math.round((stats.unlocks / stats.clicks) * 100) : null;

  const statCards = (() => {
    if (link.unlockMode === "instant") {
      return [
        { label: "Total clicks", value: stats.clicks },
        { label: "Redirected", value: stats.redirects },
      ];
    }
    if (link.unlockMode === "email_gate") {
      return [
        { label: "Total clicks", value: stats.clicks },
        { label: "Emails captured", value: emails.length },
        {
          label: "Conversion rate",
          value: conversionRate !== null ? `${conversionRate}%` : "—",
        },
      ];
    }
    if (link.unlockMode === "community_gate") {
      return [
        { label: "Total clicks", value: stats.clicks },
        { label: "Joins", value: stats.unlocks },
        {
          label: "Join rate",
          value: conversionRate !== null ? `${conversionRate}%` : "—",
        },
      ];
    }
    return [{ label: "Total clicks", value: stats.clicks }];
  })();

  const MODE_CONFIG: Record<string, { label: string; color: string }> = {
    instant: { label: "Instant", color: "bg-green-100 text-green-700" },
    email_gate: { label: "Email Gate", color: "bg-indigo-100 text-indigo-700" },
    community_gate: { label: "Community Gate", color: "bg-purple-100 text-purple-700" },
  };
  const modeConfig = MODE_CONFIG[link.unlockMode] ?? MODE_CONFIG.instant;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${modeConfig.color}`}>
                {modeConfig.label}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${link.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                {link.active ? "Active" : "Inactive"}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {link.label || link.destination}
            </h1>
            <p className="text-sm text-gray-400 truncate mt-0.5">{link.destination}</p>
          </div>
        </div>

        {/* Short URL row */}
        <div className="mt-4 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">Your link</p>
            <p className="text-sm font-mono text-gray-700 truncate">{unlockUrl}</p>
          </div>
          <CopyButton text={unlockUrl} />
        </div>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 mb-5 ${statCards.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Emails section — email gate links only */}
      {link.unlockMode === "email_gate" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Captured emails</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {emails.length === 0
                  ? "No emails yet — share your link to start collecting."
                  : `${emails.length} email${emails.length !== 1 ? "s" : ""} collected`}
              </p>
            </div>
            {emails.length > 0 && (
              <a
                href={`/api/links/${id}/emails.csv`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </a>
            )}
          </div>
          <EmailsTable emails={emails} />
        </div>
      )}

      {/* Edit form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900">Edit link</h2>
          <p className="text-xs text-gray-400 mt-0.5">Changes are reflected immediately for new visitors.</p>
        </div>
        <EditLinkForm link={link} />
      </div>
    </div>
  );
}
