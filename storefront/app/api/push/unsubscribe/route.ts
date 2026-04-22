/**
 * POST /api/push/unsubscribe
 *
 * Marks a subscription as revoked. We soft-delete (set `revoked_at`) rather
 * than hard-delete so analytics on churn stays intact and we don't spam
 * re-subscribed users twice if the browser sends a duplicate subscribe.
 *
 * Called by:
 *   - lib/push.ts#unsubscribeFromPush (user action in-app)
 *   - a future n8n workflow that sweeps 410 responses from the push service
 *     (Chrome GCM / Safari APNs) and revokes the endpoint server-side
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const Schema = z.object({
  endpoint: z.string().url(),
});

export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("sericia_push_subscriptions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("endpoint", parsed.data.endpoint);

  if (error) {
    console.error("[push/unsubscribe] update failed", error);
    return NextResponse.json(
      { error: "revoke_failed", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
