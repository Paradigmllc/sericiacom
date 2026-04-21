import { notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import StatusChip from "@/components/admin/StatusChip";
import OrderActions from "./OrderActions";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order — Sericia Admin", robots: { index: false, follow: false } };

type OrderEvent = {
  id: string;
  event_name: string;
  created_at: string;
  properties: Record<string, unknown> | null;
};

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: order } = await supabaseAdmin
    .from("sericia_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const { data: events } = await supabaseAdmin
    .from("sericia_events")
    .select("id, event_name, created_at, properties")
    .eq("order_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AdminShell title={`Order ${id.slice(0, 8)}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="border border-sericia-line bg-sericia-paper-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="label mb-1">Customer</div>
                <div className="text-[16px]">{order.full_name}</div>
                <div className="text-[13px] text-sericia-ink-soft">{order.email}</div>
                {order.phone && (
                  <div className="text-[13px] text-sericia-ink-soft">{order.phone}</div>
                )}
              </div>
              <StatusChip status={order.status as string} />
            </div>
            <div className="border-t border-sericia-line pt-4 mt-4">
              <div className="label mb-2">Ship to</div>
              <div className="text-[14px] leading-relaxed">
                {order.address_line1}
                {order.address_line2 && (
                  <>
                    <br />
                    {order.address_line2}
                  </>
                )}
                <br />
                {order.city}
                {order.region ? `, ${order.region}` : ""} {order.postal_code}
                <br />
                {order.country_code}
              </div>
            </div>
          </section>

          <section className="border border-sericia-line bg-sericia-paper-card p-6">
            <div className="label mb-4">Line items</div>
            <table className="w-full text-[14px]">
              <tbody>
                <tr className="border-b border-sericia-line">
                  <td className="py-3">
                    <div>Drop: {order.drop_id}</div>
                    <div className="text-sericia-ink-soft text-[12px]">Quantity: {order.quantity}</div>
                  </td>
                  <td className="py-3 text-right">
                    ${Number(order.amount_usd).toFixed(2)} {order.currency}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Total</td>
                  <td className="py-3 text-right font-medium">
                    ${Number(order.amount_usd).toFixed(2)} {order.currency}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="border border-sericia-line bg-sericia-paper-card p-6">
            <div className="label mb-4">Timeline</div>
            <dl className="grid grid-cols-2 gap-4 text-[13px] mb-4">
              <div>
                <dt className="label mb-1">Created</dt>
                <dd>{new Date(order.created_at as string).toLocaleString()}</dd>
              </div>
              {order.paid_at && (
                <div>
                  <dt className="label mb-1">Paid</dt>
                  <dd>{new Date(order.paid_at as string).toLocaleString()}</dd>
                </div>
              )}
              {order.shipped_at && (
                <div>
                  <dt className="label mb-1">Shipped</dt>
                  <dd>{new Date(order.shipped_at as string).toLocaleString()}</dd>
                </div>
              )}
              {order.delivered_at && (
                <div>
                  <dt className="label mb-1">Delivered</dt>
                  <dd>{new Date(order.delivered_at as string).toLocaleString()}</dd>
                </div>
              )}
            </dl>
            <div className="label mb-2">Event log</div>
            <ul className="text-[12px] divide-y divide-sericia-line">
              {(events ?? []).length === 0 && (
                <li className="py-2 text-sericia-ink-mute">No events recorded.</li>
              )}
              {((events ?? []) as OrderEvent[]).map((e) => (
                <li key={e.id} className="py-2 flex justify-between gap-4">
                  <span className="font-mono">{e.event_name}</span>
                  <span className="text-sericia-ink-soft">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:col-span-1">
          <OrderActions
            orderId={id}
            status={order.status as string}
            trackingNumber={order.tracking_number}
            trackingCarrier={order.tracking_carrier}
          />
        </aside>
      </div>
    </AdminShell>
  );
}
