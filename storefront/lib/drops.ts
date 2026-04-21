import { supabase } from "@/lib/supabase";
import type { Drop } from "@/lib/supabase-admin";

export async function getCurrentDrop(): Promise<Drop | null> {
  const { data, error } = await supabase
    .from("sericia_drops")
    .select("*")
    .eq("status", "active")
    .order("released_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[drops] fetch failed", error);
    return null;
  }
  return data as Drop | null;
}

export async function getDropById(id: string): Promise<Drop | null> {
  const { data, error } = await supabase
    .from("sericia_drops")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[drops] fetch-by-id failed", error);
    return null;
  }
  return data as Drop | null;
}
