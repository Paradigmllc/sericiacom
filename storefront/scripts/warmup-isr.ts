// Module marker — without this the file is treated as a script and TS
// cross-pollutes top-level declarations into a shared namespace with
// drain-pseo-queue.ts, causing CI-only "Duplicate function" errors.
export {};

/**
 * ISR warm-up — hit every cacheable URL once after a deploy so the
 * first real visitor gets a hot HTML chunk instead of a 6-second
 * cold-path render.
 *
 * Why this exists:
 *   F6 introduced ISR (`revalidate=60` on /, /products; `=30` on PDP) +
 *   `unstable_cache` on the Medusa fetchers. After every deploy the
 *   container restarts and BOTH the Next.js HTML cache and the
 *   `unstable_cache` map are empty. A Reddit / SNS traffic spike that
 *   lands in that window forces every visitor down the cold path,
 *   compounded by Hetzner CPX22 (2 vCPU). Pre-warming with a single
 *   sequential pass before announcing the drop fixes the
 *   thundering-herd-meets-cold-cache scenario.
 *
 * Strategy:
 *   1. Read sitemap.xml → harvest every <loc>.
 *   2. Hit each URL with a fresh User-Agent so Cloudflare doesn't see
 *      this as bot traffic and 1015 us. Slight delay between hits to
 *      stay friendly to the origin.
 *   3. Log per-URL TTFB so we can spot regression candidates.
 *
 * Usage:
 *   npm run warmup
 *
 * Or in n8n cron after every Coolify deploy:
 *   Workflow node: Wait 60s after deploy webhook → run this script.
 */

const SITE = process.env.SERICIA_BASE_URL ?? "https://sericia.com";
const WARMUP_DELAY_MS = Number(process.env.WARMUP_WARMUP_DELAY_MS ?? "200");
const TIMEOUT_MS = 30_000;

async function fetchSitemap(): Promise<string[]> {
  const res = await fetch(`${SITE}/sitemap.xml`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  // Cheap XML walk — sitemap entries are predictable.
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function warmOne(url: string): Promise<{ url: string; status: number; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        // Identify the warm-up traffic so we can grep logs later
        "User-Agent": "Sericia-Warmup/1.0 (+ops@sericia.com)",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { url, status: res.status, ms: Date.now() - start };
  } catch (e) {
    return { url, status: 0, ms: Date.now() - start };
  }
}

async function main(): Promise<void> {
  console.log(`[warmup] target: ${SITE}`);
  const urls = await fetchSitemap();
  console.log(`[warmup] sitemap has ${urls.length} URLs`);

  let ok = 0;
  let slow = 0; // > 3s
  let fail = 0;
  const slowList: { url: string; ms: number }[] = [];

  for (const url of urls) {
    const r = await warmOne(url);
    if (r.status >= 200 && r.status < 400) ok++;
    else fail++;
    if (r.ms > 3000) {
      slow++;
      slowList.push({ url, ms: r.ms });
    }
    process.stdout.write(`  ${r.status} ${r.ms.toString().padStart(5)}ms  ${url}\n`);
    if (WARMUP_DELAY_MS > 0) await sleep(WARMUP_DELAY_MS);
  }

  console.log("");
  console.log(`[warmup] DONE`);
  console.log(`[warmup] ok=${ok}  slow(>3s)=${slow}  fail=${fail}  total=${urls.length}`);
  if (slowList.length > 0) {
    console.log(`[warmup] Slowest URLs (consider isr review):`);
    slowList
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 10)
      .forEach((s) => console.log(`  ${s.ms}ms  ${s.url}`));
  }
}

main().catch((e) => {
  console.error("[warmup] fatal:", e);
  process.exit(1);
});
