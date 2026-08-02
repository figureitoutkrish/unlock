import { db } from "@/db";
import { links } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import EmailGateForm from "./EmailGateForm";
import CommunityGateForm from "./CommunityGateForm";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const [link] = await db.select().from(links).where(eq(links.id, id)).limit(1);
  if (!link) return { title: "Link not found" };

  const title =
    link.unlockMode === "email_gate"
      ? link.emailGateHeadline ?? "Enter your email to continue"
      : link.unlockMode === "community_gate"
      ? `Join to unlock content`
      : link.label ?? "Unlock";

  return {
    title,
    description: "Powered by Unlock — smart links for creators.",
    robots: { index: false },
  };
}

export default async function UnlockPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { mode } = await searchParams;

  const [link] = await db.select().from(links).where(eq(links.id, id)).limit(1);

  if (!link || !link.active) notFound();

  // Instant links: redirect immediately — this page is only reached when
  // someone uses the Next.js URL directly instead of the Worker.
  if (link.unlockMode === "instant") {
    redirect(link.destination);
  }

  if (link.unlockMode === "community_gate" || mode === "community") {
    return (
      <CommunityGateForm
        linkId={link.id}
        communityType={link.communityType}
        communityUrl={link.communityUrl}
        communityLabel={link.communityLabel}
        destination={link.destination}
      />
    );
  }

  // email_gate (default)
  return (
    <EmailGateForm
      linkId={link.id}
      headline={link.emailGateHeadline}
      cta={link.emailGateCta}
    />
  );
}
