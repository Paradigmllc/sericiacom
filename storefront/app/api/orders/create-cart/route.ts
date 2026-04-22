import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseServer } from "@/lib/supabase-server";
import { sendEmail, orderConfirmationEmail } from "@/lib/email";
import { getProductsByIds } from "@/lib/products";
import { notifySlackOrderCreated } from "@/lib/slack";

/**
 * Cart checkout → sericia_orders creation.
 *
 * M4a-2 (2026-04-21): rewired prices & stock to Medusa Store API as the source
 * of truth. `sericia_orders` remains the transactional ledger (Crossmint reads
 * `amount_usd` from this row to build the Stripe session), but the legacy
 * `sericia_products` table is no longer consulted.
 *
 * Inventory decrement: NOT done here. Per Medusa's model, inventory is
 * decremented on payment success via `medusa-backend/src/subscribers/order-placed.ts`
 * (see M4a-4). The small race window (two buyers hitting "Continue to payment"
 * at the same time on low-stock items) is acceptable at launch traffic and is
 * gated by the current inventory_quantity check below.
 *
 * Notifications: emits `order_created` event to sericia_events AND fires a
 * Slack webhook (Rule N: DB bell + Slack both-channel). Slack failure is soft —
 * checkout must not block on Slack outages.
 */

const ItemSchema = z.object({
  product_id: z.string().min(1).max(100),
  quantity: z.number().int().positive().max(20),
});

const Schema = z.object({
  items: z.array(ItemSchema).min(1).max(20),
  email: z.string().email(),
  full_name: z.string().min(1).max(120),
  address_line1: z.string().min(1).max(200),
  address_line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100),
  region: z.string().max(100).optional().nullable(),
  postal_code: z.string().min(1).max(30),
  country_code: z.string().length(2),
  phone: z.string().max(30).optional().nullable(),
  utm_source: z.string().max(100).optional().nullable(),
  utm_medium: z.string().max(100).optional().nullable(),
  utm_campaign: z.string().max(100).optional().nullable(),
  // Referral program — referee applies a code at checkout. NEVER trust the
  // client's discount amount; we re-validate server-side.
  referral_code: z.string().max(32).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
    }
    const input = parsed.data;

    // Fetch products from Medusa (authoritative prices + stock). Product IDs
    // in the cart store are now Medusa prod_* IDs via the facade cutover.
    const productIds = input.items.map((i) => i.product_id);
    const products = await getProductsByIds(productIds);
    if (products.length !== productIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = productIds.find((id) => !found.has(id));
      return NextResponse.json({ error: "product_not_found", product_id: missing ?? null }, { status: 404 });
    }

    // Validate stock and compute total
    let totalUsd = 0;
    const itemsPayload: Array<{
      product_id: string;
      quantity: number;
      unit_price_usd: number;
      product_snapshot: unknown;
    }> = [];

    for (const line of input.items) {
      const product = products.find((p) => p.id === line.product_id);
      if (!product) {
        return NextResponse.json({ error: "product_not_found", product_id: line.product_id }, { status: 404 });
      }
      if (product.status !== "active") {
        return NextResponse.json({ error: "product_inactive", product_id: line.product_id }, { status: 409 });
      }
      if (product.stock < line.quantity) {
        return NextResponse.json({
          error: "insufficient_stock",
          product_id: line.product_id,
          available: product.stock,
        }, { status: 409 });
      }
      totalUsd += product.price_usd * line.quantity;
      itemsPayload.push({
        product_id: product.id,
        quantity: line.quantity,
        unit_price_usd: product.price_usd,
        product_snapshot: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          weight_g: product.weight_g,
          origin_region: product.origin_region,
          producer_name: product.producer_name,
          category: product.category,
        },
      });
    }

    // Try to attach to auth user if signed in
    let userId: string | null = null;
    try {
      const supa = await supabaseServer();
      const { data: { user } } = await supa.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    const ipCountry = req.headers.get("cf-ipcountry") ?? null;
    const totalQty = input.items.reduce((s, i) => s + i.quantity, 0);

    // Referral validation — server-side is the source of truth. Self-referral
    // and inactive codes are silently ignored (no user-visible error, checkout
    // continues without the discount). Returning 400 here would punish
    // returning customers who pasted an old personal link on a second order.
    const emailLower = input.email.toLowerCase().trim();
    type ReferralRow = {
      id: string;
      user_id: string | null;
      email: string;
      code: string;
      discount_amount_usd: number;
      referrer_reward_usd: number;
      is_active: boolean;
      redemption_count: number;
      redemption_limit: number | null;
    };
    let referralApplied: ReferralRow | null = null;
    let referralDiscountUsd = 0;
    if (input.referral_code) {
      const code = input.referral_code.trim().toUpperCase();
      const { data: codeRow, error: codeErr } = await supabaseAdmin
        .from("sericia_referral_codes")
        .select("id, user_id, email, code, discount_amount_usd, referrer_reward_usd, is_active, redemption_count, redemption_limit")
        .eq("code", code)
        .maybeSingle();
      if (codeErr) {
        console.error("[orders/create-cart] referral lookup", codeErr);
        // Non-fatal — continue without discount.
      } else if (codeRow && codeRow.is_active) {
        const row = codeRow as ReferralRow;
        const limitOk = row.redemption_limit === null || row.redemption_count < row.redemption_limit;
        const selfReferral = row.email.toLowerCase() === emailLower;
        if (limitOk && !selfReferral) {
          referralApplied = row;
          referralDiscountUsd = row.discount_amount_usd;
        }
      }
    }

    const totalAfterReferral = Math.max(0, totalUsd - referralDiscountUsd);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("sericia_orders")
      .insert({
        drop_id: null,
        order_type: "cart",
        email: emailLower,
        full_name: input.full_name.trim(),
        address_line1: input.address_line1.trim(),
        address_line2: input.address_line2?.trim() || null,
        city: input.city.trim(),
        region: input.region?.trim() || null,
        postal_code: input.postal_code.trim(),
        country_code: input.country_code.toUpperCase(),
        phone: input.phone?.trim() || null,
        quantity: totalQty,
        amount_usd: totalAfterReferral,
        currency: "USD",
        status: "pending",
        ip_country: ipCountry,
        utm_source: input.utm_source ?? null,
        utm_medium: input.utm_medium ?? null,
        utm_campaign: input.utm_campaign ?? null,
      })
      .select("id, amount_usd")
      .single();

    if (orderErr || !order) {
      console.error("[orders/create-cart] insert failed", orderErr);
      return NextResponse.json({
        error: "order_create_failed",
        detail: orderErr?.message ?? null,
        code: orderErr?.code ?? null,
      }, { status: 500 });
    }

    // Insert order items
    const itemInserts = itemsPayload.map((it) => ({ order_id: order.id, ...it }));
    const { error: itemsErr } = await supabaseAdmin
      .from("sericia_order_items")
      .insert(itemInserts);
    if (itemsErr) {
      console.error("[orders/create-cart] items insert failed", itemsErr);
      // rollback order
      await supabaseAdmin.from("sericia_orders").delete().eq("id", order.id);
      return NextResponse.json({
        error: "order_items_failed",
        detail: itemsErr.message,
      }, { status: 500 });
    }

    // Referral redemption log — written only after the order row is created,
    // so the foreign key to sericia_orders.id is valid. Reward stays "pending"
    // until the order ships; the flip to "issued" happens in
    // lib/referrals.ts :: flipReferralRewardOnShipped(), called from both
    // /api/orders/[id]/ship and /api/admin/orders/[id]/update on the
    // status-change into `shipped`. (Historically this comment pointed at
    // the Medusa order-placed subscriber — that hook is wrong for the
    // Supabase-backed redemption table.) If ops later revoke a shipped
    // order, `reward_status='revoked'` is set manually via SQL. The
    // (code_id, order_id) unique constraint handles idempotency for any
    // retry path.
    if (referralApplied) {
      const { error: redemptionErr } = await supabaseAdmin
        .from("sericia_referral_redemptions")
        .insert({
          code_id: referralApplied.id,
          referrer_user_id: referralApplied.user_id,
          referrer_email: referralApplied.email,
          referee_email: emailLower,
          order_id: order.id,
          discount_applied_usd: referralDiscountUsd,
          reward_issued_usd: referralApplied.referrer_reward_usd,
          reward_status: "pending",
        });
      if (redemptionErr) {
        // Non-fatal: the order is already created with the discounted amount.
        // Log for manual reconciliation. Unique-violation (23505) means we
        // already logged this (retry path) — safe to ignore.
        if (redemptionErr.code !== "23505") {
          console.error("[orders/create-cart] redemption insert failed", redemptionErr);
        }
      } else {
        // Bump counter on the code row (best-effort; the ledger is the
        // redemptions table, this is just a cached aggregate for the /me page).
        await supabaseAdmin
          .from("sericia_referral_codes")
          .update({ redemption_count: referralApplied.redemption_count + 1 })
          .eq("id", referralApplied.id);
      }
    }

    // Event log (Rule N half #1: DB bell)
    await supabaseAdmin.from("sericia_events").insert({
      event_name: "order_created",
      distinct_id: emailLower,
      order_id: order.id,
      country_code: input.country_code.toUpperCase(),
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null,
      properties: {
        amount_usd: totalAfterReferral,
        subtotal_usd: totalUsd,
        referral_discount_usd: referralDiscountUsd,
        referral_code: referralApplied?.code ?? null,
        quantity: totalQty,
        type: "cart",
        user_id: userId,
      },
    });

    // Rule N half #2: Slack — fire-and-forget, non-blocking
    notifySlackOrderCreated({
      order_id: order.id,
      email: emailLower,
      full_name: input.full_name.trim(),
      amount_usd: totalAfterReferral,
      country_code: input.country_code.toUpperCase(),
      item_names: itemsPayload.map((it) => {
        const snap = it.product_snapshot as { name: string };
        return `${snap.name} × ${it.quantity}`;
      }),
    }).catch((e) => console.error("[orders/create-cart] slack notify exception", e));

    // Send order confirmation email (best-effort)
    try {
      const html = orderConfirmationEmail({
        full_name: input.full_name.trim(),
        order_id: order.id,
        items: itemsPayload.map((it) => {
          const snap = it.product_snapshot as { name: string };
          return {
            name: snap.name,
            quantity: it.quantity,
            unit_price_usd: it.unit_price_usd,
          };
        }),
        total_usd: totalAfterReferral,
        shipping: {
          address_line1: input.address_line1.trim(),
          address_line2: input.address_line2?.trim() ?? null,
          city: input.city.trim(),
          region: input.region?.trim() ?? null,
          postal_code: input.postal_code.trim(),
          country_code: input.country_code.toUpperCase(),
        },
      });
      await sendEmail({
        to: emailLower,
        subject: `Sericia order confirmed — ${order.id.slice(0, 8)}`,
        html,
      });
    } catch (err) {
      console.error("[orders/create-cart] email failed (non-fatal)", err);
    }

    return NextResponse.json({ order_id: order.id, amount_usd: order.amount_usd });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders/create-cart] unhandled", msg, err);
    return NextResponse.json({ error: "unhandled_exception", detail: msg }, { status: 500 });
  }
}
