const KV_NAMESPACE_ID = "324a66b7d3784beaa4b74d97e447f604";

function kvBase() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return null;
  return {
    url: `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values`,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
  };
}

export interface KVLink {
  id: string;
  userId: string;
  destination: string;
  unlockMode: string;
  emailGateHeadline: string | null;
  communityType: string | null;
  communityUrl: string | null;
  communityLabel: string | null;
  active: boolean;
}

export async function writeToKV(link: KVLink): Promise<void> {
  const base = kvBase();
  if (!base) {
    console.warn("[KV] Skipping write — Cloudflare credentials not set");
    return;
  }

  const res = await fetch(`${base.url}/link:${link.id}`, {
    method: "PUT",
    headers: base.headers,
    body: JSON.stringify(link),
  });

  if (!res.ok) {
    console.error("[KV] Write failed for", link.id, await res.text());
  }
}

export async function deleteFromKV(linkId: string): Promise<void> {
  const base = kvBase();
  if (!base) {
    console.warn("[KV] Skipping delete — Cloudflare credentials not set");
    return;
  }

  const res = await fetch(`${base.url}/link:${linkId}`, {
    method: "DELETE",
    headers: base.headers,
  });

  if (!res.ok) {
    console.error("[KV] Delete failed for", linkId, await res.text());
  }
}
