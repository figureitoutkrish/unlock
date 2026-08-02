import { headers } from "next/headers";
import { db } from "@/db";
import { links } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import CopyLink from "./CopyLink";

interface PageProps {
  params: Promise<{ id: string }>;
}

type Platform = "instagram" | "tiktok" | "facebook" | "generic";

function detectPlatform(ua: string): Platform {
  if (/Instagram/i.test(ua)) return "instagram";
  if (/musical_ly|TikTok/i.test(ua)) return "tiktok";
  if (/FBAN|FBAV/i.test(ua)) return "facebook";
  return "generic";
}

const INSTRUCTIONS: Record<
  Platform,
  { app: string; icon: string; steps: string[] }
> = {
  instagram: {
    app: "Instagram",
    icon: "📷",
    steps: [
      "Tap the three dots (⋯) in the top-right corner of the screen",
      'Select "Open in browser" from the menu',
      "The page will open in Chrome or Safari",
    ],
  },
  tiktok: {
    app: "TikTok",
    icon: "🎵",
    steps: [
      "Tap the three dots (···) in the top-right corner of the screen",
      'Tap "Open in browser"',
      "The page will open in your default browser",
    ],
  },
  facebook: {
    app: "Facebook",
    icon: "👥",
    steps: [
      "Tap the three dots (···) in the top-right corner of the screen",
      'Tap "Open in external browser"',
      "The page will open in Chrome or Safari",
    ],
  },
  generic: {
    app: "your app",
    icon: "🌐",
    steps: [
      "Look for a menu icon (⋯ or ···) at the top of the screen",
      'Tap "Open in browser", "Open in Chrome", or "Open in Safari"',
      "If you don't see that option, copy the link below and paste it into Chrome or Safari",
    ],
  },
};

export default async function IABPage({ params }: PageProps) {
  const { id } = await params;
  const headersList = await headers();
  const ua = headersList.get("user-agent") ?? "";

  const [link] = await db
    .select()
    .from(links)
    .where(eq(links.id, id))
    .limit(1);

  if (!link || !link.active) notFound();

  const platform = detectPlatform(ua);
  const { app, icon, steps } = INSTRUCTIONS[platform];

  // The URL visitor should open in their real browser
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const linkUrl = `${appUrl}/unlock/${id}`;

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">
            {icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
            Open in Chrome or Safari
          </h1>
          <p className="text-gray-500 text-sm">
            {platform === "generic"
              ? "This link needs to open in a real browser to work properly."
              : `${app}'s built-in browser doesn't support this page.`}{" "}
            Follow the steps below.
          </p>
        </div>

        {/* Steps */}
        <ol className="space-y-4 mb-8">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold mt-0.5">
                {i + 1}
              </span>
              <span className="text-gray-700 text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        {/* Copy link */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2.5">
            Or copy this link
          </p>
          <CopyLink url={linkUrl} />
        </div>

        <p className="text-center text-xs text-gray-400">
          Paste the link into the address bar of Chrome or Safari.
        </p>

        {/* Watermark */}
        <p className="mt-10 text-center text-xs text-gray-300">
          Powered by{" "}
          <span className="font-medium text-gray-400">Unlock</span>
        </p>
      </div>
    </main>
  );
}
