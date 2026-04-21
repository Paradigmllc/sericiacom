import AdminShell from "@/components/AdminShell";
import AnalyticsCharts from "./AnalyticsCharts";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics — Sericia Admin", robots: { index: false, follow: false } };

type OrderRow = {
  amount_usd: number;
  country_code: string | null;
  drop_id: string;
  status: string;
  created_at: string;
};

type DropRow = { id: string; title: string };

const DAYS = 30;

function dayKey(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

function buildDayRange(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default async function AdminAnalyticsPage() {
  const sinceIso = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [ordersRes, dropsRes, waitlistRes] = await Promise.all([
    supabaseAdmin
      .from("sericia_orders")
      .select("amount_usd,country_code,drop_id,status,created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true }),
    supabaseAdmin.from("sericia_drops").select("id,title"),
    supabaseAdmin
      .from("sericia_waitlist")
      .select("created_at")
      .gte("created_at", sinceIso),
  ]);

  if (ordersRes.error) console.error("[admin/analytics] orders fetch failed", ordersRes.error);
  if (dropsRes.error) console.error("[admin/analytics] drops fetch failed", dropsRes.error);
  if (waitlistRes.error) console.error("[admin/analytics] waitlist fetch failed", waitlistRes.error);

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const drops = (dropsRes.data ?? []) as DropRow[];
  const waitlist = (waitlistRes.data ?? []) as { created_at: string }[];

  const days = buildDayRange(DAYS);
  const ordersByDay = new Map<string, number>(days.map((d) => [d, 0]));
  const revenueByDay = new Map<string, number>(days.map((d) => [d, 0]));
  const waitlistByDay = new Map<string, number>(days.map((d) => [d, 0]));
  const countryCount = new Map<string, number>();
  const dropCount = new Map<string, { orders: number; revenue: number }>();

  const revenueStatuses = new Set(["paid", "shipped", "delivered"]);

  for (const o of orders) {
    const k = dayKey(o.created_at);
    if (ordersByDay.has(k)) ordersByDay.set(k, (ordersByDay.get(k) ?? 0) + 1);
    if (revenueStatuses.has(o.status) && revenueByDay.has(k)) {
      revenueByDay.set(k, (revenueByDay.get(k) ?? 0) + (o.amount_usd || 0));
    }
    const cc = (o.country_code || "??").toUpperCase();
    countryCount.set(cc, (countryCount.get(cc) ?? 0) + 1);
    const cur = dropCount.get(o.drop_id) ?? { orders: 0, revenue: 0 };
    cur.orders += 1;
    if (revenueStatuses.has(o.status)) cur.revenue += o.amount_usd || 0;
    dropCount.set(o.drop_id, cur);
  }
  for (const w of waitlist) {
    const k = dayKey(w.created_at);
    if (waitlistByDay.has(k)) waitlistByDay.set(k, (waitlistByDay.get(k) ?? 0) + 1);
  }

  const dropTitleById = new Map(drops.map((d) => [d.id, d.title] as const));

  const ordersSeries = days.map((d) => ({
    date: d.slice(5),
    orders: ordersByDay.get(d) ?? 0,
  }));
  const revenueSeries = days.map((d) => ({
    date: d.slice(5),
    revenue: revenueByDay.get(d) ?? 0,
  }));
  const waitlistSeries = days.map((d) => ({
    date: d.slice(5),
    signups: waitlistByDay.get(d) ?? 0,
  }));
  const countrySeries = [...countryCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));
  const topDropsSeries = [...dropCount.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8)
    .map(([id, v]) => ({
      name: (dropTitleById.get(id) ?? id).slice(0, 28),
      orders: v.orders,
      revenue: v.revenue,
    }));

  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => revenueStatuses.has(o.status))
    .reduce((sum, o) => sum + (o.amount_usd || 0), 0);
  const totalWaitlist = waitlist.length;
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <AdminShell title="Analytics">
      <div className="mb-6 text-[13px] text-sericia-ink-soft">Last {DAYS} days</div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-sericia-line border border-sericia-line mb-8">
        <Stat label="Orders" value={String(totalOrders)} />
        <Stat label="Revenue" value={`$${totalRevenue.toLocaleString()}`} />
        <Stat label="Waitlist joins" value={String(totalWaitlist)} />
        <Stat label="Avg order value" value={`$${aov}`} />
      </div>

      <AnalyticsCharts
        ordersSeries={ordersSeries}
        revenueSeries={revenueSeries}
        waitlistSeries={waitlistSeries}
        countrySeries={countrySeries}
        topDropsSeries={topDropsSeries}
      />
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-sericia-paper-card p-6">
      <div className="label mb-2">{label}</div>
      <div className="text-[22px] font-normal">{value}</div>
    </div>
  );
}
