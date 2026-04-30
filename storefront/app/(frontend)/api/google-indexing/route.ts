import { NextRequest, NextResponse } from "next/server";
import { createSign } from "crypto";

/**
 * POST /api/google-indexing — submit URLs to Google Indexing API.
 *
 * Distinct from /api/indexnow (Bing/Yandex/Naver protocol). This route
 * uses Google's separate Indexing API at
 * `indexing.googleapis.com/v3/urlNotifications:publish`. Auth flow:
 *   1. Service Account JSON key (from Coolify env GOOGLE_INDEXING_SA_JSON)
 *   2. We build a signed JWT (RS256, 1-hour TTL, scope = indexing)
 *   3. Exchange JWT for access_token at oauth2.googleapis.com/token
 *   4. Call urlNotifications:publish with Bearer access_token
 *
 * Operator setup (one-time, see docs/seo-indexing-runbook.md §3b):
 *   1. Google Cloud Console → New project → Enable Indexing API
 *   2. IAM → Create Service Account → Download JSON key
 *   3. Search Console → Settings → Users and permissions → Add the
 *      service account email as Owner (Owner permission is REQUIRED;
 *      "Full" or "Restricted" will reject the API call with PERMISSION_DENIED)
 *   4. Coolify env: GOOGLE_INDEXING_SA_JSON = (paste full JSON contents)
 *   5. Redeploy storefront → endpoint goes live
 *
 * Per Google's official docs the API formally supports only JobPosting
 * and BroadcastEvent schemas. In practice, urlNotifications:publish
 * accepts any URL on a verified domain and Google's crawler does pick
 * the URLs up (faster than sitemap discovery, slower than the URL
 * Inspection "Request indexing" button which is rate-limited to 10/day).
 *
 * Auth gate: SERICIA_ADMIN_SECRET header — same as /api/indexnow.
 *
 * Limits:
 *   - Google Indexing API quota: 200 publishes / day, 600 / minute
 *   - We cap MAX_URLS_PER_REQUEST at 100 to leave headroom for retries
 */

const GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token";
const GOOGLE_INDEXING_API =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";
const SCOPE = "https://www.googleapis.com/auth/indexing";

const HOST_PREFIX = "https://sericia.com";
const MAX_URLS_PER_REQUEST = 100;

type Payload = { urls?: unknown; type?: "URL_UPDATED" | "URL_DELETED" };

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
  type?: string;
};

/**
 * Build a signed JWT (RS256) per Google's service-account auth flow.
 * https://developers.google.com/identity/protocols/oauth2/service-account
 */
function buildJwt(sa: ServiceAccount): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: SCOPE,
    aud: sa.token_uri ?? GOOGLE_TOKEN_URI,
    iat: now,
    exp: now + 3600,
  };
  const b64url = (input: string | Buffer): string =>
    Buffer.from(input)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  const headerB64 = b64url(JSON.stringify(header));
  const claimsB64 = b64url(JSON.stringify(claims));
  const signingInput = `${headerB64}.${claimsB64}`;
  const signature = createSign("RSA-SHA256")
    .update(signingInput)
    .sign(sa.private_key, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${signingInput}.${signature}`;
}

async function fetchAccessToken(sa: ServiceAccount): Promise<string> {
  const jwt = buildJwt(sa);
  const tokenUri = sa.token_uri ?? GOOGLE_TOKEN_URI;
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });
  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Google token exchange failed: HTTP ${res.status} ${text.slice(0, 300)}`,
    );
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google token response missing access_token");
  }
  return data.access_token;
}

async function publishOne(
  accessToken: string,
  url: string,
  type: "URL_UPDATED" | "URL_DELETED",
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(GOOGLE_INDEXING_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, type }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as unknown;
  return { ok: res.ok, status: res.status, body };
}

export async function POST(req: NextRequest) {
  const provided = req.headers.get("x-admin-secret");
  const expected = process.env.SERICIA_ADMIN_SECRET?.trim();
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const saJson = process.env.GOOGLE_INDEXING_SA_JSON?.trim();
  if (!saJson) {
    return NextResponse.json(
      {
        error: "google_indexing_unconfigured",
        hint: "GOOGLE_INDEXING_SA_JSON env not set — see docs/seo-indexing-runbook.md §3b for service-account setup",
      },
      { status: 503 },
    );
  }

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(saJson) as ServiceAccount;
    if (!sa.client_email || !sa.private_key) {
      throw new Error("missing client_email or private_key");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "google_sa_json_invalid", message: msg },
      { status: 503 },
    );
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const rawUrls = body.urls;
  const type = body.type ?? "URL_UPDATED";
  if (!Array.isArray(rawUrls) || rawUrls.length === 0) {
    return NextResponse.json({ error: "urls_required" }, { status: 400 });
  }
  if (rawUrls.length > MAX_URLS_PER_REQUEST) {
    return NextResponse.json(
      { error: "too_many_urls", limit: MAX_URLS_PER_REQUEST },
      { status: 400 },
    );
  }
  const urls = rawUrls.filter(
    (u): u is string => typeof u === "string" && u.startsWith(HOST_PREFIX),
  );
  if (urls.length === 0) {
    return NextResponse.json({ error: "no_valid_urls" }, { status: 400 });
  }

  // Fetch access token once, reuse across the batch.
  let accessToken: string;
  try {
    accessToken = await fetchAccessToken(sa);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[google-indexing] token exchange failed:", msg);
    return NextResponse.json(
      { error: "google_auth_failed", message: msg },
      { status: 502 },
    );
  }

  // Sequential — Google Indexing API has 600/min rate limit and
  // returns 429 on burst. 50ms gap keeps us well under that.
  const results: Array<{
    url: string;
    ok: boolean;
    status: number;
    body: unknown;
  }> = [];
  for (const url of urls) {
    try {
      const r = await publishOne(accessToken, url, type);
      results.push({ url, ...r });
    } catch (err) {
      results.push({
        url,
        ok: false,
        status: 0,
        body: err instanceof Error ? err.message : String(err),
      });
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  const okCount = results.filter((r) => r.ok).length;
  return NextResponse.json({
    ok: okCount === urls.length,
    submitted: urls.length,
    succeeded: okCount,
    failed: urls.length - okCount,
    type,
    // Only return non-200 entries to keep the response compact.
    failures: results.filter((r) => !r.ok),
  });
}

export async function GET() {
  const saConfigured = !!process.env.GOOGLE_INDEXING_SA_JSON?.trim();
  return NextResponse.json({
    ok: true,
    api: "Google Indexing API v3 (urlNotifications:publish)",
    sa_configured: saConfigured,
    note: saConfigured
      ? "POST { urls: string[], type?: 'URL_UPDATED'|'URL_DELETED' } with X-Admin-Secret header"
      : "Service account not configured. See docs/seo-indexing-runbook.md §3b.",
    quota: {
      per_day: 200,
      per_minute: 600,
      per_request: MAX_URLS_PER_REQUEST,
    },
  });
}
