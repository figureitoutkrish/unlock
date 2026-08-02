@AGENTS.md

# Project: Unlock

A link-redirect platform with unlock gates (email capture, community join). Two deployment units: a Next.js app and a Cloudflare Worker redirect engine.

## Commands

```bash
# Next.js app
npm run dev        # dev server on :3000
npm run build      # production build
npm run start      # serve production build
npm run lint       # ESLint (flat config, eslint.config.mjs)

# Drizzle ORM (no npm script — run directly)
npx drizzle-kit generate   # generate SQL migration from schema diff
npx drizzle-kit migrate    # apply migrations against DATABASE_URL
npx drizzle-kit push       # push schema directly (dev shortcut, no migration file)
npx drizzle-kit studio     # visual DB browser

# Cloudflare Worker (from worker/ dir — no separate package.json, uses root deps)
npx wrangler dev           # local worker dev
npx wrangler deploy        # deploy worker to Cloudflare
```

No test runner is configured.

## Package manager

npm (package-lock.json). Do not use pnpm/yarn/bun.

## Project structure

```
/
  src/
    app/           # Next.js App Router pages (layout.tsx, page.tsx, globals.css)
    db/
      schema.ts    # Drizzle schema (single source of truth for DB shape)
      index.ts     # Neon + Drizzle client (exports `db`)
  worker/
    index.ts       # Cloudflare Worker — the redirect engine
    wrangler.toml  # Worker config (name: unlock-redirect-engine)
  drizzle.config.ts
  next.config.ts
```

`worker/` is NOT a separate npm package (no package.json). It is deployed independently with Wrangler but shares the root `node_modules`.

## Path alias

`@/*` resolves to `./src/*` — use this for all non-relative imports inside `src/`.

## TypeScript

Strict mode is on (`"strict": true`). `moduleResolution: "bundler"`. Do not relax these.

## Tailwind CSS

Version 4 (breaking changes from v3). PostCSS plugin is `@tailwindcss/postcss`, not `tailwindcss`. CSS is in `src/app/globals.css`. Config syntax differs from v4 — read docs before writing utilities or config.

## Database

- **ORM**: Drizzle ORM (`drizzle-orm`)
- **Driver**: Neon serverless HTTP (`@neondatabase/serverless` + `drizzle-orm/neon-http`)
- **Dialect**: PostgreSQL
- **Schema**: `src/db/schema.ts` — four tables: `users`, `links`, `captured_emails`, `analytics_events`; two enums: `unlock_mode` (`instant` | `email_gate` | `community_gate`), `event_type`
- **Migrations output**: `./drizzle/` (does not exist yet — run `npx drizzle-kit generate` first)
- **Required env var**: `DATABASE_URL` (Neon connection string)

Always update `src/db/schema.ts` first, then generate a migration — never edit migration files by hand.

## Cloudflare Worker (worker/index.ts)

**Purpose**: The public-facing redirect engine at a separate domain (e.g. `go.yourdomain.com`). Handles all slug resolution — the Next.js app is the admin/management layer only.

**Flow**:
1. Reads slug from `/{slug}`, looks up `link:{slug}` in `LINKS_KV`
2. Detects Instagram/TikTok/Facebook in-app browsers (IAB) — serves an HTML escape page instead of redirecting
3. Checks `unlock_unlocked_{linkId}=1` cookie for previously unlocked visitors
4. Routes by `unlockMode`: `instant` → immediate redirect; `email_gate` → serves inline HTML form; `community_gate` → redirects to Next.js `/unlock/{id}?mode=community`
5. Logs analytics events to Next.js `POST /api/events` using `INTERNAL_SECRET` header — errors are swallowed so a logging failure never breaks a redirect

**Bindings required**:
- `LINKS_KV` — KV namespace (id and preview_id in wrangler.toml already set)
- `APP_BASE_URL` — var, e.g. `https://yourapp.vercel.app` (set to `http://localhost:3000` in wrangler.toml for local dev)
- `INTERNAL_SECRET` — Wrangler secret (not in wrangler.toml; set with `wrangler secret put INTERNAL_SECRET`)

The Next.js app must validate `X-Internal-Secret` on `POST /api/events` against this secret.

## Environment variables

| Var | Where used | Notes |
|---|---|---|
| `DATABASE_URL` | `src/db/index.ts`, `drizzle.config.ts` | Neon connection string |
| `INTERNAL_SECRET` | Worker → Next.js `POST /api/events` | Shared secret; set as Wrangler secret + Next.js env var |

All env vars are `.gitignore`d (`.env*` pattern). Use `.env.local` for local dev.

## Formatter

No Prettier or Biome config exists. ESLint only (`eslint.config.mjs`), using `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` flat config.

## Key architectural decisions

- The Worker reads link data from KV, not by calling the Next.js API, so link mutations in the Next.js app must write to KV as well as the DB.
- IDs use `nanoid` (not UUIDs).
- The `drizzle/` migrations directory has not been created yet — the schema exists but no migration has been generated or run.

## Gaps (ask the user)

- No auth system is present yet — the `users` table exists in the schema but there is no sign-in/session mechanism.
- No `POST /api/events` or `POST /api/unlock/email` route exists in `src/app/` yet — only the scaffold page.
- No KV write path exists yet — code that creates/updates links must also write to `LINKS_KV`.
- Production domains (worker URL, app URL) are not configured.
- `INTERNAL_SECRET` value is not set anywhere yet.
