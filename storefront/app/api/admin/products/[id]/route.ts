import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "unauthorised" }, { status: 401 });
    }
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("sericia_products")
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("[admin/products/delete] failed", error);
      return NextResponse.json({ error: "delete_failed", detail: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/products/delete] unhandled", msg, err);
    return NextResponse.json({ error: "unhandled_exception", detail: msg }, { status: 500 });
  }
}
