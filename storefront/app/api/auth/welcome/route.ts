import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail, welcomeEmail } from "@/lib/email";

const Schema = z.object({
  email: z.string().email(),
  full_name: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    const html = welcomeEmail({ full_name: parsed.data.full_name ?? null });
    const result = await sendEmail({
      to: parsed.data.email.toLowerCase().trim(),
      subject: "Welcome to Sericia",
      html,
    });
    if (!result.ok) {
      return NextResponse.json({ error: "send_failed", detail: result.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[auth/welcome] failed", msg, err);
    return NextResponse.json({ error: "unhandled_exception", detail: msg }, { status: 500 });
  }
}
