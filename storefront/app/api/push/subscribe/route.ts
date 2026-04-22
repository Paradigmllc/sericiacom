/**
 * POST /api/push/subscribe
 *
 * Persists a Web Push subscription so server-side jobs (n8n / Medusa
 * subscribers) can target it later. Handles both authenticated users and
 * anonymous visitors — anonymity is intentional because drop-alert /
 * back-in-stock campaigns depend on pre-auth reach.
 *
 * Dedup strategy: Postgres unique index on `endpoint`. Every PushSubscription
 * from the browser has a unique endpoint URL, so upserting on endpoint is
 * the correct (and only) way to avoid duplicate rows when the same browser
 * toggles subscription off/on.
 *
 * Response:
 *   200 { ok: true }
 *   400 { error: "invalid_input" }
 *   500 { error: "persist_failed", detail }
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs"; // createHash is node-only
export const dynamic = "force-dynamic";

const Schema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  topics: z.array(z.string()).optional(),
  locale: z.string().max(20).optional().nullable(),
  user_agent: z.string().max(500).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { subscription, topics, locale, user_agent } = parsed.data;

  // Get the authenticated user if present — nullable by design.
  let userId: string | null = null;
  try {
    const supa = await supabaseServer();
    const { data: { user } } = await supa.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Anonymous flow — no session cookie.
  }

  // Anonymous visitor hash derived from the visitor cookie set by middleware.
  // Falls back to a hash of IP+UA if the cookie isn't present yet — gives us
  // at least best-effort dedup for same-device subscriptions.
  const visitorCookie = req.cookies.get("sericia_vid")?.value ?? "";
  const ipHint =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "";
  const uaHint = user_agent ?? req.headers.get("user-agent") ?? "";
  const anonSeed = visitorCookie || `${ipHint}|${uaHint}`;
  const visitorHash = anonSeed
    ? createHash("sha256").update(anonSeed).digest("hex").slice(0, 32)
    : null;

  if (!userId && !visitorHash) {
    // Truly unidentifiable — refuse silently so we don't write orphan rows
    // that can never be cleaned up.
    return NextResponse.json({ error: "no_identity" }, { status: 400 });
  }

  const countryCode = req.headers.get("cf-ipcountry")?.toUpperCase() ?? null;

  const { error } = await supabaseAdmin
    .from("sericia_push_subscriptions")
    .upsert(
      {
        user_id: userId,
        visitor_hash: visitorHash,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: user_agent ?? req.headers.get("user-agent") ?? null,
        locale: locale ?? null,
        country_code: countryCode,
        topics: topics && topics.length > 0 ? topics : ["drops", "orders"],
        revoked_at: null,
      },
      { onConflict: "endpoint" },
    );

  if (error) {
    console.error("[push/subscribe] upsert failed", error);
    return NextResponse.json(
      { error: "persist_failed", detail: error.message },
      { status: 500 },
    );
  }

  // Fire-and-forget analytics event — same pattern as /api/waitlist.
  supabaseAdmin.from("sericia_events").insert({
    event_name: "push_subscribe",
    distinct_id: userId ?? visitorHash,
    country_code: countryCode,
    properties: { topics: topics ?? ["drops", "orders"], locale },
  }).then(({ error: evtErr }) => {
    if (evtErr) console.error("[push/subscribe] event insert failed", evtErr);
  });

  return NextResponse.json({ ok: true });
}
