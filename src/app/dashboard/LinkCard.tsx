"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LinkData {
  id: string;
  label: string | null;
  destination: string;
  unlockMode: string;
  active: boolean;
  clicks: number;
  unlocks: number;
}

const MODE_CONFIG: Record<string, { label: string; color: string }> = {
  instant: { label: "Instant", color: "bg-green-100 text-green-700" },
  email_gate: { label: "Email Gate", color: "bg-indigo-100 text-indigo-700" },
  community_gate: { label: "Community Gate", color: "bg-purple-100 text-purple-700" },
};

export default function LinkCard({
  link,
  shortUrl,
}: {
  link: LinkData;
  shortUrl: string | null;
}) {
  const router = useRouter();
  const [active, setActive] = useState(link.active);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const modeConfig = MODE_CONFIG[link.unlockMode] ?? MODE_CONFIG.instant;
  const displayName = link.label || link.destination;
  // Always have a usable URL — prefer the Worker short URL, fall back to Next.js unlock page
  const copyTarget = shortUrl ?? `${window.location.origin}/unlock/${link.id}`;
  const displayUrl = shortUrl ?? `/unlock/${link.id}`;

  async function handleToggleActive() {
    const next = !active;
    setActive(next);
    await fetch(`/api/links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/links/${link.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(copyTarget).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`bg-white rounded-2xl border transition-all ${active ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${modeConfig.color}`}>
              {modeConfig.label}
            </span>
            {!active && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                Inactive
              </span>
            )}
          </div>
          <p className="font-medium text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{link.destination}</p>
          <p className="text-xs text-indigo-500 font-mono mt-1 truncate">{displayUrl}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 sm:flex-shrink-0">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{link.clicks}</p>
            <p className="text-xs text-gray-400">clicks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{link.unlocks}</p>
            <p className="text-xs text-gray-400">unlocks</p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t border-gray-50 px-5 py-2.5 flex items-center gap-1">
        {/* Details */}
        <Link
          href={`/dashboard/links/${link.id}`}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Details
        </Link>

        {/* Copy */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy link
            </>
          )}
        </button>

        {/* Toggle active */}
        <button
          onClick={handleToggleActive}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={active
              ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            } />
          </svg>
          {active ? "Deactivate" : "Activate"}
        </button>

        {/* Delete */}
        <div className="ml-auto">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
