import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/indexnow — submit one or more URLs to IndexNow.
 *
 * IndexNow is a free protocol (https://www.indexnow.org) that lets
 * publishers tell search engines "these URLs just changed, please
 * re-crawl." Bing, Yandex, Naver, Seznam, and Yep all participate.
 * Google does NOT participate but Bing's index is the second-biggest
 * surface (also feeds DuckDuckGo, Ecosia, AOL, Yahoo). Yandex covers
 * 80%+ of Russian search; Naver dominates Korea. Combined, IndexNow
 * unlocks instant discovery of new pages across ~30% of global search
 * traffic without waiting for crawlers to find them.
 *
 * Per IndexNow spec, ownership of `sericia.com` is proven by serving
 * the key string at `https://sericia.com/<key>.txt`. The key file
 * lives in `public/<key>.txt` (committed alongside this route).
 *
 * Use cases (callers):
 *   1. Payload "after publish" hook — when an editor publishes an
 *      article, post the article URL to this endpoint.
 *   2. n8n cron — sweep recent sericia_orders / sericia_products
 *      changes and ping the affected listing pages.
 *   3. Manual ops — `curl -X POST /api/indexnow -d '{"urls":[...]}'`
 *      for one-off cache-bust submissions.
 *
 * Auth: requires the SERICIA_ADMIN_SECRET header. We don't want this
 * endpoint open to the world — submitting another site's URLs spam-style
 * could blow back on our key (Bing tracks key reputation per host).
 */

const INDEXNOW_KEY = "f55bbec16474b7c82fe2582eb4d349be";
const HOST = "sericia.com";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

// IndexNow accepts up to 10,000 URLs per request. Be generous but cap
// here so a runaway caller can't bombard the protocol partners.
const MAX_URLS_PER_REQUEST = 1000;

// Endpoints — IndexNow's "post once, propagate to all" design means
// any participating engine accepts the payload and broadcasts to peers.
// We hit Bing's primary endpoint (most-referenced docs) and let it
// fan out. Hitting multiple endpoints would just dedupe at the network
// edge and waste the operator's quota.
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

type Payload = { urls?: unknown };

export async function POST(req: NextRequest) {
  // Auth gate — operator secret only.
  const provided = req.headers.get("x-admin-secret");
  const expected = process.env.SERICIA_ADMIN_SECRET?.trim();
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Parse + validate URLs payload.
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const rawUrls = body.urls;
  if (!Array.isArray(rawUrls) || rawUrls.length === 0) {
    return NextResponse.json({ error: "urls_required" }, { status: 400 });
  }
  if (rawUrls.length > MAX_URLS_PER_REQUEST) {
    return NextResponse.json(
      { error: "too_many_urls", limit: MAX_URLS_PER_REQUEST },
      { status: 400 },
    );
  }
  // Same-host enforcement — IndexNow rejects URLs on a different host
  // than the key file, but check pre-flight so we get a clean error
  // instead of opaque IndexNow 422s.
  const urls = rawUrls.filter(
    (u): u is string =>
      typeof u === "string" && u.startsWith(`https://${HOST}`),
  );
  if (urls.length === 0) {
    return NextResponse.json({ error: "no_valid_urls" }, { status: 400 });
  }

  // Submit to IndexNow.
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    // IndexNow returns 200 on accepted, 202 on partial, 4xx on errors.
    // The API doesn't return a JSON body on success, just a status code.
    if (res.status === 200 || res.status === 202) {
      return NextResponse.json({
        ok: true,
        submitted: urls.length,
        status: res.status,
        note:
          res.status === 202
            ? "Accepted — some URLs may be queued for later validation"
            : "Accepted",
      });
    }

    // Surface the 4xx/5xx body so the operator can fix bad payloads.
    const errBody = await res.text().catch(() => "");
    console.error(
      "[indexnow] non-success",
      res.status,
      errBody.slice(0, 500),
    );
    return NextResponse.json(
      {
        ok: false,
        status: res.status,
        details: errBody.slice(0, 500),
      },
      { status: 502 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[indexnow] network error", msg);
    return NextResponse.json(
      { error: "network_error", message: msg },
      { status: 502 },
    );
  }
}

// GET — health check + key-location echo. Useful for the operator to
// confirm the route is wired correctly before automating around it.
export async function GET() {
  return NextResponse.json({
    ok: true,
    keyLocation: KEY_LOCATION,
    host: HOST,
    note: "POST { urls: string[] } with X-Admin-Secret header to submit",
  });
}
