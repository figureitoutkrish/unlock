"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Goal = "email_gate" | "community_gate" | "instant";
type Step = 1 | 2 | 3 | 4;

// ─── Illustrations ────────────────────────────────────────────────────────────

function IllustrationWelcome() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-36 mx-auto">
      {/* Glow */}
      <ellipse cx="100" cy="130" rx="60" ry="10" fill="#e0e7ff" />
      {/* Chain link left */}
      <rect x="38" y="62" width="44" height="28" rx="14" fill="#6366f1" />
      <rect x="48" y="72" width="24" height="8" rx="4" fill="#e0e7ff" />
      {/* Chain link right */}
      <rect x="118" y="62" width="44" height="28" rx="14" fill="#818cf8" />
      <rect x="128" y="72" width="24" height="8" rx="4" fill="#e0e7ff" />
      {/* Connector */}
      <rect x="78" y="72" width="44" height="8" rx="4" fill="#a5b4fc" />
      {/* Sparkles */}
      <circle cx="60" cy="42" r="4" fill="#fbbf24" />
      <circle cx="140" cy="42" r="3" fill="#34d399" />
      <circle cx="100" cy="30" r="5" fill="#f472b6" />
      <circle cx="78" cy="50" r="2.5" fill="#60a5fa" />
      <circle cx="122" cy="50" r="2.5" fill="#f87171" />
      {/* Star lines */}
      <line x1="60" y1="36" x2="60" y2="30" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
      <line x1="54" y1="42" x2="48" y2="42" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
      <line x1="66" y1="42" x2="72" y2="42" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
      <line x1="100" y1="22" x2="100" y2="16" stroke="#f472b6" strokeWidth="2" strokeLinecap="round"/>
      <line x1="94" y1="30" x2="88" y2="30" stroke="#f472b6" strokeWidth="2" strokeLinecap="round"/>
      <line x1="106" y1="30" x2="112" y2="30" stroke="#f472b6" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IllustrationEmail() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
      <rect width="80" height="80" rx="20" fill="#e0e7ff"/>
      <rect x="16" y="24" width="48" height="34" rx="6" fill="#6366f1"/>
      <path d="M16 30 L40 46 L64 30" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IllustrationCommunity() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
      <rect width="80" height="80" rx="20" fill="#f3e8ff"/>
      <circle cx="30" cy="32" r="10" fill="#a855f7"/>
      <circle cx="50" cy="32" r="10" fill="#9333ea"/>
      <ellipse cx="28" cy="58" rx="14" ry="9" fill="#c084fc"/>
      <ellipse cx="52" cy="58" rx="14" ry="9" fill="#a855f7"/>
    </svg>
  );
}

function IllustrationInstant() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
      <rect width="80" height="80" rx="20" fill="#dcfce7"/>
      <polygon points="28,16 28,64 64,40" fill="#22c55e"/>
    </svg>
  );
}

function ConfettiDot({ x, color, delay, size }: { x: number; color: string; delay: number; size: number }) {
  return (
    <div
      className="absolute top-0 rounded-full animate-bounce"
      style={{
        left: `${x}%`,
        width: size,
        height: size,
        backgroundColor: color,
        animationDelay: `${delay}ms`,
        animationDuration: `${600 + delay}ms`,
        opacity: 0.85,
      }}
    />
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center flex flex-col items-center gap-6">
      <div className="animate-pulse">
        <IllustrationWelcome />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Unlock 👋</h1>
        <p className="text-gray-500 text-base max-w-xs mx-auto leading-relaxed">
          Every link you share can now <strong className="text-gray-700">do something</strong> — capture an email, grow your community, or just track clicks.
        </p>
      </div>
      <div className="flex flex-col gap-3 text-sm text-gray-400 w-full max-w-xs">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-xl">🔗</span>
          <span>Paste any destination URL</span>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-xl">⚡</span>
          <span>Choose what happens before the redirect</span>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-xl">📊</span>
          <span>Track every click and unlock in real time</span>
        </div>
      </div>
      <button
        onClick={onNext}
        className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
      >
        Let's go →
      </button>
    </div>
  );
}

function StepGoal({ onSelect }: { onSelect: (goal: Goal) => void }) {
  const [selected, setSelected] = useState<Goal | null>(null);

  const goals: { value: Goal; label: string; sub: string; illustration: React.ReactNode; selectedBorder: string; selectedBg: string }[] = [
    {
      value: "email_gate",
      label: "Grow my email list",
      sub: "Visitors enter their email before being redirected. You capture a subscriber.",
      illustration: <IllustrationEmail />,
      selectedBorder: "border-indigo-500",
      selectedBg: "bg-indigo-50",
    },
    {
      value: "community_gate",
      label: "Build my community",
      sub: "Visitors join your Discord, Telegram, or WhatsApp before they continue.",
      illustration: <IllustrationCommunity />,
      selectedBorder: "border-purple-500",
      selectedBg: "bg-purple-50",
    },
    {
      value: "instant",
      label: "Just track clicks",
      sub: "No gate. A smart tracked link that handles in-app browsers automatically.",
      illustration: <IllustrationInstant />,
      selectedBorder: "border-green-500",
      selectedBg: "bg-green-50",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">What&apos;s your goal?</h1>
        <p className="text-gray-500 text-sm">Pick one — you can always change it later.</p>
      </div>
      <div className="flex flex-col gap-3">
        {goals.map((g) => {
          const isSelected = selected === g.value;
          return (
            <button
              key={g.value}
              onClick={() => setSelected(g.value)}
              className={`flex items-center gap-4 text-left px-5 py-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? `${g.selectedBorder} ${g.selectedBg}`
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {g.illustration}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{g.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{g.sub}</p>
              </div>
              <div className={`ml-auto flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected ? "border-current bg-current" : "border-gray-300"
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => selected && onSelect(selected)}
        disabled={!selected}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-colors text-base"
      >
        Next →
      </button>
    </div>
  );
}

function StepCreate({ goal, onComplete }: { goal: Goal; onComplete: (id: string) => void }) {
  const [destination, setDestination] = useState("");
  const [label, setLabel] = useState("");
  const [headline, setHeadline] = useState("");
  const [cta, setCta] = useState("");
  const [communityType, setCommunityType] = useState("discord");
  const [communityUrl, setCommunityUrl] = useState("");
  const [communityLabel, setCommunityLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tips: Record<Goal, string> = {
    email_gate: "💡 Tip: A clear headline like \"Get the free template\" converts much better than a generic one.",
    community_gate: "💡 Tip: Paste your Discord/Telegram invite link. Make sure it doesn't expire.",
    instant: "💡 Tip: Great for your bio link. Every click is tracked and IAB visitors are handled automatically.",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          label: label || null,
          unlockMode: goal,
          emailGateHeadline: headline || null,
          emailGateCta: cta || null,
          communityType: goal === "community_gate" ? communityType : null,
          communityUrl: goal === "community_gate" ? communityUrl : null,
          communityLabel: goal === "community_gate" ? communityLabel || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create link");
      onComplete(data.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your first link</h1>
        <p className="text-gray-500 text-sm">Almost there — just fill in the details below.</p>
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Where should visitors end up? <span className="text-red-400">*</span>
        </label>
        <input
          type="url"
          required
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="https://your-content.com"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Give it a name <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Free course download"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Email gate fields */}
      {goal === "email_gate" && (
        <div className="space-y-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Email gate</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Headline shown to visitors</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Enter your email to continue"
              className="w-full px-4 py-2.5 rounded-lg border border-indigo-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Button text</label>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Unlock"
              className="w-full px-4 py-2.5 rounded-lg border border-indigo-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Community gate fields */}
      {goal === "community_gate" && (
        <div className="space-y-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Community gate</p>
          <div className="flex gap-2">
            {["discord", "telegram", "whatsapp"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCommunityType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize border-2 transition-colors ${
                  communityType === t
                    ? "border-purple-500 bg-purple-100 text-purple-700"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Invite URL <span className="text-red-400">*</span></label>
            <input
              type="url"
              required
              value={communityUrl}
              onChange={(e) => setCommunityUrl(e.target.value)}
              placeholder="https://discord.gg/yourserver"
              className="w-full px-4 py-2.5 rounded-lg border border-purple-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Instructions <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={communityLabel}
              onChange={(e) => setCommunityLabel(e.target.value)}
              placeholder="Join our Discord to unlock exclusive content"
              className="w-full px-4 py-2.5 rounded-lg border border-purple-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      {/* Tip */}
      <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
        {tips[goal]}
      </p>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !destination}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
      >
        {loading ? "Creating your link…" : "Create my link →"}
      </button>
    </form>
  );
}

function StepSuccess({ linkId, onDone }: { linkId: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const unlockUrl = `${window.location.origin}/unlock/${linkId}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(unlockUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const confetti = [
    { x: 10, color: "#6366f1", delay: 0, size: 10 },
    { x: 25, color: "#f472b6", delay: 150, size: 8 },
    { x: 40, color: "#34d399", delay: 100, size: 12 },
    { x: 55, color: "#fbbf24", delay: 50, size: 9 },
    { x: 70, color: "#60a5fa", delay: 200, size: 11 },
    { x: 85, color: "#f87171", delay: 75, size: 8 },
    { x: 20, color: "#a78bfa", delay: 180, size: 7 },
    { x: 60, color: "#fb923c", delay: 120, size: 10 },
    { x: 90, color: "#4ade80", delay: 250, size: 8 },
  ];

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Confetti */}
      <div className="relative w-full h-16 overflow-hidden">
        {confetti.map((c, i) => (
          <ConfettiDot key={i} {...c} />
        ))}
      </div>

      <div>
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your link is live!</h1>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Share it anywhere — Instagram bio, newsletter, tweet. Every click is tracked.
        </p>
      </div>

      {/* Link card */}
      <div className="w-full max-w-sm bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
        <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-2">Your unlock link</p>
        <p className="text-sm font-mono text-gray-700 break-all mb-3">{unlockUrl}</p>
        <button
          onClick={handleCopy}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {copied ? "✓ Copied!" : "Copy link"}
        </button>
      </div>

      <button
        onClick={onDone}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Go to dashboard →
      </button>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const pct = ((step - 1) / 3) * 100;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
      <div
        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [goal, setGoal] = useState<Goal>("instant");
  const [createdId, setCreatedId] = useState("");

  function handleGoalSelect(g: Goal) {
    setGoal(g);
    setStep(3);
  }

  function handleLinkCreated(id: string) {
    setCreatedId(id);
    setStep(4);
  }

  function handleDone() {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {step < 4 && <ProgressBar step={step} />}

        {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
        {step === 2 && <StepGoal onSelect={handleGoalSelect} />}
        {step === 3 && <StepCreate goal={goal} onComplete={handleLinkCreated} />}
        {step === 4 && <StepSuccess linkId={createdId} onDone={handleDone} />}

        {step === 3 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Change goal
            </button>
            <button
              onClick={handleDone}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
