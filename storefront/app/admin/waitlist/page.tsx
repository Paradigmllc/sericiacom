import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Waitlist — Sericia Admin", robots: { index: false, follow: false } };

type WaitlistRow = {
  id: number;
  email: string;
  country_code: string | null;
  locale: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  confirmed: boolean | null;
  unsubscribed: boolean | null;
  created_at: string;
};

function fmt(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

export default async function AdminWaitlistPage() {
  const { data, error } = await supabaseAdmin
    .from("sericia_waitlist")
    .select(
      "id,email,country_code,locale,source,utm_source,utm_medium,utm_campaign,confirmed,unsubscribed,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) console.error("[admin/waitlist] fetch failed", error);
  const rows = (data ?? []) as WaitlistRow[];
  const total = rows.length;
  const confirmed = rows.filter((r) => r.confirmed).length;
  const unsubscribed = rows.filter((r) => r.unsubscribed).length;

  return (
    <AdminShell title="Waitlist">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex gap-6 text-[13px]">
          <div>
            <span className="label mr-2">Total</span>
            <span className="font-normal">{total}</span>
          </div>
          <div>
            <span className="label mr-2">Confirmed</span>
            <span className="font-normal">{confirmed}</span>
          </div>
          <div>
            <span className="label mr-2">Unsubscribed</span>
            <span className="font-normal">{unsubscribed}</span>
          </div>
        </div>
        <Link
          href="/api/admin/waitlist/export"
          className="bg-sericia-ink text-sericia-paper py-2 px-4 text-[13px] tracking-wider hover:bg-sericia-accent transition"
          prefetch={false}
        >
          Export CSV
        </Link>
      </div>

      <div className="border border-sericia-line bg-sericia-paper-card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b border-sericia-line bg-sericia-paper">
            <tr>
              <Th>Email</Th>
              <Th>Country</Th>
              <Th>Locale</Th>
              <Th>Source</Th>
              <Th>UTM</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-sericia-ink-mute">
                  No waitlist signups yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-sericia-line last:border-b-0 hover:bg-sericia-paper/40">
                <Td className="font-mono text-[12px]">{r.email}</Td>
                <Td>{r.country_code ?? "—"}</Td>
                <Td>{r.locale ?? "—"}</Td>
                <Td>{r.source ?? "—"}</Td>
                <Td className="text-[12px] text-sericia-ink-soft">
                  {[r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(" / ") || "—"}
                </Td>
                <Td>
                  {r.unsubscribed ? (
                    <span className="text-red-700">Unsubscribed</span>
                  ) : r.confirmed ? (
                    <span className="text-sericia-ink">Confirmed</span>
                  ) : (
                    <span className="text-sericia-ink-mute">Pending</span>
                  )}
                </Td>
                <Td className="text-sericia-ink-soft whitespace-nowrap">{fmt(r.created_at)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 1000 && (
        <p className="mt-4 text-[12px] text-sericia-ink-mute">
          Showing most recent 1,000 signups. Export CSV to download the complete list.
        </p>
      )}
    </AdminShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 label font-normal">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
