import AdminShell from "@/components/AdminShell";
import DropsManager from "./DropsManager";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Drops — Sericia Admin", robots: { index: false, follow: false } };

export default async function AdminDropsPage() {
  const { data } = await supabaseAdmin
    .from("sericia_drops")
    .select("*")
    .order("released_at", { ascending: false });
  return (
    <AdminShell title="Drops">
      <DropsManager initial={data ?? []} />
    </AdminShell>
  );
}
