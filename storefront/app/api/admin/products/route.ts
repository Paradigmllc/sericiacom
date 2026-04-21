import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const Schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "slug must be lowercase, alphanumeric and hyphens"),
  description: z.string().max(4000).optional().default(""),
  story: z.string().max(10000).optional().default(""),
  price_usd: z.number().nonnegative(),
  weight_g: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  category: z.string().max(40),
  images: z.array(z.string().url().or(z.string().startsWith("/"))).default([]),
  origin_region: z.string().max(120).nullable().optional(),
  producer_name: z.string().max(120).nullable().optional(),
  status: z.enum(["active", "draft", "sold_out"]),
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
    const now = new Date().toISOString();

    if (input.id) {
      const { error } = await supabaseAdmin
        .from("sericia_products")
        .update({
          name: input.name,
          slug: input.slug,
          description: input.description,
          story: input.story,
          price_usd: input.price_usd,
          weight_g: input.weight_g,
          stock: input.stock,
          category: input.category,
          images: input.images,
          origin_region: input.origin_region || null,
          producer_name: input.producer_name || null,
          status: input.status,
          updated_at: now,
        })
        .eq("id", input.id);
      if (error) {
        console.error("[admin/products] update failed", error);
        return NextResponse.json({ error: "update_failed", detail: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, id: input.id });
    }

    const { data, error } = await supabaseAdmin
      .from("sericia_products")
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description,
        story: input.story,
        price_usd: input.price_usd,
        weight_g: input.weight_g,
        stock: input.stock,
        category: input.category,
        images: input.images,
        origin_region: input.origin_region || null,
        producer_name: input.producer_name || null,
        status: input.status,
      })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[admin/products] insert failed", error);
      return NextResponse.json({ error: "insert_failed", detail: error?.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/products] unhandled", msg, err);
    return NextResponse.json({ error: "unhandled_exception", detail: msg }, { status: 500 });
  }
}
