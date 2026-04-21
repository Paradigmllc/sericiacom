import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SERICIA_ADMIN_SECRET;
    if (!secret) {
      console.error("[admin/login] SERICIA_ADMIN_SECRET missing");
      return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
    }
    const body = (await req.json().catch(() => null)) as { password?: string } | null;
    const password = body?.password ?? "";
    if (!password || password !== secret) {
      return NextResponse.json({ error: "invalid_password" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, secret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/login] unhandled", msg, err);
    return NextResponse.json({ error: "unhandled_exception", detail: msg }, { status: 500 });
  }
}
