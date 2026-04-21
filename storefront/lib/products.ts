import { supabaseAdmin } from "./supabase-admin";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  story: string;
  price_usd: number;
  weight_g: number;
  stock: number;
  category: "tea" | "miso" | "mushroom" | "seasoning";
  images: string[];
  status: "active" | "draft" | "sold_out";
  origin_region: string | null;
  producer_name: string | null;
  created_at: string;
  updated_at: string;
};

export async function listActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from("sericia_products")
    .select("*")
    .eq("status", "active")
    .order("category", { ascending: true })
    .order("price_usd", { ascending: true });
  if (error) {
    console.error("[products] listActive failed", error);
    return [];
  }
  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from("sericia_products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error) {
    console.error("[products] getBySlug failed", error);
    return null;
  }
  return (data as Product | null) ?? null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabaseAdmin
    .from("sericia_products")
    .select("*")
    .in("id", ids);
  if (error) {
    console.error("[products] getByIds failed", error);
    return [];
  }
  return (data ?? []) as Product[];
}

export function categoryLabel(category: Product["category"]): string {
  return {
    tea: "Tea",
    miso: "Miso",
    mushroom: "Mushroom",
    seasoning: "Seasoning",
  }[category];
}
