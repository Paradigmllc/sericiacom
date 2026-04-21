import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import StatusChip from "@/components/admin/StatusChip";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders — Sericia Admin", robots: { index: false, follow: false } };

const STATUSES = ["all", "pending", "paid", "shipped", "delivered", "refunded", "cancelled"] as const;

type SearchParams = Promise<{
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: string;
}>;

const PAGE_SIZE = 50;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const status = (sp.status || "all").toLowerCase();
  const q = (sp.q || "").trim();
  const from = sp.from || "";
  const to = sp.to || "";
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  let query = supabaseAdmin
    .from("sericia_orders")
    .select("id, email, country_code, quantity, amount_usd, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.ilike("email", `%${q}%`);
  if (from) query = query.gte("created_at", new Date(from).toISOString());
  if (to) {
    const toDate = new Date(to);
    toDate.setUTCHours(23, 59, 59, 999);
    query = query.lte("created_at", toDate.toISOString());
  }

  const offset = (page - 1) * PAGE_SIZE;
  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data, count } = await query;
  const orders = data ?? [];
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  const qs = (p: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    Object.entries(p).forEach(([k, v]) => params.set(k, String(v)));
    return params.toString();
  };

  return (
    <AdminShell title="Orders">
      <form method="get" className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 items-end">
        <div>
          <label className="label block mb-2">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="w-full border border-sericia-line bg-sericia-paper-card py-2 px-3 text-[13px] focus:outline-none focus:border-sericia-ink"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label block mb-2">Email contains</label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            className="w-full border border-sericia-line bg-sericia-paper-card py-2 px-3 text-[13px] focus:outline-none focus:border-sericia-ink"
          />
        </div>
        <div>
          <label className="label block mb-2">From</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="w-full border border-sericia-line bg-sericia-paper-card py-2 px-3 text-[13px] focus:outline-none focus:border-sericia-ink"
          />
        </div>
        <div>
          <label className="label block mb-2">To</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="w-full border border-sericia-line bg-sericia-paper-card py-2 px-3 text-[13px] focus:outline-none focus:border-sericia-ink"
          />
        </div>
        <button
          type="submit"
          className="bg-sericia-ink text-sericia-paper py-2 px-4 text-[13px] tracking-wider hover:bg-sericia-accent transition"
        >
          Filter
        </button>
      </form>

      <div className="border border-sericia-line bg-sericia-paper-card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b border-sericia-line">
            <tr className="text-left">
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Order #</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Date</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Email</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Country</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Qty</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Total</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Status</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sericia-ink-mute">
                  No orders match the filters.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-sericia-line last:border-0">
                  <td className="px-5 py-3 font-mono text-[12px]">{o.id.slice(0, 8)}</td>
                  <td className="px-5 py-3 text-sericia-ink-soft">
                    {new Date(o.created_at as string).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">{o.email}</td>
                  <td className="px-5 py-3">{o.country_code}</td>
                  <td className="px-5 py-3">{o.quantity}</td>
                  <td className="px-5 py-3">${Number(o.amount_usd).toFixed(0)}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={o.status as string} />
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

      <div className="flex items-center justify-between mt-6 text-[13px]">
        <div className="text-sericia-ink-soft">
          {count ?? 0} total · page {page} of {totalPages}
        </div>
        <div className="flex gap-3">
          {page > 1 && (
            <Link
              href={`/admin/orders?${qs({ page: page - 1 })}`}
              className="border border-sericia-line px-3 py-1.5 hover:bg-sericia-paper-card"
            >
              Prev
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/admin/orders?${qs({ page: page + 1 })}`}
              className="border border-sericia-line px-3 py-1.5 hover:bg-sericia-paper-card"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
