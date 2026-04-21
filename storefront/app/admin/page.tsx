import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Sericia Admin", robots: { index: false, follow: false } };

type MetricCard = { label: string; value: string; hint?: string };

function dayStart(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function getMetrics() {
  const since1 = dayStart(0);
  const since7 = dayStart(7);
  const since30 = dayStart(30);

  const [r1, r7, r30, pending, lowStock] = await Promise.all([
    supabaseAdmin
      .from("sericia_orders")
      .select("amount_usd", { count: "exact" })
      .gte("created_at", since1),
    supabaseAdmin
      .from("sericia_orders")
      .select("amount_usd", { count: "exact" })
      .gte("created_at", since7),
    supabaseAdmin
      .from("sericia_orders")
      .select("amount_usd", { count: "exact" })
      .gte("created_at", since30),
    supabaseAdmin
      .from("sericia_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabaseAdmin
      .from("sericia_products")
      .select("id", { count: "exact", head: true })
      .lt("stock", 5)
      .eq("status", "active"),
  ]);

  const sum = (rows: { amount_usd: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + Number(r.amount_usd ?? 0), 0);

  return {
    orders1: r1.count ?? 0,
    orders7: r7.count ?? 0,
    orders30: r30.count ?? 0,
    revenue1: sum(r1.data as { amount_usd: number }[] | null),
    revenue7: sum(r7.data as { amount_usd: number }[] | null),
    revenue30: sum(r30.data as { amount_usd: number }[] | null),
    pending: pending.count ?? 0,
    lowStock: lowStock.count ?? 0,
  };
}

async function getRecentOrders() {
  const { data } = await supabaseAdmin
    .from("sericia_orders")
    .select("id, email, amount_usd, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

export default async function AdminDashboardPage() {
  const m = await getMetrics();
  const recent = await getRecentOrders();

  const cards: MetricCard[][] = [
    [
      { label: "Orders today", value: m.orders1.toString() },
      { label: "Orders 7d", value: m.orders7.toString() },
      { label: "Orders 30d", value: m.orders30.toString() },
      { label: "Pending", value: m.pending.toString(), hint: "Requires action" },
    ],
    [
      { label: "Revenue today", value: `$${m.revenue1.toFixed(0)}` },
      { label: "Revenue 7d", value: `$${m.revenue7.toFixed(0)}` },
      { label: "Revenue 30d", value: `$${m.revenue30.toFixed(0)}` },
      { label: "Low stock", value: m.lowStock.toString(), hint: "< 5 units" },
    ],
  ];

  return (
    <AdminShell title="Dashboard">
      {cards.map((row, idx) => (
        <div
          key={idx}
          className="grid grid-cols-1 md:grid-cols-4 gap-px bg-sericia-line border border-sericia-line mb-6"
        >
          {row.map((c) => (
            <div key={c.label} className="bg-sericia-paper-card p-6">
              <div className="label mb-2">{c.label}</div>
              <div className="text-[28px] font-normal leading-none mb-2">{c.value}</div>
              {c.hint && <div className="text-[11px] text-sericia-ink-mute">{c.hint}</div>}
            </div>
          ))}
        </div>
      ))}

      <div className="mt-10">
        <div className="label mb-4">Recent orders</div>
        <div className="border border-sericia-line bg-sericia-paper-card">
          <table className="w-full text-[13px]">
            <thead className="border-b border-sericia-line">
              <tr className="text-left">
                <th className="px-5 py-3 font-normal text-sericia-ink-soft">Order #</th>
                <th className="px-5 py-3 font-normal text-sericia-ink-soft">Email</th>
                <th className="px-5 py-3 font-normal text-sericia-ink-soft">Total</th>
                <th className="px-5 py-3 font-normal text-sericia-ink-soft">Status</th>
                <th className="px-5 py-3 font-normal text-sericia-ink-soft">Created</th>
                <th className="px-5 py-3 font-normal text-sericia-ink-soft"></th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sericia-ink-mute">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recent.map((o) => (
                  <tr key={o.id} className="border-b border-sericia-line last:border-0">
                    <td className="px-5 py-3 font-mono text-[12px]">{o.id.slice(0, 8)}</td>
                    <td className="px-5 py-3">{o.email}</td>
                    <td className="px-5 py-3">${Number(o.amount_usd).toFixed(0)}</td>
                    <td className="px-5 py-3">
                      <StatusChip status={o.status as string} />
                    </td>
                    <td className="px-5 py-3 text-sericia-ink-soft">
                      {new Date(o.created_at as string).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/orders/${o.id}`} className="underline hover:text-sericia-accent">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "text-sericia-ink-mute border-sericia-line",
    paid: "text-sericia-accent border-sericia-accent",
    shipped: "text-sericia-ink border-sericia-ink",
    delivered: "text-sericia-ink border-sericia-ink",
    refunded: "text-red-700 border-red-700",
    cancelled: "text-red-700 border-red-700",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] tracking-[0.14em] uppercase border ${map[status] || "text-sericia-ink-mute border-sericia-line"}`}
    >
      {status}
    </span>
  );
}
