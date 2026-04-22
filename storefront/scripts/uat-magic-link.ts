/**
 * UAT — Magic Link end-to-end test via Supabase admin API.
 *
 * What this tests (the full happy path, no email delivery):
 *   1. /login form calls `signInWithOtp({ shouldCreateUser: true })`.
 *      We simulate that by calling `admin.generateLink({ type: 'magiclink' })`
 *      — it produces the exact same action URL that would be emailed, without
 *      waiting on Resend delivery.
 *   2. User clicks link → Supabase `/auth/v1/verify` redirects to the
 *      storefront's `/auth/callback?code=XXX&next=/account`.
 *   3. `/auth/callback` (app/auth/callback/route.ts) calls
 *      `exchangeCodeForSession(code)` → sets Supabase session cookies →
 *      redirects to `/account`.
 *   4. The `sericia_handle_new_user` trigger on `auth.users` fires and
 *      auto-creates a `sericia_profiles` row for the new user.
 *
 * What this does NOT test (intentionally out of scope):
 *   • Resend deliverability (separate service, separate SLA)
 *   • Welcome email via /api/auth/welcome (fire-and-forget, not on critical path)
 *   • The actual UI (/login form submission) — that's Playwright's job, not this
 *
 * Why admin.generateLink instead of manually calling verifyOtp:
 *   verifyOtp would test Supabase's code exchange in isolation; by following
 *   the redirect chain (verify → /auth/callback) we also catch regressions in
 *   our callback route, the next-param whitelist, and the cookie-setting path.
 *
 * Run:
 *   STOREFRONT_URL=http://localhost:8000 npm run uat:magic-link
 *   STOREFRONT_URL=https://sericia.com   npm run uat:magic-link   # prod smoke
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   STOREFRONT_URL  (default: http://localhost:8000)
 *
 * Cleanup policy:
 *   Both at start AND end — if a previous run crashed mid-test the stale
 *   user row is removed before we create a new one, and the new row is
 *   removed after assertions pass. On failure we leave the user in place
 *   (with its uat-[timestamp] email) so a human can inspect the DB state.
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STOREFRONT_URL = (process.env.STOREFRONT_URL ?? "http://localhost:8000").replace(/\/$/, "");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Deterministic-but-unique email: survives inspection on failure, unique per run.
const TEST_EMAIL = `uat-magiclink-${Date.now()}@sericia-test.invalid`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CheckResult = { name: string; ok: boolean; detail?: string };
const results: CheckResult[] = [];

function check(name: string, ok: boolean, detail?: string): void {
  results.push({ name, ok, detail });
  const icon = ok ? "✅" : "❌";
  console.log(`  ${icon} ${name}${detail ? `  — ${detail}` : ""}`);
}

async function findUserByEmail(email: string): Promise<string | null> {
  // admin.listUsers has no email filter, so we page through. Fine at UAT scale
  // (expected <10k users); revisit if this ever gets slow.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  return match?.id ?? null;
}

async function deleteUserByEmail(email: string): Promise<void> {
  const id = await findUserByEmail(email);
  if (!id) return;
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    console.warn(`[cleanup] failed to delete ${email}:`, error.message);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  console.log(`=== UAT: Magic Link E2E ===`);
  console.log(`   storefront: ${STOREFRONT_URL}`);
  console.log(`   test email: ${TEST_EMAIL}`);
  console.log();

  // 0. Pre-clean (defensive — previous crash could have left a stale row)
  await deleteUserByEmail(TEST_EMAIL);

  // 1. Generate magic link (bypasses Resend)
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: TEST_EMAIL,
    options: {
      redirectTo: `${STOREFRONT_URL}/auth/callback?next=/account`,
    },
  });
  if (linkErr || !linkData.properties?.action_link) {
    check("Magic link generated", false, linkErr?.message ?? "no action_link in response");
    return 1;
  }
  const actionLink = linkData.properties.action_link;
  check("Magic link generated", true, `action_link ok`);

  // 2. Follow the Supabase verify redirect (manual so we can inspect Location)
  //    Expected: 302 → {storefront}/auth/callback?code=XXX&next=/account
  const verifyRes = await fetch(actionLink, { redirect: "manual" });
  const verifyLoc = verifyRes.headers.get("location");
  const verifyOk = verifyRes.status >= 300 && verifyRes.status < 400 && !!verifyLoc;
  check(
    "Supabase verify redirects to callback",
    verifyOk,
    `status=${verifyRes.status} location=${verifyLoc ? verifyLoc.slice(0, 80) + "…" : "null"}`,
  );
  if (!verifyOk || !verifyLoc) {
    console.error("Full verify response headers:", Object.fromEntries(verifyRes.headers));
    return 1;
  }

  // Confirm the callback location is OUR domain (catches misconfigured Supabase
  // redirect allow-lists that would otherwise bounce back to localhost:3000).
  const callbackUrlObj = new URL(verifyLoc);
  const storefrontHost = new URL(STOREFRONT_URL).host;
  check(
    "Callback URL points to our storefront",
    callbackUrlObj.host === storefrontHost,
    `host=${callbackUrlObj.host} expected=${storefrontHost}`,
  );
  const code = callbackUrlObj.searchParams.get("code");
  check("Callback URL carries ?code", !!code, code ? `code=${code.slice(0, 8)}…` : "no code");
  if (!code) return 1;

  // 3. Hit /auth/callback — should set session cookies and redirect to /account
  const callbackRes = await fetch(verifyLoc, { redirect: "manual" });
  const callbackLoc = callbackRes.headers.get("location");
  // Next.js exposes Set-Cookie as a string header; with multiple cookies they
  // are comma-joined. Fall back to getSetCookie() if available (Node 20+).
  const setCookieHeaders: string[] =
    typeof callbackRes.headers.getSetCookie === "function"
      ? callbackRes.headers.getSetCookie()
      : [callbackRes.headers.get("set-cookie") ?? ""].filter(Boolean);

  check(
    "/auth/callback returns redirect",
    callbackRes.status >= 300 && callbackRes.status < 400,
    `status=${callbackRes.status}`,
  );
  check(
    "/auth/callback redirects to /account (next param honoured)",
    callbackLoc?.endsWith("/account") ?? false,
    `location=${callbackLoc}`,
  );

  const hasSbCookie = setCookieHeaders.some((c) => /sb-.*-auth-token/.test(c));
  check(
    "Session cookie (sb-*-auth-token) set",
    hasSbCookie,
    hasSbCookie ? "cookie present" : `headers=${setCookieHeaders.length}`,
  );

  // 4. Verify the trigger created the profile row
  const userId = await findUserByEmail(TEST_EMAIL);
  check("auth.users row exists", !!userId, userId ? `id=${userId.slice(0, 8)}…` : "not found");
  if (!userId) return 1;

  const { data: profile, error: profileErr } = await admin
    .from("sericia_profiles")
    .select("id, email, locale")
    .eq("id", userId)
    .maybeSingle();
  check(
    "sericia_profiles row created by trigger",
    !!profile && !profileErr,
    profileErr ? profileErr.message : profile ? `email=${profile.email} locale=${profile.locale}` : "not found",
  );

  // 5. Cleanup on success — leave the row in place if any check failed so a
  //    human can inspect the broken state.
  const allOk = results.every((r) => r.ok);
  if (allOk) {
    await deleteUserByEmail(TEST_EMAIL);
    check("Test user cleaned up", true, `deleted ${TEST_EMAIL}`);
  } else {
    console.warn(`⚠️  Leaving ${TEST_EMAIL} (id=${userId}) for inspection.`);
  }

  // Summary
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log();
  console.log(`=== Result: ${passed} passed / ${failed} failed ===`);
  return failed === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("❌ UAT crashed:", err);
    process.exit(1);
  });
