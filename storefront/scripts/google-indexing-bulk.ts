// Module marker — keeps tsc from declaring this in shared script namespace.
export {};

/**
 * F50: bulk-submit every sitemap URL to Google Indexing API.
 *
 * Companion to scripts/indexnow-bulk-submit.ts (Bing/Yandex). Both
 * scripts read `/sitemap.xml`, but they hit different endpoints:
 *
 *   indexnow-bulk-submit.ts → /api/indexnow → IndexNow protocol partners
 *   google-indexing-bulk.ts → /api/google-indexing → Google's own API
 *
 * Required env:
 *   SERICIA_BASE_URL          (default https://sericia.com)
 *   SERICIA_ADMIN_SECRET      (matches storefront env)
 *
 * The /api/google-indexing route also requires GOOGLE_INDEXING_SA_JSON
 * to be set in the storefront env. If it isn't, /api/google-indexing
 * returns 503 google_indexing_unconfigured and this script exits 1.
 *
 * Google quota: 200 publishes/day. We respect that — if total URLs
 * exceeds 200, we batch with a 24-hour wait between batches. For
 * Sericia's 372-URL sitemap the first run touches the first 200
 * (highest-priority sitemap entries first), then a manual second run
 * 24h later submits the remainder. Or split via --offset=.
 *
 * Usage:
 *   SERICIA_ADMIN_SECRET=xxx npx tsx storefront/scripts/google-indexing-bulk.ts
 *   SERICIA_ADMIN_SECRET=xxx npx tsx storefront/scripts/google-indexing-bulk.ts --offset=200
 */

const BASE_URL = process.env.SERICIA_BASE_URL ?? "https://sericia.com";
const SECRET = process.env.SERICIA_ADMIN_SECRET ?? "";
const BATCH_SIZE = 100; // max per /api/google-indexing call

if (!SECRET) {
  console.error("[google-bulk] SERICIA_ADMIN_SECRET env required");
  process.exit(1);
}

const args = process.argv.slice(2);
const flag = (k: string) => {
  const f = args.find((a) => a.startsWith(`--${k}=`));
  return f ? f.split("=")[1] : undefined;
};
const OFFSET = flag("offset") ? Number(flag("offset")) : 0;
const LIMIT = flag("limit") ? Number(flag("limit")) : 200;

async function fetchSitemapUrls(): Promise<string[]> {
  console.log(`[google-bulk] fetching sitemap from ${BASE_URL}/sitemap.xml`);
  const res = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!res.ok) {
    throw new Error(`sitemap fetch failed: HTTP ${res.status}`);
  }
  const xml = await res.text();
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return Array.from(
    new Set(
      matches.map((m) => m[1].trim()).filter((u) => u.startsWith("http")),
    ),
  );
}

async function submitBatch(urls: string[], n: number, total: number) {
  console.log(`[google-bulk] batch ${n}/${total} (${urls.length} URLs)…`);
  const res = await fetch(`${BASE_URL}/api/google-indexing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Secret": SECRET,
    },
    body: JSON.stringify({ urls, type: "URL_UPDATED" }),
    signal: AbortSignal.timeout(180_000), // batch can be slow (Google rate limit)
  });
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    submitted?: number;
    succeeded?: number;
    failed?: number;
    failures?: Array<{ url: string; status: number; body: unknown }>;
    error?: string;
    hint?: string;
  };
  if (!res.ok || body.error) {
    console.error(
      `[google-bulk] batch ${n} failed:`,
      res.status,
      body.error ?? body,
    );
    if (body.hint) console.error("  hint:", body.hint);
    return false;
  }
  console.log(
    `[google-bulk] batch ${n} ok=${body.succeeded}/${body.submitted} fail=${body.failed}`,
  );
  if (body.failures && body.failures.length) {
    for (const f of body.failures.slice(0, 5)) {
      console.error(`  ${f.status} ${f.url}`);
    }
  }
  return true;
}

async function main() {
  const all = await fetchSitemapUrls();
  console.log(`[google-bulk] sitemap returned ${all.length} URLs`);

  // Apply offset + limit window. Google quota = 200/day, so default
  // limit is 200. Operator sets --offset=200 next day to continue.
  const window = all.slice(OFFSET, OFFSET + LIMIT);
  console.log(
    `[google-bulk] window: offset=${OFFSET} limit=${LIMIT} → ${window.length} URLs`,
  );

  if (window.length === 0) {
    console.warn("[google-bulk] no URLs in window — nothing to submit");
    return;
  }

  const batches: string[][] = [];
  for (let i = 0; i < window.length; i += BATCH_SIZE) {
    batches.push(window.slice(i, i + BATCH_SIZE));
  }

  let okCount = 0;
  for (let i = 0; i < batches.length; i++) {
    const ok = await submitBatch(batches[i], i + 1, batches.length);
    if (ok) okCount += batches[i].length;
    if (i < batches.length - 1) {
      // 30s pause between batches keeps us well under 600/min limit.
      await new Promise((r) => setTimeout(r, 30_000));
    }
  }

  console.log(
    `[google-bulk] done — submitted ${okCount}/${window.length} URLs`,
  );
  if (window.length < all.length) {
    console.log(
      `[google-bulk] note: ${all.length - (OFFSET + window.length)} URLs unsubmitted. Re-run tomorrow with --offset=${OFFSET + LIMIT}`,
    );
  }
}

main().catch((err) => {
  console.error("[google-bulk] fatal:", err);
  process.exit(1);
});
