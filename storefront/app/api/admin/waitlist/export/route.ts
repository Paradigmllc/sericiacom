import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "unauthorised" }, { status: 401 });
    }
    const { data, error } = await supabaseAdmin
      .from("sericia_waitlist")
      .select(
        "id,email,country_code,locale,source,utm_source,utm_medium,utm_campaign,confirmed,unsubscribed,created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/waitlist/export] fetch failed", error);
      return NextResponse.json({ error: "export_failed", detail: error.message }, { status: 500 });
    }

    const headers = [
      "id",
      "email",
      "country_code",
      "locale",
      "source",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "confirmed",
      "unsubscribed",
      "created_at",
    ];
    const lines = [headers.join(",")];
    for (const row of data ?? []) {
      lines.push(headers.map((h) => csvEscape((row as Record<string, unknown>)[h])).join(","));
    }
    const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sericia-waitlist-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/waitlist/export] unhandled", msg, err);
    return NextResponse.json({ error: "unhandled_exception", detail: msg }, { status: 500 });
  }
}
