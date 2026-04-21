import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Crossmint webhook receiver.
 * On payment success: mark order paid, decrement drop inventory,
 * send Resend confirmation, notify n8n.
 * Docs: https://docs.crossmint.com/payments/advanced/webhooks
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signatureHeader = req.headers.get("x-crossmint-signature") ?? req.headers.get("svix-signature");
  const secret = process.env.CROSSMINT_WEBHOOK_SECRET;

  if (secret && signatureHeader) {
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("base64");
    if (!signatureHeader.includes(expected)) {
      console.warn("[crossmint-webhook] signature mismatch");
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  } else if (secret) {
    console.warn("[crossmint-webhook] signature header missing");
    return NextResponse.json({ error: "missing_signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventType = (body?.type as string) ?? (body?.event as string) ?? "";
  const data = (body?.data as Record<string, unknown>) ?? body;
  const metadata = (data?.metadata as Record<string, unknown>) ?? {};
  const sericiaOrderId = metadata?.sericia_order_id as string | undefined;
  const crossmintOrderId = (data?.orderId as string) ?? (data?.id as string) ?? null;
  const txHash = (data?.txId as string) ?? null;

  if (!sericiaOrderId) {
    console.warn("[crossmint-webhook] no sericia_order_id in metadata", { eventType });
    return NextResponse.json({ ok: true, skipped: "no_order_id" });
  }

  const isSuccess = /success|completed|paid/i.test(eventType);
  const isFailed = /failed|rejected|cancelled/i.test(eventType);

  if (isSuccess) {
    const { data: order } = await supabaseAdmin
      .from("sericia_orders")
      .select("id, drop_id, status, email, full_name, amount_usd, quantity")
      .eq("id", sericiaOrderId)
      .maybeSingle();
    if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    if (order.status === "paid" || order.status === "shipped") {
      return NextResponse.json({ ok: true, already_processed: true });
    }

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("sericia_orders")
      .update({ status: "paid", crossmint_order_id: crossmintOrderId, tx_hash: txHash, paid_at: now, updated_at: now })
      .eq("id", order.id);

    const { data: drop } = await supabaseAdmin
      .from("sericia_drops")
      .select("sold_units, total_units, title")
      .eq("id", order.drop_id)
      .maybeSingle();
    if (drop) {
      const newSold = Math.min(drop.sold_units + order.quantity, drop.total_units);
      await supabaseAdmin
        .from("sericia_drops")
        .update({ sold_units: newSold, status: newSold >= drop.total_units ? "sold_out" : "active" })
        .eq("id", order.drop_id);
    }

    await supabaseAdmin.from("sericia_events").insert({
      event_name: "order_paid",
      distinct_id: order.email,
      drop_id: order.drop_id,
      order_id: order.id,
      properties: { amount_usd: order.amount_usd },
    });

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Sericia <contact@sericia.com>",
          to: order.email,
          subject: `Your Sericia drop is on the way — ${drop?.title ?? ""}`,
          html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2b221c">
            <h1 style="font-weight:normal">Thank you, ${order.full_name.split(" ")[0]}.</h1>
            <p>We've received your payment for <strong>${drop?.title ?? "your Sericia drop"}</strong>.</p>
            <p>Your package ships from Japan within 48 hours via EMS. Tracking arrives by email once scanned.</p>
            <hr style="border:none;border-top:1px solid #e8e0d3;margin:24px 0" />
            <p style="font-size:13px;color:#6b5e4f">Order ID: ${order.id}<br/>Amount: $${order.amount_usd} USD</p>
            <p style="font-size:13px;color:#6b5e4f">Questions? Reply or write <a href="mailto:contact@sericia.com">contact@sericia.com</a>.</p>
          </div>`,
        }),
        signal: AbortSignal.timeout(10_000),
      }).catch((e) => console.error("[crossmint-webhook] resend failed", e));
    }

    const n8n = process.env.N8N_ESCALATION_WEBHOOK;
    if (n8n) {
      fetch(n8n, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order_paid",
          order_id: order.id,
          drop_id: order.drop_id,
          amount_usd: order.amount_usd,
          email: order.email,
        }),
        signal: AbortSignal.timeout(5_000),
      }).catch((e) => console.error("[crossmint-webhook] n8n failed", e));
    }
    return NextResponse.json({ ok: true, order_id: order.id, status: "paid" });
  }

  if (isFailed) {
    await supabaseAdmin
      .from("sericia_orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", sericiaOrderId);
    return NextResponse.json({ ok: true, order_id: sericiaOrderId, status: "cancelled" });
  }

  return NextResponse.json({ ok: true, event: eventType, ignored: true });
}
