---
name: deploy-worker
description: Deploy the Cloudflare Worker redirect engine. Use when asked to deploy, ship, or publish the worker.
disable-model-invocation: true
---

Before deploying, run through this checklist and surface any gaps to the user:

1. **INTERNAL_SECRET set?** — Check if `wrangler secret put INTERNAL_SECRET` has been run. It cannot be verified programmatically; ask the user to confirm.
2. **LINKS_KV bound?** — Verify `wrangler.toml` has the `LINKS_KV` binding with a real `id` (not a placeholder). Read `worker/wrangler.toml` to check.
3. **APP_BASE_URL correct?** — Confirm the `APP_BASE_URL` var in `wrangler.toml` points to the production Next.js URL, not `localhost`.
4. **Next.js `POST /api/events` deployed?** — The worker logs analytics to this endpoint. If it doesn't exist yet, warn the user that events will silently fail (this is by design — it won't break redirects).

If all checks pass (or the user confirms), run from the project root:

```bash
npx wrangler deploy --config worker/wrangler.toml
```

Report the deployed worker URL from wrangler output.
