// Module marker — see warmup-isr.ts comment. Without it Coolify CI's tsc
// treats both files as scripts and declares them in a shared namespace.
export {};

/**
 * pSEO queue drainer — sequentially calls /api/pseo/generate until queue is empty.
 *
 * Pairs with `expand-pseo-briefs.ts`:
 *   1. expand-pseo-briefs.ts populates Supabase with N pending briefs.
 *   2. THIS script calls POST /api/pseo/generate one-at-a-time, each call
 *      claims the next brief, generates an article, persists to Payload,
 *      and marks the brief done.
 *
 * Why call /api/pseo/generate (vs writing the loop here):
 *   The endpoint already implements: queue claim, slug collision retry,
 *   stale-processing sweep, Payload persist, error capture, telemetry.
 *   This drainer just orchestrates. Keep one source of truth.
 *
 * Concurrency: sequential by design. DeepSeek rate limits are friendly to
 * single-stream workloads, and concurrent generation would fork the
 * Context Caching prefix (90% off discount only applies on serial calls
 * with the same byte-identical prefix).
 *
 * Required env:
 *   SERICIA_BASE_URL          (default https://sericia.com)
 *   SERICIA_ADMIN_SECRET      (matches storefront env)
 *
 * Optional:
 *   PSEO_BATCH_SIZE           (default 10 — keep small for first runs)
 *   PSEO_DELAY_MS             (default 2500ms between calls — friendly polling)
 *
 * Usage:
 *   SERICIA_ADMIN_SECRET=xxx npx tsx storefront/scripts/drain-pseo-queue.ts
 *
 * Or via npm script:
 *   npm run pseo:drain -- --batch=20
 */

const BASE_URL = process.env.SERICIA_BASE_URL ?? "https://sericia.com";
const SECRET = process.env.SERICIA_ADMIN_SECRET ?? "";
const BATCH = Number(process.env.PSEO_BATCH_SIZE ?? "10");
const DELAY_MS = Number(process.env.PSEO_DELAY_MS ?? "2500");

type GenerateResponse =
  | { ok: true; brief_id: number; article_id: number; slug: string; locale: string; usage: { prompt_tokens: number; completion_tokens: number; prompt_cache_hit_tokens?: number }; elapsed_ms: number }
  | { ok: true; claimed: null; reason: "queue_empty" }
  | { ok: false; brief_id?: number; error: string; detail?: string };

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function callGenerate(): Promise<GenerateResponse> {
  const res = await fetch(`${BASE_URL}/api/pseo/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": SECRET,
    },
    body: "{}",
    // Allow up to 2 min — long article generation runs near 60s.
    signal: AbortSignal.timeout(120_000),
  });
  const json = (await res.json()) as GenerateResponse;
  return json;
}

async function main(): Promise<void> {
  if (!SECRET) {
    console.error("[drain-pseo-queue] SERICIA_ADMIN_SECRET is required.");
    process.exit(1);
  }
  console.log(
    `[drain-pseo-queue] Target: ${BASE_URL} · Batch: ${BATCH} · Delay: ${DELAY_MS}ms`,
  );

  let succeeded = 0;
  let failed = 0;
  let cacheHits = 0;
  let totalPrompt = 0;
  let totalCompletion = 0;

  for (let i = 0; i < BATCH; i++) {
    const startedAt = Date.now();
    try {
      const result = await callGenerate();
      const dt = Date.now() - startedAt;

      if ("claimed" in result && result.claimed === null) {
        console.log(
          `[drain-pseo-queue] Queue empty after ${i} calls. Stopping.`,
        );
        break;
      }
      if (result.ok && "article_id" in result) {
        succeeded++;
        totalPrompt += result.usage.prompt_tokens ?? 0;
        totalCompletion += result.usage.completion_tokens ?? 0;
        if ((result.usage.prompt_cache_hit_tokens ?? 0) > 0) cacheHits++;
        console.log(
          `[drain-pseo-queue] OK #${i + 1}: brief=${result.brief_id} slug=${result.slug} (${result.locale}) ${dt}ms cache=${result.usage.prompt_cache_hit_tokens ?? 0}/${result.usage.prompt_tokens}`,
        );
      } else {
        failed++;
        const r = result as Extract<GenerateResponse, { ok: false }>;
        console.error(
          `[drain-pseo-queue] FAIL #${i + 1}: ${r.error}${r.detail ? ` — ${r.detail.slice(0, 200)}` : ""}`,
        );
      }
    } catch (e) {
      failed++;
      console.error(
        `[drain-pseo-queue] EXC #${i + 1}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    if (i < BATCH - 1) await sleep(DELAY_MS);
  }

  console.log(``);
  console.log(`[drain-pseo-queue] === SUMMARY ===`);
  console.log(`[drain-pseo-queue] Succeeded:  ${succeeded}`);
  console.log(`[drain-pseo-queue] Failed:     ${failed}`);
  console.log(`[drain-pseo-queue] Cache hits: ${cacheHits} / ${succeeded}`);
  console.log(`[drain-pseo-queue] Tokens:     in=${totalPrompt} out=${totalCompletion}`);
  // Approximate cost (DeepSeek pricing as of 2026-04: $0.14/1M cache miss + $0.014/1M cache hit, $0.28/1M output)
  // Coarse approximation since we don't have per-call cache_miss/_hit split here.
  const cacheRate = succeeded > 0 ? cacheHits / succeeded : 0;
  const inputCost =
    totalPrompt *
    (cacheRate * 0.000014 + (1 - cacheRate) * 0.00014) / 1000;
  const outputCost = (totalCompletion * 0.00028) / 1000;
  console.log(`[drain-pseo-queue] Approx $:    $${(inputCost + outputCost).toFixed(4)}`);
}

main().catch((e) => {
  console.error("[drain-pseo-queue] fatal:", e);
  process.exit(1);
});
