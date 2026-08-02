"use client";

import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input text
      const input = document.getElementById("copy-url-input") as HTMLInputElement;
      input?.select();
    }
  }

  return (
    <div className="flex gap-2">
      <input
        id="copy-url-input"
        type="text"
        readOnly
        value={url}
        className="flex-1 min-w-0 px-3 py-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg focus:outline-none select-all"
        onFocus={(e) => e.target.select()}
      />
      <button
        onClick={handleCopy}
        className="flex-shrink-0 px-3 py-2 bg-gray-900 hover:bg-gray-700 active:bg-black text-white text-xs font-medium rounded-lg transition-colors"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
