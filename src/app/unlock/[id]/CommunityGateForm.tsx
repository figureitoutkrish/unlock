"use client";

import { useState } from "react";

const COMMUNITY_ICONS: Record<string, string> = {
  discord: "🎮",
  telegram: "✈️",
  whatsapp: "💬",
  slack: "💼",
};

interface Props {
  linkId: string;
  communityType: string | null;
  communityUrl: string | null;
  communityLabel: string | null;
  destination: string;
}

export default function CommunityGateForm({
  linkId,
  communityType,
  communityUrl,
  communityLabel,
  destination,
}: Props) {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const type = communityType?.toLowerCase() ?? "";
  const name = communityType
    ? communityType.charAt(0).toUpperCase() + communityType.slice(1)
    : "Community";
  const icon = COMMUNITY_ICONS[type] ?? "🔗";
  const label = communityLabel ?? `Join our ${name} to get access to this content.`;

  function handleJoin() {
    if (communityUrl) {
      window.open(communityUrl, "_blank", "noopener,noreferrer");
      setJoined(true);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/unlock/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
      });
      const data = await res.json();
      if (res.ok && data.destination) {
        window.location.href = data.destination;
      } else {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">
            {icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
            Join to unlock this content
          </h1>
          <p className="text-gray-500 text-sm">{label}</p>
        </div>

        <div className="space-y-3">
          {communityUrl && (
            <button
              onClick={handleJoin}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3.5 rounded-xl transition-colors text-base"
            >
              Join {name}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}

          <button
            onClick={handleConfirm}
            disabled={!joined || loading}
            className="flex items-center justify-center w-full border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium py-3.5 rounded-xl transition-colors text-sm"
          >
            {loading ? "Confirming…" : "I've joined — continue to content →"}
          </button>

          {!joined && communityUrl && (
            <p className="text-center text-xs text-gray-400">
              Click &ldquo;Join {name}&rdquo; first, then confirm above.
            </p>
          )}

          {error && <p className="text-center text-sm text-red-500">{error}</p>}
        </div>

        <p className="mt-10 text-center text-xs text-gray-300">
          Powered by <span className="font-medium text-gray-400">Unlock</span>
        </p>
      </div>
    </main>
  );
}
