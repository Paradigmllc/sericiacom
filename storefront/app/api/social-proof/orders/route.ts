import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

/**
 * GET /api/social-proof/orders
 *
 * Returns the most recent anonymized order signals for the live social-proof
 * toast. **Only two fields are exposed:**
 *   • country_code — for a 🇯🇵 flag + "Japan" label
 *   • paid_at — for a "3h ago" relative timestamp
 *
 * No email, name, address, city, order id, product name, quantity, or amount.
 * This is the minimum viable payload for trust-signalling without leaking PII —
 * compatible with GDPR legitimate-interest reasoning (country is not PII on its
 * own; timestamp is coarse enough to not re-identify an individual).
 *
 * We filter to the last 30 days + paid/shipped/delivered statuses so cancelled
 * or pending orders never surface.
 */
export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("sericia_orders")
      .select("country_code, paid_at")
      .in("status", ["paid", "shipped", "delivered"])
      .gte("paid_at", thirtyDaysAgo)
      .not("country_code", "is", null)
      .order("paid_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[social-proof] query failed", error);
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    // Defensive normalization — trim + uppercase country codes, drop malformed rows
    const items = (data ?? [])
      .filter((r) => typeof r.country_code === "string" && r.country_code.length === 2 && r.paid_at)
      .map((r) => ({
        country_code: r.country_code.toUpperCase(),
        paid_at: r.paid_at,
      }));

    // Cache for 2 minutes at the edge (social proof doesn't need real-time)
    return NextResponse.json(
      { items },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
      },
    );
  } catch (err) {
    console.error("[social-proof] unexpected error", err);
    // Silent fallback — social proof is decorative; never crash the UI if the
    // query layer is misbehaving
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
