import { notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import ProductForm from "../../ProductForm";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Product — Sericia Admin", robots: { index: false, follow: false } };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("sericia_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  return (
    <AdminShell title={`Edit: ${data.name}`}>
      <ProductForm
        initial={{
          id: data.id as string,
          name: data.name as string,
          slug: data.slug as string,
          description: (data.description as string) ?? "",
          story: (data.story as string) ?? "",
          price_usd: Number(data.price_usd),
          weight_g: Number(data.weight_g),
          stock: Number(data.stock),
          category: data.category as string,
          images: (data.images as string[]) ?? [],
          origin_region: (data.origin_region as string) ?? "",
          producer_name: (data.producer_name as string) ?? "",
          status: data.status as string,
        }}
      />
    </AdminShell>
  );
}
