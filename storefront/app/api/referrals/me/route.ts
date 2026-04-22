/**
 * GET /api/referrals/me
 *
 * Returns the logged-in user's referral code + running stats.
 * Idempotent: creates the code on first call.
 *
 * Response shape:
 *   200 {
 *     code: string,
 *     shareUrl: string,
 *     discountAmountUsd: number,
 *     referrerRewardUsd: number,
 *     redemptionCount: number,
 *     earningsIssuedUsd: number,
 *     earningsPendingUsd: number,
 *   }
 *   401 { error: "not_authenticated" }
 *   500 { error: "unhandled_exception", detail: string }
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  buildReferralShareUrl,
  getOrCreateCodeForUser,
  type ReferralStats,
} from "@/lib/referrals";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supa = await supabaseServer();
    const { data: { user } } = await supa.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const displayName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null;
    const email = user.email;
    if (!email) {
      return NextResponse.json({ error: "user_missing_email" }, { status: 400 });
    }

    const code = await getOrCreateCodeForUser(user.id, email, displayName);

    // Aggregate earnings from the redemption log. This is a small table;
    // no need for a materialized view yet. Revisit at ~10k redemptions.
    const redemptions = await supabaseAdmin
      .from("sericia_referral_redemptions")
      .select("reward_issued_usd, reward_status")
      .eq("code_id", code.id);

    if (redemptions.error) throw redemptions.error;

    let earningsIssuedUsd = 0;
    let earningsPendingUsd = 0;
    for (const r of redemptions.data ?? []) {
      if (r.reward_status === "issued") earningsIssuedUsd += r.reward_issued_usd;
      else if (r.reward_status === "pending") earningsPendingUsd += r.reward_issued_usd;
    }

    const body: ReferralStats = {
      code: code.code,
      shareUrl: buildReferralShareUrl(code.code),
      discountAmountUsd: code.discount_amount_usd,
      referrerRewardUsd: code.referrer_reward_usd,
      redemptionCount: code.redemption_count,
      earningsIssuedUsd,
      earningsPendingUsd,
    };
    return NextResponse.json(body);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[api/referrals/me] failed", detail, err);
    return NextResponse.json(
      { error: "unhandled_exception", detail },
      { status: 500 },
    );
  }
}
