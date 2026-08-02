"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UnlockMode = "instant" | "email_gate" | "community_gate";
type CommunityType = "discord" | "telegram" | "whatsapp" | "slack";

const MODES = [
  {
    value: "instant" as UnlockMode,
    label: "Instant redirect",
    description: "No gate. Tracked smart link with in-app browser handling.",
  },
  {
    value: "email_gate" as UnlockMode,
    label: "Email gate",
    description: "Visitor enters their email before being redirected.",
  },
  {
    value: "community_gate" as UnlockMode,
    label: "Community gate",
    description: "Visitor joins your Discord, Telegram, or WhatsApp first.",
  },
];

const COMMUNITY_TYPES: { value: CommunityType; label: string }[] = [
  { value: "discord", label: "Discord" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "slack", label: "Slack" },
];

function SuccessState({ linkId, onReset }: { linkId: string; onReset: () => void }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const unlockUrl =
    (process.env.NEXT_PUBLIC_WORKER_URL
      ? `${process.env.NEXT_PUBLIC_WORKER_URL}/${linkId}`
      : `${window.location.origin}/unlock/${linkId}`);

  async function handleCopy() {
    await navigator.clipboard.writeText(unlockUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Link created!</h2>
        <p className="text-sm text-gray-500 mb-6">
          Share this link anywhere. Every click is tracked.
        </p>

        {/* Link display */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
            Your unlock link
          </p>
          <p className="text-sm font-mono text-gray-700 break-all">{unlockUrl}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
              copied
                ? "bg-green-100 text-green-700"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy link
              </>
            )}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            Go to dashboard →
          </button>
        </div>

        <button
          onClick={onReset}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Create another link
        </button>
      </div>
    </div>
  );
}

export default function NewLinkPage() {
  const [mode, setMode] = useState<UnlockMode>("instant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    destination: "",
    label: "",
    emailHeadline: "",
    emailCta: "",
    communityType: "discord" as CommunityType,
    communityUrl: "",
    communityLabel: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: form.destination,
          label: form.label || null,
          unlockMode: mode,
          emailGateHeadline: form.emailHeadline || null,
          emailGateCta: form.emailCta || null,
          communityType: mode === "community_gate" ? form.communityType : null,
          communityUrl: mode === "community_gate" ? form.communityUrl : null,
          communityLabel: mode === "community_gate" ? form.communityLabel || null : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create link");
      setCreatedId(data.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setLoading(false);
    }
  }

  if (createdId) {
    return (
      <SuccessState
        linkId={createdId}
        onReset={() => {
          setCreatedId(null);
          setLoading(false);
          setForm({
            destination: "",
            label: "",
            emailHeadline: "",
            emailCta: "",
            communityType: "discord",
            communityUrl: "",
            communityLabel: "",
          });
        }}
      />
    );
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition";

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to links
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Create a new link</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Destination URL <span className="text-red-400">*</span>
          </label>
          <input
            type="url"
            required
            value={form.destination}
            onChange={(e) => set("destination", e.target.value)}
            placeholder="https://example.com/your-content"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Label <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="e.g. Free course download"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unlock mode
          </label>
          <div className="space-y-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                  mode === m.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className={`text-sm font-semibold ${mode === m.value ? "text-indigo-700" : "text-gray-800"}`}>
                  {m.label}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">{m.description}</span>
              </button>
            ))}
          </div>
        </div>

        {mode === "email_gate" && (
          <div className="space-y-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <h3 className="text-sm font-semibold text-indigo-800">Email gate settings</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Headline</label>
              <input
                type="text"
                value={form.emailHeadline}
                onChange={(e) => set("emailHeadline", e.target.value)}
                placeholder="Enter your email to continue"
                className="w-full px-4 py-2.5 rounded-lg border border-indigo-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Button text</label>
              <input
                type="text"
                value={form.emailCta}
                onChange={(e) => set("emailCta", e.target.value)}
                placeholder="Unlock"
                className="w-full px-4 py-2.5 rounded-lg border border-indigo-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
        )}

        {mode === "community_gate" && (
          <div className="space-y-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <h3 className="text-sm font-semibold text-purple-800">Community gate settings</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Platform</label>
              <div className="grid grid-cols-4 gap-2">
                {COMMUNITY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("communityType", t.value)}
                    className={`py-2 rounded-lg text-xs font-semibold border-2 transition-colors ${
                      form.communityType === t.value
                        ? "border-purple-500 bg-purple-100 text-purple-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Invite URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={form.communityUrl}
                onChange={(e) => set("communityUrl", e.target.value)}
                placeholder="https://discord.gg/yourserver"
                className="w-full px-4 py-2.5 rounded-lg border border-purple-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Instructions <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.communityLabel}
                onChange={(e) => set("communityLabel", e.target.value)}
                placeholder="Join our Discord to unlock exclusive content"
                className="w-full px-4 py-2.5 rounded-lg border border-purple-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.destination}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          {loading ? "Creating…" : "Create link"}
        </button>
      </form>
    </div>
  );
}
