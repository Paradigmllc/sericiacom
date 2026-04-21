import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const Schema = z.object({
  email: z.string().email(),
  source: z.string().max(50).optional().nullable(),
  country_code: z.string().length(2).optional().nullable(),
  locale: z.string().max(20).optional().nullable(),
  utm_source: z.string().max(100).optional().nullable(),
  utm_medium: z.string().max(100).optional().nullable(),
  utm_campaign: z.string().max(100).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const input = parsed.data;
  const email = input.email.toLowerCase().trim();

  const { data: existing } = await supabaseAdmin
    .from("sericia_waitlist")
    .select("id, unsubscribed")
    .eq("email", email)
    .maybeSingle();

  if (existing && !existing.unsubscribed) {
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
  }

  const ipCountry = req.headers.get("cf-ipcountry");
  const { error } = await supabaseAdmin.from("sericia_waitlist").upsert(
    {
      email,
      source: input.source ?? null,
      country_code: (input.country_code ?? ipCountry ?? null)?.toUpperCase() || null,
      locale: input.locale ?? null,
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null,
      unsubscribed: false,
    },
    { onConflict: "email" }
  );
  if (error) {
    console.error("[waitlist] upsert failed", error);
    return NextResponse.json({ error: "subscribe_failed" }, { status: 500 });
  }

  await supabaseAdmin.from("sericia_events").insert({
    event_name: "waitlist_join",
    distinct_id: email,
    country_code: (input.country_code ?? ipCountry ?? null)?.toUpperCase() || null,
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
    properties: { source: input.source ?? null },
  });

  const hook = process.env.N8N_WAITLIST_WEBHOOK;
  if (hook) {
    fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: input.source, country_code: input.country_code }),
      signal: AbortSignal.timeout(5_000),
    }).catch((e) => console.error("[waitlist] n8n webhook failed", e));
  }

  return NextResponse.json({ ok: true });
}
