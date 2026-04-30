// Module marker — ESM-only, prevents tsc from declaring this in the
// shared script namespace alongside other top-level scripts.
export {};

/**
 * Bulk-submit every sitemap URL to IndexNow.
 *
 * Use cases:
 *   - First-launch flood: pre-warm Bing / Yandex / Naver / Yep with
 *     the full ~150-URL site catalog so they index everything in
 *     hours instead of weeks.
 *   - Post-pSEO-expand catch-up: after expand-pseo-briefs.ts +
 *     drain-pseo-queue.ts produce hundreds of new /guides/[country]/
 *     [product] articles, ping the search engines once batch is done.
 *   - Periodic re-ping: monthly cron to nudge the index for pages we
 *     edited.
 *
 * IndexNow caps at 10,000 URLs per request and Bing recommends
 * batching at ≤500 to keep the propagation friendly. We chunk at
 * 500.
 *
 * Required env:
 *   SERICIA_BASE_URL          (default https://sericia.com)
 *   SERICIA_ADMIN_SECRET      (matches storefront env)
 *
 * Usage:
 *   SERICIA_ADMIN_SECRET=xxx npx tsx scripts/indexnow-bulk-submit.ts
 */

const BASE_URL = process.env.SERICIA_BASE_URL ?? "https://sericia.com";
const SECRET = process.env.SERICIA_ADMIN_SECRET ?? "";
const BATCH_SIZE = 500;

if (!SECRET) {
  console.error("[indexnow-bulk] SERICIA_ADMIN_SECRET env required");
  process.exit(1);
}

async function fetchSitemapUrls(): Promise<string[]> {
  console.log(`[indexnow-bulk] fetching sitemap from ${BASE_URL}/sitemap.xml`);
  const res = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!res.ok) {
    throw new Error(
      `sitemap fetch failed: HTTP ${res.status} ${res.statusText}`,
    );
  }
  const xml = await res.text();
  // Quick & dirty regex extract — we control the sitemap format so
  // we don't need a full XML parser. Bracket the <loc> tag, capture
  // the URL, dedupe.
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  const urls = matches
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith("http"));
  return Array.from(new Set(urls));
}

async function submitBatch(urls: string[], batchNum: number, total: number) {
  console.log(
    `[indexnow-bulk] batch ${batchNum}/${total} (${urls.length} URLs)…`,
  );
  const res = await fetch(`${BASE_URL}/api/indexnow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Secret": SECRET,
    },
    body: JSON.stringify({ urls }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(
      `[indexnow-bulk] batch ${batchNum} failed:`,
      res.status,
      body,
    );
    return false;
  }
  console.log(
    `[indexnow-bulk] batch ${batchNum} ✓ ${body.note ?? ""} (status ${body.status ?? "?"})`,
  );
  return true;
}

async function main() {
  const urls = await fetchSitemapUrls();
  console.log(`[indexnow-bulk] sitemap returned ${urls.length} URLs`);

  if (urls.length === 0) {
    console.warn("[indexnow-bulk] no URLs to submit");
    return;
  }

  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE));
  }

  let okCount = 0;
  for (let i = 0; i < batches.length; i++) {
    const ok = await submitBatch(batches[i], i + 1, batches.length);
    if (ok) okCount += batches[i].length;
    // 2-second pause between batches — IndexNow has no documented
    // rate limit but politeness wins relationships with Bing's team.
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(
    `[indexnow-bulk] done — ${okCount}/${urls.length} URLs submitted`,
  );
  if (okCount < urls.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[indexnow-bulk] fatal:", err);
  process.exit(1);
});
