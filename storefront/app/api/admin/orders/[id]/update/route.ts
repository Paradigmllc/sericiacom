import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, shippingNotificationEmail } from "@/lib/email";
import { flipReferralRewardOnShipped } from "@/lib/referrals";

const Schema = z.object({
  status: z.enum(["pending", "paid", "shipped", "delivered", "refunded", "cancelled"]).optional(),
  tracking_number: z.string().max(60).nullable().optional(),
  tracking_carrier: z.string().max(60).nullable().optional(),
});

type UpdatePayload = {
  updated_at: string;
  status?: string;
  tracking_number?: string | null;
  tracking_carrier?: string | null;
  shipped_at?: string;
  delivered_at?: string;
  paid_at?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "unauthorised" }, { status: 401 });
    }
    const { id } = await params;
    const parsed = Schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
    }
    const input = parsed.data;

    const { data: existing } = await supabaseAdmin
      .from("sericia_orders")
      .select("id, status, email, full_name, shipped_at, paid_at, delivered_at")
      .eq("id", id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const update: UpdatePayload = { updated_at: now };
    if (input.status !== undefined) update.status = input.status;
    if (input.tracking_number !== undefined) update.tracking_number = input.tracking_number;
    if (input.tracking_carrier !== undefined) update.tracking_carrier = input.tracking_carrier;

    const statusChanged = input.status && input.status !== existing.status;
    if (input.status === "shipped" && !existing.shipped_at) update.shipped_at = now;
    if (input.status === "delivered" && !existing.delivered_at) update.delivered_at = now;
    if (input.status === "paid" && !existing.paid_at) update.paid_at = now;

    const { error: updateErr } = await supabaseAdmin
      .from("sericia_orders")
      .update(update)
      .eq("id", id);
    if (updateErr) {
      console.error("[admin/orders/update] update failed", updateErr);
      return NextResponse.json({ error: "update_failed", detail: updateErr.message }, { status: 500 });
    }

    // log event
    await supabaseAdmin.from("sericia_events").insert({
      event_name: statusChanged ? `order_status_${input.status}` : "order_updated",
      distinct_id: existing.email,
      order_id: id,
      properties: {
        new_status: input.status ?? null,
        tracking_number: input.tracking_number ?? null,
        tracking_carrier: input.tracking_carrier ?? null,
      },
    });

    // Shipping notification when status transitions to shipped and tracking exists
    let emailSent = false;
    if (
      input.status === "shipped" &&
      existing.status !== "shipped" &&
      input.tracking_number
    ) {
      const html = shippingNotificationEmail({
        full_name: existing.full_name as string,
        order_id: id,
        tracking_number: input.tracking_number,
        tracking_carrier: input.tracking_carrier || "Japan Post EMS",
      });
      const result = await sendEmail({
        to: existing.email as string,
        subject: `Your Sericia order has shipped — ${id.slice(0, 8)}`,
        html,
      });
      emailSent = result.ok;
      if (!result.ok) {
        console.error("[admin/orders/update] shipping email send failed", result.error);
      }
    }

    // Flip the referrer's reward from pending → issued on the status
    // transition into `shipped`. Gated on `existing.status !== "shipped"`
    // so idempotent re-saves (e.g. tracking number corrections) don't
    // re-fire — combined with the helper's own concurrency guard this is
    // double-safe. Non-blocking: referral-ledger failures must not reverse
    // the status change.
    if (input.status === "shipped" && existing.status !== "shipped") {
      try {
        const flip = await flipReferralRewardOnShipped(id);
        if (flip.flipped) {
          console.log(
            `[admin/orders/update] referral reward issued — order=${id} redemption=${flip.redemption_id} amount_usd=${flip.reward_issued_usd}`,
          );
        }
      } catch (referralErr) {
        console.error("[admin/orders/update] referral flip failed (non-fatal)", referralErr);
      }
    }

    return NextResponse.json({ ok: true, email_sent: emailSent });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/orders/update] unhandled", msg, err);
    return NextResponse.json({ error: "unhandled_exception", detail: msg }, { status: 500 });
  }
}
