import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const Schema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200).optional(),
  story: z.string().max(10000).optional(),
  price_usd: z.number().nonnegative().optional(),
  weight_g: z.number().int().nonnegative().optional(),
  total_units: z.number().int().nonnegative().optional(),
  sold_units: z.number().int().nonnegative().optional(),
  ships_within_hours: z.number().int().nonnegative().optional(),
  status: z.enum(["active", "upcoming", "sold_out", "archived"]).optional(),
  released_at: z.string().nullable().optional(),
  closes_at: z.string().nullable().optional(),
  hero_image_url: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "unauthorised" }, { status: 401 });
    }
    const parsed = Schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
    }
    const input = parsed.data;

    if (input.id) {
      const { id, ...rest } = input;
      const { error } = await supabaseAdmin
        .from("sericia_drops")
        .update({ ...rest })
        .eq("id", id);
      if (error) {
        console.error("[admin/drops] update failed", error);
        return NextResponse.json({ error: "update_failed", detail: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, id });
    }

    if (!input.title) {
      return NextResponse.json({ error: "title_required_for_new_drop" }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("sericia_drops")
      .insert({
        title: input.title,
        story: input.story ?? "",
        price_usd: input.price_usd ?? 0,
        weight_g: input.weight_g ?? 0,
        total_units: input.total_units ?? 0,
        sold_units: input.sold_units ?? 0,
        ships_within_hours: input.ships_within_hours ?? 48,
        status: input.status ?? "upcoming",
        released_at: input.released_at ?? new Date().toISOString(),
        closes_at: input.closes_at ?? null,
        hero_image_url: input.hero_image_url ?? null,
      })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[admin/drops] insert failed", error);
      return NextResponse.json({ error: "insert_failed", detail: error?.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/drops] unhandled", msg, err);
    return NextResponse.json({ error: "unhandled_exception", detail: msg }, { status: 500 });
  }
}
