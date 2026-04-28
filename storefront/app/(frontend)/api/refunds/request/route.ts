import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/refunds/request — customer-facing refund/return inquiry endpoint.
 *
 * Pairs with /refund/request page. Persists to `sericia_refund_requests` for
 * the operator to triage and emails both sides:
 *   • Customer: confirmation that we received the request
 *   • Operator (#all-paradigm or contact@sericia.com): the request body so
 *     it lands in the operator's inbox without needing to log into Supabase.
 *
 * Validation (Zod):
 *   - email is the source of truth for matching against existing orders
 *   - order_id is optional but strongly recommended; if blank we still
 *     accept so visitors who lost their email can write in.
 *   - reason has a 6-option enum (matches /refund policy categories) plus
 *     a required free-text description.
 *
 * No file uploads in v1 — operator follows up via email if photos are
 * needed (per /refund policy).
 */

const Schema = z.object({
  email: z.string().email("Valid email required"),
  full_name: z.string().min(1, "Name required").max(120),
  order_id: z.string().optional().default(""),
  reason: z.enum([
    "damaged_in_transit",
    "spoiled_on_arrival",
    "wrong_item",
    "lost_in_transit",
    "delayed_30_days",
    "other",
  ]),
  description: z.string().min(20, "Please describe the issue (20+ chars)").max(2000),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Persist; surface operator visibility in /admin without needing Resend.
  const { data: row, error: insertErr } = await supabaseAdmin
    .from("sericia_refund_requests")
    .insert({
      email: data.email.toLowerCase().trim(),
      full_name: data.full_name.trim(),
      order_id: data.order_id?.trim() || null,
      reason: data.reason,
      description: data.description.trim(),
      status: "open",
    })
    .select("id")
    .single();
  if (insertErr) {
    console.error("[refunds/request] insert failed", insertErr);
    return NextResponse.json({ error: "persist_failed" }, { status: 500 });
  }

  // Best-effort email notification (non-blocking — visitor sees success
  // immediately even if Resend hiccups).
  try {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey) {
      const resend = new Resend(resendKey);
      const FROM = process.env.SERICIA_EMAIL_FROM || "Sericia <hello@sericia.com>";
      const reasonLabel: Record<typeof data.reason, string> = {
        damaged_in_transit: "Damaged in transit",
        spoiled_on_arrival: "Spoiled on arrival",
        wrong_item: "Wrong item shipped",
        lost_in_transit: "Lost in transit",
        delayed_30_days: "Delayed 30+ days",
        other: "Other",
      };
      // Customer confirmation (Aesop-tone, no exclamation marks)
      await resend.emails.send({
        from: FROM,
        to: data.email,
        subject: `Refund request received — ${row.id.slice(0, 8)}`,
        html: customerConfirmationHtml({
          full_name: data.full_name,
          request_id: row.id,
          reason: reasonLabel[data.reason],
        }),
      });
      // Operator notification (CC to contact@ so the inbox sees it)
      await resend.emails.send({
        from: FROM,
        to: "contact@sericia.com",
        subject: `[REFUND] ${reasonLabel[data.reason]} — ${data.email}`,
        html: operatorNotificationHtml({
          ...data,
          reasonLabel: reasonLabel[data.reason],
          request_id: row.id,
        }),
        replyTo: data.email,
      });
    }
  } catch (e) {
    console.error("[refunds/request] email failed (non-fatal)", e);
  }

  return NextResponse.json({ ok: true, request_id: row.id });
}

function customerConfirmationHtml(opts: {
  full_name: string;
  request_id: string;
  reason: string;
}): string {
  return `<!doctype html>
<html><body style="margin:0;padding:48px 16px;background:#f4f0e8;font-family:'Noto Sans',system-ui,sans-serif;color:#2a2a27;">
  <table width="560" align="center" cellspacing="0" cellpadding="0" style="margin:0 auto;background:#fff;border:1px solid #e5e1d7;">
    <tr><td style="padding:40px 40px 24px;border-bottom:1px solid #e5e1d7;font-size:14px;letter-spacing:0.25em;text-transform:uppercase;">Sericia</td></tr>
    <tr><td style="padding:40px;">
      <h1 style="font-size:24px;font-weight:400;margin:0 0 20px;letter-spacing:-0.01em;line-height:1.2;">Refund request received</h1>
      <p style="font-size:15px;line-height:1.65;color:#5a5546;margin:0 0 16px;">${opts.full_name}, we&rsquo;ve received your refund request and will review within forty-eight hours during Japan business hours.</p>
      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8578;margin:24px 0 8px;">Reference</div>
      <div style="font-family:ui-monospace,Consolas,monospace;font-size:13px;color:#5a5546;margin-bottom:16px;">${opts.request_id}</div>
      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8578;margin:0 0 8px;">Issue type</div>
      <div style="font-size:14px;color:#2a2a27;margin-bottom:24px;">${opts.reason}</div>
      <p style="font-size:13px;line-height:1.65;color:#5a5546;margin:0;">If we need photographs or further detail we&rsquo;ll reach out from contact@sericia.com.</p>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;border-top:1px solid #e5e1d7;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8578;">Sericia &mdash; Rescued Japanese Craft &middot; Shipped from Kyoto</td></tr>
  </table>
</body></html>`;
}

function operatorNotificationHtml(opts: {
  email: string;
  full_name: string;
  order_id: string;
  reasonLabel: string;
  description: string;
  request_id: string;
}): string {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f0e8;font-family:system-ui,sans-serif;color:#2a2a27;">
  <table width="600" align="center" cellspacing="0" cellpadding="0" style="margin:0 auto;background:#fff;border:1px solid #e5e1d7;">
    <tr><td style="padding:24px;">
      <h1 style="font-size:18px;margin:0 0 16px;">[REFUND] ${opts.reasonLabel}</h1>
      <table cellspacing="0" cellpadding="6" style="font-size:13px;border-collapse:collapse;width:100%;">
        <tr><td style="border-bottom:1px solid #e5e1d7;color:#8a8578;width:120px;">Request ID</td><td style="border-bottom:1px solid #e5e1d7;font-family:ui-monospace,Consolas,monospace;">${opts.request_id}</td></tr>
        <tr><td style="border-bottom:1px solid #e5e1d7;color:#8a8578;">Email</td><td style="border-bottom:1px solid #e5e1d7;"><a href="mailto:${opts.email}">${opts.email}</a></td></tr>
        <tr><td style="border-bottom:1px solid #e5e1d7;color:#8a8578;">Name</td><td style="border-bottom:1px solid #e5e1d7;">${opts.full_name}</td></tr>
        <tr><td style="border-bottom:1px solid #e5e1d7;color:#8a8578;">Order ID</td><td style="border-bottom:1px solid #e5e1d7;font-family:ui-monospace,Consolas,monospace;">${opts.order_id || "(not provided)"}</td></tr>
        <tr><td style="border-bottom:1px solid #e5e1d7;color:#8a8578;">Reason</td><td style="border-bottom:1px solid #e5e1d7;">${opts.reasonLabel}</td></tr>
      </table>
      <h2 style="font-size:14px;margin:20px 0 8px;color:#8a8578;text-transform:uppercase;letter-spacing:0.18em;">Description</h2>
      <p style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(opts.description)}</p>
      <p style="margin-top:24px;font-size:12px;color:#8a8578;">Reply directly to this email — replies route to ${opts.email}.</p>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
