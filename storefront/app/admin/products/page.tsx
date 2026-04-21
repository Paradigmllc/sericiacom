import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products — Sericia Admin", robots: { index: false, follow: false } };

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price_usd: number;
  stock: number;
  status: string;
  images: string[] | null;
};

export default async function AdminProductsPage() {
  const { data } = await supabaseAdmin
    .from("sericia_products")
    .select("id, slug, name, category, price_usd, stock, status, images")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  const products = (data ?? []) as AdminProduct[];

  return (
    <AdminShell title="Products">
      <div className="flex items-center justify-between mb-6">
        <div className="text-[13px] text-sericia-ink-soft">{products.length} products</div>
        <Link
          href="/admin/products/new"
          className="bg-sericia-ink text-sericia-paper py-2 px-4 text-[13px] tracking-wider hover:bg-sericia-accent transition"
        >
          + New product
        </Link>
      </div>

      <div className="border border-sericia-line bg-sericia-paper-card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b border-sericia-line">
            <tr className="text-left">
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Image</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Name</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Slug</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Category</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Price</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Stock</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft">Status</th>
              <th className="px-5 py-3 font-normal text-sericia-ink-soft"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sericia-ink-mute">
                  No products yet. Create the first one.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-sericia-line last:border-0">
                  <td className="px-5 py-3">
                    {p.images && p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-10 h-10 object-cover border border-sericia-line"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-sericia-paper border border-sericia-line" />
                    )}
                  </td>
                  <td className="px-5 py-3">{p.name}</td>
                  <td className="px-5 py-3 font-mono text-[12px] text-sericia-ink-soft">{p.slug}</td>
                  <td className="px-5 py-3">{p.category}</td>
                  <td className="px-5 py-3">${Number(p.price_usd).toFixed(0)}</td>
                  <td className={`px-5 py-3 ${p.stock < 5 ? "text-red-700 font-medium" : ""}`}>
                    {p.stock}
                  </td>
                  <td className="px-5 py-3">{p.status}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="underline hover:text-sericia-accent"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
