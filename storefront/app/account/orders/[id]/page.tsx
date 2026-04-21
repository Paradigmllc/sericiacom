import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Eyebrow, Rule } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supa = await supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect(`/login?redirect=/account/orders/${id}`);

  const { data: order } = await supabaseAdmin
    .from("sericia_orders")
    .select("*")
    .eq("id", id)
    .eq("email", (user.email || "").toLowerCase())
    .maybeSingle();
  if (!order) notFound();

  const { data: items } = await supabaseAdmin
    .from("sericia_order_items")
    .select("quantity, unit_price_usd, product_snapshot")
    .eq("order_id", id);

  const trackUrl = order.tracking_number
    ? `https://trackings.post.japanpost.jp/services/srv/search?requestNo1=${encodeURIComponent(order.tracking_number)}&locale=en`
    : null;

  return (
    <div>
      <Link href="/account/orders" className="text-[12px] tracking-wider text-sericia-ink-mute hover:text-sericia-ink uppercase">
        ← All orders
      </Link>
      <div className="mt-6">
        <Eyebrow>Order</Eyebrow>
        <h1 className="text-[32px] md:text-[40px] leading-[1.1] font-normal tracking-tight font-mono">{id.slice(0, 8)}</h1>
      </div>

      <Rule className="my-10" />

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <p className="label mb-4">Items</p>
          <div className="border-t border-sericia-line">
            {(items ?? []).map((it, idx) => {
              const snap = (it.product_snapshot ?? {}) as { name?: string; origin_region?: string };
              return (
                <div key={idx} className="flex justify-between py-4 border-b border-sericia-line text-[14px]">
                  <div>
                    <div>{snap.name ?? "Item"}</div>
                    <div className="text-[12px] text-sericia-ink-mute mt-1 tracking-wider uppercase">
                      {snap.origin_region ?? ""} · Qty {it.quantity}
                    </div>
                  </div>
                  <div>${it.unit_price_usd * it.quantity}</div>
                </div>
              );
            })}
            {order.drop_id && (!items || items.length === 0) && (
              <div className="flex justify-between py-4 border-b border-sericia-line text-[14px]">
                <div>{order.drop_id} · Qty {order.quantity}</div>
                <div>${order.amount_usd}</div>
              </div>
            )}
            <div className="flex justify-between py-4 text-[15px] font-medium">
              <span>Total</span>
              <span>${order.amount_usd} USD</span>
            </div>
          </div>
        </div>

        <div>
          <p className="label mb-4">Status</p>
          <div className="border border-sericia-line p-6 mb-8">
            <p className="text-[15px] capitalize mb-2">{order.status}</p>
            <p className="text-[12px] text-sericia-ink-mute">
              Placed {new Date(order.created_at).toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
            {order.paid_at && (
              <p className="text-[12px] text-sericia-ink-mute">
                Paid {new Date(order.paid_at).toLocaleDateString("en-US", { dateStyle: "long" })}
              </p>
            )}
            {order.shipped_at && (
              <p className="text-[12px] text-sericia-ink-mute">
                Shipped {new Date(order.shipped_at).toLocaleDateString("en-US", { dateStyle: "long" })}
              </p>
            )}
          </div>

          {order.tracking_number && trackUrl && (
            <>
              <p className="label mb-4">Tracking</p>
              <div className="border border-sericia-line p-6 mb-8">
                <p className="text-[13px] font-mono break-all mb-1">{order.tracking_number}</p>
                <p className="text-[12px] text-sericia-ink-mute mb-4">{order.tracking_carrier ?? "EMS"}</p>
                <a href={trackUrl} target="_blank" rel="noopener noreferrer"
                   className="text-[13px] tracking-wider border-b border-sericia-ink pb-0.5 hover:text-sericia-accent hover:border-sericia-accent">
                  Track parcel
                </a>
              </div>
            </>
          )}

          <p className="label mb-4">Ship to</p>
          <div className="text-[14px] leading-relaxed text-sericia-ink-soft">
            <div>{order.full_name}</div>
            <div>{order.address_line1}</div>
            {order.address_line2 && <div>{order.address_line2}</div>}
            <div>
              {order.city}{order.region ? `, ${order.region}` : ""} {order.postal_code}
            </div>
            <div>{order.country_code}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
