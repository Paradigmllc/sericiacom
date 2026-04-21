import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
  try {
    const supa = await supabaseServer();
    const { data: { user } } = await supa.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    // delete profile (orders retained)
    await supabaseAdmin.from("sericia_profiles").delete().eq("id", user.id);
    // delete the auth user via service role
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("[account/delete] admin delete failed", error);
      return NextResponse.json({ error: "delete_failed", detail: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[account/delete] exception", msg, err);
    return NextResponse.json({ error: "unhandled_exception", detail: msg }, { status: 500 });
  }
}
