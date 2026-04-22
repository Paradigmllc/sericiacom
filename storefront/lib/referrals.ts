/**
 * Referral program helpers — server-side (imported by API routes).
 *
 * Responsibilities:
 *   • generateReferralCode() — deterministic-friendly, human-readable codes
 *     (e.g. "ANNA-7K3D") derived from a user's display name + 4 chars of
 *     entropy. Safe from confusable characters (no 0/O, 1/I, etc).
 *   • getOrCreateCodeForUser() — idempotent upsert. One code per user,
 *     lazily created on first `/account/referrals` visit.
 *   • Shared types — keeps the API routes and the account page in sync on
 *     the wire shape.
 *
 * Not responsible for:
 *   • Applying the discount at checkout — that lives in the Crossmint
 *     webhook / Medusa subscriber (see scripts/n8n-workflow-order-placed).
 *   • Issuing the referrer reward — same.
 */

import { supabaseAdmin } from "./supabase-admin";

// Alphabet excludes easily-confused characters: 0/O, 1/I, L, 5/S.
// 28 characters ^ 4 = ~614k combinations per prefix — collision risk
// becomes meaningful only past ~100k active referrers. Acceptable for launch.
const SAFE_ALPHABET = "ABCDEFGHJKMNPQRTUVWXYZ234679";

/**
 * Build a human-readable referral code from a display name.
 * Format: `{PREFIX}-{XXXX}` where PREFIX is first 4 chars of alphanumerics
 * from the display name (uppercased), fallback SEN.
 *
 * Examples:
 *   "Anna Smith" → "ANNA-7K3D"
 *   "山田 太郎"   → "SEN-7K3D"  (no latin chars → fallback)
 *   "Jo"          → "JOXX-7K3D" (padded with X if < 3 chars)
 */
export function generateReferralCode(displayName: string | null | undefined): string {
  const clean = (displayName ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const rawPrefix = clean.slice(0, 4);
  const prefix = rawPrefix.length >= 3 ? rawPrefix.padEnd(4, "X") : "SEN";

  let suffix = "";
  const len = SAFE_ALPHABET.length;
  for (let i = 0; i < 4; i++) {
    suffix += SAFE_ALPHABET[Math.floor(Math.random() * len)];
  }
  return `${prefix}-${suffix}`;
}

export type ReferralCodeRow = {
  id: string;
  user_id: string;
  email: string;
  code: string;
  referrer_display_name: string | null;
  discount_amount_usd: number;
  referrer_reward_usd: number;
  is_active: boolean;
  redemption_count: number;
  redemption_limit: number | null;
  created_at: string;
};

export type ReferralStats = {
  code: string;
  shareUrl: string;
  discountAmountUsd: number;
  referrerRewardUsd: number;
  redemptionCount: number;
  earningsIssuedUsd: number;
  earningsPendingUsd: number;
};

/**
 * Idempotent: fetches the user's existing code or creates a new one.
 * Collision retry is bounded to 5 attempts — the alphabet is large enough
 * that retries basically never happen at launch-scale.
 */
export async function getOrCreateCodeForUser(
  userId: string,
  email: string,
  displayName: string | null,
): Promise<ReferralCodeRow> {
  const existing = await supabaseAdmin
    .from("sericia_referral_codes")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as ReferralCodeRow;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode(displayName);
    const insert = await supabaseAdmin
      .from("sericia_referral_codes")
      .insert({
        user_id: userId,
        email,
        code,
        referrer_display_name: displayName,
      })
      .select("*")
      .single();

    if (!insert.error && insert.data) return insert.data as ReferralCodeRow;
    // 23505 = unique_violation (code already in use). Retry with new suffix.
    if (insert.error?.code === "23505") {
      lastError = insert.error;
      continue;
    }
    throw insert.error ?? new Error("unknown insert failure");
  }
  throw lastError ?? new Error("exhausted retries generating unique code");
}

/**
 * Build the URL a user shares — referee lands here and the ?ref= param
 * is sniffed by the RootLayout and stashed into a cookie (see
 * components/ReferralCookieSetter — wired separately).
 */
export function buildReferralShareUrl(code: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://sericia.com";
  return `${base}/?ref=${encodeURIComponent(code)}`;
}

// ---------------------------------------------------------------------------
// Reward-lifecycle transitions
// ---------------------------------------------------------------------------

/**
 * Result of an attempted reward-status flip.
 * `flipped: true` means this call was the one that wrote the new state;
 * `flipped: false` + reason explains why we no-op'd (already done / not
 * applicable / nothing to do).
 */
export type ReferralRewardFlipResult = {
  flipped: boolean;
  redemption_id?: string;
  reward_issued_usd?: number;
  reason?: "not_found" | "already_issued" | "revoked";
};

/**
 * Flip the referrer's reward from `pending` → `issued` when an order ships.
 *
 * Called from the Next.js ship paths — NOT from the Medusa subscriber:
 *   - /api/orders/[id]/ship         (direct tracking-number endpoint)
 *   - /api/admin/orders/[id]/update (status transition → shipped)
 *
 * Rationale for the hook site: `sericia_referral_redemptions` is a Supabase
 * table. The Medusa subscriber runs inside the Medusa process and doesn't
 * hold supabase-admin credentials. Keeping the flip in the storefront API
 * layer (where supabase-admin is already in scope) avoids a cross-module
 * dependency and keeps the reward lifecycle close to the ship event.
 *
 * Idempotency & concurrency:
 *   - Safe to call twice. The WHERE reward_status='pending' guard on the
 *     UPDATE makes the second call a no-op at the DB level.
 *   - If two ship endpoints fire near-simultaneously (ship + admin-update),
 *     whichever lands first wins; the other returns reason='already_issued'.
 *
 * Non-fatal by design: callers should swallow exceptions and log them.
 * A failed reward flip must NEVER block the ship operation — the physical
 * shipment is the source of truth, the reward is a ledger adjustment that
 * can be reconciled manually if the flip misfires.
 *
 * Claw-back policy (open):
 *   If the order is later cancelled/refunded AFTER the reward is issued,
 *   we do NOT auto-revoke today. Ops can set reward_status='revoked' via
 *   SQL. Automated revoke is intentionally deferred until the return/
 *   refund policy is formalised — punishing referrers for a refund they
 *   had no control over is a trust-destroying default.
 */
export async function flipReferralRewardOnShipped(
  orderId: string,
): Promise<ReferralRewardFlipResult> {
  if (!orderId) throw new Error("flipReferralRewardOnShipped: orderId required");

  // Locate the single redemption row for this order (if any exists).
  // Most orders have zero — the referral program is opt-in at checkout.
  const found = await supabaseAdmin
    .from("sericia_referral_redemptions")
    .select("id, reward_status, reward_issued_usd")
    .eq("order_id", orderId)
    .maybeSingle();

  if (found.error) {
    console.error("[referrals/flip] lookup failed", found.error);
    throw found.error;
  }
  if (!found.data) {
    // No referral attached to this order — perfectly normal case.
    return { flipped: false, reason: "not_found" };
  }
  if (found.data.reward_status === "issued") {
    return {
      flipped: false,
      reason: "already_issued",
      redemption_id: found.data.id,
      reward_issued_usd: found.data.reward_issued_usd,
    };
  }
  if (found.data.reward_status === "revoked") {
    // Revoked (by ops) — do NOT revive on a subsequent ship event. That
    // would defeat the purpose of a manual revoke. If ops revoked in error,
    // they can flip back to 'pending' manually and re-ship.
    return {
      flipped: false,
      reason: "revoked",
      redemption_id: found.data.id,
    };
  }

  // Status is 'pending' → flip to 'issued' with a server timestamp.
  // The `.eq("reward_status", "pending")` clause is a concurrency guard:
  // if another worker raced us and already flipped it, our UPDATE affects
  // zero rows and returns no data (we handle that as already_issued).
  const updated = await supabaseAdmin
    .from("sericia_referral_redemptions")
    .update({
      reward_status: "issued",
      issued_at: new Date().toISOString(),
    })
    .eq("id", found.data.id)
    .eq("reward_status", "pending")
    .select("id, reward_issued_usd")
    .maybeSingle();

  if (updated.error) {
    console.error("[referrals/flip] update failed", updated.error);
    throw updated.error;
  }
  if (!updated.data) {
    // Lost the race — another ship path already flipped it. State is
    // still consistent, so return already_issued rather than an error.
    return {
      flipped: false,
      reason: "already_issued",
      redemption_id: found.data.id,
      reward_issued_usd: found.data.reward_issued_usd,
    };
  }

  return {
    flipped: true,
    redemption_id: updated.data.id,
    reward_issued_usd: updated.data.reward_issued_usd,
  };
}
