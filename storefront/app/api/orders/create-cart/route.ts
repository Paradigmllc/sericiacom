import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseServer } from "@/lib/supabase-server";
import { sendEmail, orderConfirmationEmail } from "@/lib/email";

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
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
    }
    const input = parsed.data;

    // Fetch products from DB (authoritative prices and stock)
    const productIds = input.items.map((i) => i.product_id);
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("sericia_products")
      .select("*")
      .in("id", productIds);
    if (prodErr) {
      console.error("[orders/create-cart] fetch products failed", prodErr);
      return NextResponse.json({ error: "products_fetch_failed", detail: prodErr.message }, { status: 500 });
    }
    if (!products || products.length !== productIds.length) {
      return NextResponse.json({ error: "product_not_found" }, { status: 404 });
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

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("sericia_orders")
      .insert({
        drop_id: null,
        order_type: "cart",
        email: input.email.toLowerCase().trim(),
        full_name: input.full_name.trim(),
        address_line1: input.address_line1.trim(),
        address_line2: input.address_line2?.trim() || null,
        city: input.city.trim(),
        region: input.region?.trim() || null,
        postal_code: input.postal_code.trim(),
        country_code: input.country_code.toUpperCase(),
        phone: input.phone?.trim() || null,
        quantity: totalQty,
        amount_usd: totalUsd,
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

    // Decrement stock
    for (const line of input.items) {
      const product = products.find((p) => p.id === line.product_id);
      if (!product) continue;
      await supabaseAdmin
        .from("sericia_products")
        .update({ stock: Math.max(0, product.stock - line.quantity), updated_at: new Date().toISOString() })
        .eq("id", product.id);
    }

    // Event
    await supabaseAdmin.from("sericia_events").insert({
      event_name: "order_created",
      distinct_id: input.email.toLowerCase().trim(),
      order_id: order.id,
      country_code: input.country_code.toUpperCase(),
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null,
      properties: { amount_usd: totalUsd, quantity: totalQty, type: "cart", user_id: userId },
    });

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
        total_usd: totalUsd,
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
        to: input.email.toLowerCase().trim(),
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
