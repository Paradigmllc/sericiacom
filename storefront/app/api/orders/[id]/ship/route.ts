import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, shippingNotificationEmail } from "@/lib/email";

const Schema = z.object({
  tracking_number: z.string().min(1).max(60),
  tracking_carrier: z.string().min(1).max(60).default("EMS / Japan Post"),
});

function authorise(req: NextRequest): boolean {
  const secret = process.env.SERICIA_ADMIN_SECRET;
  if (!secret) return false;
  const provided = req.headers.get("x-admin-secret") || "";
  return provided === secret;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!authorise(req)) {
      return NextResponse.json({ error: "unauthorised" }, { status: 401 });
    }
    const { id } = await params;
    const parsed = Schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("sericia_orders")
      .update({
        tracking_number: parsed.data.tracking_number,
        tracking_carrier: parsed.data.tracking_carrier,
        status: "shipped",
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("email, full_name")
      .single();

    if (error || !order) {
      console.error("[orders/ship] update failed", error);
      return NextResponse.json({ error: "update_failed", detail: error?.message }, { status: 500 });
    }

    const html = shippingNotificationEmail({
      full_name: order.full_name,
      order_id: id,
      tracking_number: parsed.data.tracking_number,
      tracking_carrier: parsed.data.tracking_carrier,
    });
    const result = await sendEmail({
      to: order.email,
      subject: `Your Sericia order has shipped — ${id.slice(0, 8)}`,
      html,
    });
    if (!result.ok) {
      console.error("[orders/ship] email send failed (non-fatal)", result.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders/ship] unhandled", msg, err);
    return NextResponse.json({ error: "unhandled_exception", detail: msg }, { status: 500 });
  }
}
