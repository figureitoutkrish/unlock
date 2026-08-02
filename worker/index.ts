export interface Env {
  LINKS_KV: KVNamespace;
  APP_BASE_URL: string;
  INTERNAL_SECRET: string;
}

const IAB_PATTERNS: Record<string, RegExp> = {
  instagram: /Instagram/i,
  tiktok: /BytedanceWebview|musical_ly/i,
  facebook: /FBAN|FBAV|FB_IAB/i,
};

function detectIAB(userAgent: string): string | null {
  for (const [name, pattern] of Object.entries(IAB_PATTERNS)) {
    if (pattern.test(userAgent)) return name;
  }
  return null;
}

function hasUnlockedCookie(request: Request, linkId: string): boolean {
  const cookieHeader = request.headers.get("Cookie") || "";
  return cookieHeader.includes(`unlock_unlocked_${linkId}=1`);
}

async function logEvent(
  appBaseUrl: string,
  secret: string,
  linkId: string,
  eventType: string,
  meta: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(`${appBaseUrl}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": secret,
      },
      body: JSON.stringify({ linkId, eventType, meta }),
    });
  } catch {
    // never break a redirect because of a logging failure
  }
}

function iabEscapeHtml(iab: string, destination: string): string {
  const browserName =
    iab === "facebook" ? "Facebook" : iab === "tiktok" ? "TikTok" : "Instagram";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Open in Browser</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #f8f8f8;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; padding: 24px; }
    .card { background: white; border-radius: 16px; padding: 32px 24px;
            max-width: 360px; width: 100%; text-align: center;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h1 { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 8px; }
    p { font-size: 15px; color: #555; line-height: 1.5; margin-bottom: 24px; }
    .steps { text-align: left; background: #f4f4f4; border-radius: 10px;
             padding: 16px; margin-bottom: 24px; }
    .step { font-size: 14px; color: #333; padding: 4px 0; }
    .badge { display: inline-block; background: #111; color: white; font-size: 12px;
             font-weight: 600; border-radius: 50%; width: 20px; height: 20px;
             line-height: 20px; text-align: center; margin-right: 8px; }
    small { font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Open in your browser</h1>
    <p>You're inside ${browserName}'s built-in browser. For the best experience, open this link in Chrome or Safari.</p>
    <div class="steps">
      <div class="step"><span class="badge">1</span>Tap the <strong>⋯</strong> menu (top right)</div>
      <div class="step" style="margin-top:8px"><span class="badge">2</span>Tap <strong>"Open in browser"</strong></div>
    </div>
    <small>Or copy this link: ${destination}</small>
  </div>
</body>
</html>`;
}

function emailGateHtml(linkId: string, headline: string, appBaseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headline}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #f8f8f8;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; padding: 24px; }
    .card { background: white; border-radius: 16px; padding: 32px 24px;
            max-width: 360px; width: 100%; text-align: center;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h1 { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 8px; }
    p { font-size: 15px; color: #555; margin-bottom: 24px; }
    input { width: 100%; padding: 14px 16px; border: 1.5px solid #ddd;
            border-radius: 10px; font-size: 16px; outline: none; margin-bottom: 12px; }
    input:focus { border-color: #111; }
    button { width: 100%; padding: 14px; background: #111; color: white;
             border: none; border-radius: 10px; font-size: 16px;
             font-weight: 600; cursor: pointer; }
    small { display: block; margin-top: 16px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${headline}</h1>
    <p>Enter your email to continue.</p>
    <input type="email" id="email" placeholder="you@example.com" autofocus />
    <p id="err" style="color:#ef4444;font-size:13px;min-height:18px;margin-bottom:4px"></p>
    <button id="btn" onclick="submit()">Continue →</button>
    <small>Powered by Unlock</small>
  </div>
  <script>
    async function submit() {
      const btn = document.getElementById('btn');
      const email = document.getElementById('email').value;
      if (!email || !email.includes('@')) return;
      btn.disabled = true;
      btn.textContent = 'Unlocking…';
      try {
        const res = await fetch('${appBaseUrl}/api/unlock/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkId: '${linkId}', email }),
        });
        const data = await res.json();
        if (res.ok && data.destination) {
          window.location.href = data.destination;
        } else {
          document.getElementById('err').textContent = data.error || 'Something went wrong.';
          btn.disabled = false;
          btn.textContent = 'Continue →';
        }
      } catch {
        document.getElementById('err').textContent = 'Network error. Please try again.';
        btn.disabled = false;
        btn.textContent = 'Continue →';
      }
    }
    document.getElementById('email').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') submit();
    });
  </script>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const userAgent = request.headers.get("User-Agent") || "";
    const slug = url.pathname.slice(1);

    if (slug === "_health") return new Response("ok", { status: 200 });
    if (!slug) return Response.redirect(env.APP_BASE_URL, 302);

    const raw = await env.LINKS_KV.get(`link:${slug}`);
    if (!raw) return new Response("Link not found", { status: 404 });

    const link = JSON.parse(raw);
    if (!link.active) return new Response("This link is no longer active.", { status: 410 });

    const country = request.headers.get("CF-IPCountry") || "unknown";
    const referer = request.headers.get("Referer") || "";
    const meta = { country, referer, userAgent: userAgent.slice(0, 200) };

    ctx.waitUntil(logEvent(env.APP_BASE_URL, env.INTERNAL_SECRET, link.id, "click", meta));

    const iab = detectIAB(userAgent);
    if (iab) {
      ctx.waitUntil(logEvent(env.APP_BASE_URL, env.INTERNAL_SECRET, link.id, "iab_detected", { ...meta, iab }));
      return new Response(iabEscapeHtml(iab, link.destination), {
        status: 200,
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    if (link.unlockMode === "instant") {
      ctx.waitUntil(logEvent(env.APP_BASE_URL, env.INTERNAL_SECRET, link.id, "redirect", meta));
      return Response.redirect(link.destination, 302);
    }

    if (hasUnlockedCookie(request, link.id)) {
      ctx.waitUntil(logEvent(env.APP_BASE_URL, env.INTERNAL_SECRET, link.id, "redirect", { ...meta, source: "cookie" }));
      return Response.redirect(link.destination, 302);
    }

    if (link.unlockMode === "email_gate") {
      return new Response(
        emailGateHtml(link.id, link.emailGateHeadline || "Enter your email to continue", env.APP_BASE_URL),
        { status: 200, headers: { "Content-Type": "text/html;charset=UTF-8" } }
      );
    }

    if (link.unlockMode === "community_gate") {
      return Response.redirect(`${env.APP_BASE_URL}/unlock/${link.id}?mode=community`, 302);
    }

    return Response.redirect(link.destination, 302);
  },
};