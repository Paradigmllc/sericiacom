import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("[supabase-admin] missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  cached = createClient(url, serviceKey, { auth: { persistSession: false } });
  return cached;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export type Drop = {
  id: string;
  title: string;
  story: string;
  price_usd: number;
  weight_g: number;
  total_units: number;
  sold_units: number;
  ships_within_hours: number;
  status: string;
  released_at: string;
  closes_at: string | null;
  hero_image_url: string | null;
};

export type Order = {
  id: string;
  drop_id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "refunded" | "cancelled";
  email: string;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  region: string | null;
  postal_code: string;
  country_code: string;
  phone: string | null;
  quantity: number;
  amount_usd: number;
  currency: string;
  crossmint_order_id: string | null;
  tx_hash: string | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};
