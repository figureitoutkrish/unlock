/**
 * One-time backfill: pushes every link in the DB to Cloudflare KV.
 * Run with: node scripts/sync-kv.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = resolve(__dirname, "../.env.local");
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const eqIdx = line.indexOf("=");
  if (eqIdx === -1) continue;
  const key = line.slice(0, eqIdx).trim();
  const val = line.slice(eqIdx + 1).trim();
  if (key && !key.startsWith("#")) process.env[key] = val;
}

const { DATABASE_URL, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;
const KV_NAMESPACE_ID = "324a66b7d3784beaa4b74d97e447f604";

if (!DATABASE_URL || !CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error("❌ Missing required env vars. Check .env.local");
  process.exit(1);
}

// ── Parse connection string ──────────────────────────────────────────────────
// Format: postgresql://user:password@host/dbname?...
const url = new URL(DATABASE_URL);
const neonHost = url.hostname;
const neonPassword = decodeURIComponent(url.password);

// ── Query DB via Neon HTTP API ───────────────────────────────────────────────
console.log("Connecting to Neon...");
const dbRes = await fetch(`https://${neonHost}/sql`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${neonPassword}`,
    "Content-Type": "application/json",
    "Neon-Connection-String": DATABASE_URL,
  },
  body: JSON.stringify({
    query: `SELECT id, user_id, destination, unlock_mode,
                   email_gate_headline, community_type, community_url,
                   community_label, active
            FROM links`,
    params: [],
  }),
});

if (!dbRes.ok) {
  console.error("❌ DB query failed:", await dbRes.text());
  process.exit(1);
}

const { rows } = await dbRes.json();
console.log(`Found ${rows.length} link(s)\n`);

// ── Write each to KV ─────────────────────────────────────────────────────────
let ok = 0;
let fail = 0;

for (const row of rows) {
  const kvValue = {
    id: row.id,
    userId: row.user_id,
    destination: row.destination,
    unlockMode: row.unlock_mode,
    emailGateHeadline: row.email_gate_headline ?? null,
    communityType: row.community_type ?? null,
    communityUrl: row.community_url ?? null,
    communityLabel: row.community_label ?? null,
    active: row.active,
  };

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/link:${row.id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(kvValue),
    }
  );

  if (res.ok) {
    console.log(`✓  link:${row.id}  →  ${row.destination}`);
    ok++;
  } else {
    console.error(`✗  link:${row.id}  —  ${await res.text()}`);
    fail++;
  }
}

console.log(`\n── Done: ${ok} synced, ${fail} failed ──`);
process.exit(fail > 0 ? 1 : 0);
