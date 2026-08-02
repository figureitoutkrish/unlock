"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LinkData {
  id: string;
  label: string | null;
  destination: string;
  unlockMode: string;
  emailGateHeadline: string | null;
  emailGateCta: string | null;
  communityType: string | null;
  communityUrl: string | null;
  communityLabel: string | null;
  active: boolean;
}

export default function EditLinkForm({ link }: { link: LinkData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [label, setLabel] = useState(link.label ?? "");
  const [destination, setDestination] = useState(link.destination);
  const [unlockMode, setUnlockMode] = useState(link.unlockMode);
  const [emailGateHeadline, setEmailGateHeadline] = useState(link.emailGateHeadline ?? "");
  const [emailGateCta, setEmailGateCta] = useState(link.emailGateCta ?? "");
  const [communityType, setCommunityType] = useState(link.communityType ?? "");
  const [communityUrl, setCommunityUrl] = useState(link.communityUrl ?? "");
  const [communityLabel, setCommunityLabel] = useState(link.communityLabel ?? "");
  const [active, setActive] = useState(link.active);

  async function handleSave() {
    if (!destination.trim()) {
      setError("Destination URL is required.");
      return;
    }
    setSaving(true);
    setError("");

    const res = await fetch(`/api/links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.trim() || null,
        destination: destination.trim(),
        unlockMode,
        emailGateHeadline: emailGateHeadline.trim() || null,
        emailGateCta: emailGateCta.trim() || null,
        communityType: communityType.trim() || null,
        communityUrl: communityUrl.trim() || null,
        communityLabel: communityLabel.trim() || null,
        active,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save. Try again.");
    }
  }

  const inputClass =
    "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition";

  const labelClass = "block text-xs font-medium text-gray-600 mb-1.5";

  const MODES = [
    { value: "instant", label: "Instant redirect", desc: "Visitor goes straight to the destination." },
    { value: "email_gate", label: "Email gate", desc: "Collect an email before redirecting." },
    { value: "community_gate", label: "Community gate", desc: "Visitor must join your community first." },
  ];

  return (
    <div className="space-y-5">
      {/* Label */}
      <div>
        <label className={labelClass}>Label (optional)</label>
        <input
          className={inputClass}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="My Instagram link"
        />
      </div>

      {/* Destination */}
      <div>
        <label className={labelClass}>Destination URL</label>
        <input
          className={inputClass}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="https://instagram.com/yourprofile"
        />
      </div>

      {/* Unlock mode */}
      <div>
        <label className={labelClass}>Unlock mode</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setUnlockMode(m.value)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                unlockMode === m.value
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className={`text-xs font-semibold ${unlockMode === m.value ? "text-indigo-700" : "text-gray-700"}`}>
                {m.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Email gate fields */}
      {unlockMode === "email_gate" && (
        <div className="space-y-4 pl-4 border-l-2 border-indigo-100">
          <div>
            <label className={labelClass}>Headline</label>
            <input
              className={inputClass}
              value={emailGateHeadline}
              onChange={(e) => setEmailGateHeadline(e.target.value)}
              placeholder="Enter your email to get access"
            />
          </div>
          <div>
            <label className={labelClass}>Button text</label>
            <input
              className={inputClass}
              value={emailGateCta}
              onChange={(e) => setEmailGateCta(e.target.value)}
              placeholder="Continue →"
            />
          </div>
        </div>
      )}

      {/* Community gate fields */}
      {unlockMode === "community_gate" && (
        <div className="space-y-4 pl-4 border-l-2 border-purple-100">
          <div>
            <label className={labelClass}>Community type</label>
            <select
              className={inputClass}
              value={communityType}
              onChange={(e) => setCommunityType(e.target.value)}
            >
              <option value="">Select…</option>
              <option value="discord">Discord</option>
              <option value="telegram">Telegram</option>
              <option value="slack">Slack</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Join URL</label>
            <input
              className={inputClass}
              value={communityUrl}
              onChange={(e) => setCommunityUrl(e.target.value)}
              placeholder="https://discord.gg/yourserver"
            />
          </div>
          <div>
            <label className={labelClass}>Community name</label>
            <input
              className={inputClass}
              value={communityLabel}
              onChange={(e) => setCommunityLabel(e.target.value)}
              placeholder="My Discord Server"
            />
          </div>
        </div>
      )}

      {/* Active toggle */}
      <div className="flex items-center justify-between py-3 border-t border-gray-50">
        <div>
          <p className="text-sm font-medium text-gray-900">Active</p>
          <p className="text-xs text-gray-400">Inactive links return a 410 error to visitors.</p>
        </div>
        <button
          type="button"
          onClick={() => setActive((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            active ? "bg-indigo-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              active ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          saved
            ? "bg-green-500 text-white"
            : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
        }`}
      >
        {saved ? "✓ Saved" : saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
