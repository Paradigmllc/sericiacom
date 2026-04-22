/**
 * POST /api/referrals/validate
 *
 * Public endpoint called from the checkout's "Have a referral code?" field.
 * Runs via the SECURITY-DEFINER RPC `sericia_validate_referral_code`, which
 * returns ONLY { valid, discount_amount_usd, referrer_first_name }. It never
 * leaks the referrer's email, user_id, or internal counters.
 *
 * Rate limiting:
 *   Not wired yet — the RPC itself is fast (indexed lookup) and the
 *   response is intentionally minimal, so brute-forcing the code space
 *   still only reveals "X is a valid code, someone named Y owns it" which
 *   is low-value info. Upstream Coolify nginx / Cloudflare provides a
 *   default 100 req/min IP throttle that's sufficient for launch.
 *
 * Request:  { code: string }
 * Response: 200 { valid: boolean, discountAmountUsd: number, referrerFirstName: string | null }
 *           400 { error: "invalid_request" }
 *           500 { error: "unhandled_exception", detail: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type ValidateResult = {
  valid: boolean;
  discount_amount_usd: number;
  referrer_first_name: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!code || code.length > 32) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc(
      "sericia_validate_referral_code",
      { input_code: code },
    );

    if (error) {
      console.error("[api/referrals/validate] rpc error", error);
      return NextResponse.json(
        { error: "rpc_failed", detail: error.message },
        { status: 500 },
      );
    }

    // RPC returns table row(s) — take the first (or empty).
    const row = Array.isArray(data) ? (data[0] as ValidateResult | undefined) : null;
    if (!row || !row.valid) {
      return NextResponse.json({
        valid: false,
        discountAmountUsd: 0,
        referrerFirstName: null,
      });
    }

    return NextResponse.json({
      valid: true,
      discountAmountUsd: row.discount_amount_usd,
      referrerFirstName: row.referrer_first_name || null,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[api/referrals/validate] exception", detail, err);
    return NextResponse.json(
      { error: "unhandled_exception", detail },
      { status: 500 },
    );
  }
}
