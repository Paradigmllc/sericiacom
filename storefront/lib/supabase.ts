import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anonKey) {
  console.error("[supabase] missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type PseoArticle = {
  slug: string;
  country_code: string;
  country_name: string;
  product_slug: string;
  product_name: string;
  title: string;
  meta_description: string;
  intro_md: string;
  why_japanese_md: string;
  shipping_info_md: string;
  faq: { q: string; a: string }[];
  related_drop_handle: string | null;
  ogp_url: string | null;
  published_at: string;
  updated_at: string;
};
