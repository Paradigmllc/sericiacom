import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const OrderSchema = z.object({
  drop_id: z.string().min(1),
  email: z.string().email(),
  full_name: z.string().min(1).max(120),
  address_line1: z.string().min(1).max(200),
  address_line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100),
  region: z.string().max(100).optional().nullable(),
  postal_code: z.string().min(1).max(30),
  country_code: z.string().length(2),
  phone: z.string().max(30).optional().nullable(),
  quantity: z.number().int().positive().max(5).default(1),
  utm_source: z.string().max(100).optional().nullable(),
  utm_medium: z.string().max(100).optional().nullable(),
  utm_campaign: z.string().max(100).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
  const json = await req.json().catch(() => null);
  const parsed = OrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const { data: drop, error: dropErr } = await supabaseAdmin
    .from("sericia_drops")
    .select("*")
    .eq("id", input.drop_id)
    .maybeSingle();
  if (dropErr || !drop) {
    return NextResponse.json({ error: "drop_not_found" }, { status: 404 });
  }
  if (drop.status !== "active") {
    return NextResponse.json({ error: "drop_inactive" }, { status: 409 });
  }
  const remaining = drop.total_units - drop.sold_units;
  if (remaining < input.quantity) {
    return NextResponse.json({ error: "insufficient_inventory", remaining }, { status: 409 });
  }

  const amount = drop.price_usd * input.quantity;
  const ipCountry = req.headers.get("cf-ipcountry") ?? null;

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("sericia_orders")
    .insert({
      drop_id: input.drop_id,
      email: input.email.toLowerCase().trim(),
      full_name: input.full_name.trim(),
      address_line1: input.address_line1.trim(),
      address_line2: input.address_line2?.trim() || null,
      city: input.city.trim(),
      region: input.region?.trim() || null,
      postal_code: input.postal_code.trim(),
      country_code: input.country_code.toUpperCase(),
      phone: input.phone?.trim() || null,
      quantity: input.quantity,
      amount_usd: amount,
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
    console.error("[orders/create] insert failed", orderErr);
    return NextResponse.json({ error: "order_create_failed", detail: orderErr?.message ?? null, code: orderErr?.code ?? null }, { status: 500 });
  }

  await supabaseAdmin.from("sericia_events").insert({
    event_name: "order_created",
    distinct_id: input.email.toLowerCase().trim(),
    drop_id: input.drop_id,
    order_id: order.id,
    country_code: input.country_code.toUpperCase(),
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
    properties: { amount_usd: amount, quantity: input.quantity },
  });

  return NextResponse.json({ order_id: order.id, amount_usd: order.amount_usd });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[orders/create] unhandled exception", message, err);
    return NextResponse.json({ error: "unhandled_exception", detail: message }, { status: 500 });
  }
}
