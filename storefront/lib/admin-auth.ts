import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE = "sericia_admin";

/**
 * Server component helper: check admin cookie against env secret.
 * Use in page.tsx / layout.tsx server components.
 */
export async function isAdmin(): Promise<boolean> {
  const secret = process.env.SERICIA_ADMIN_SECRET;
  if (!secret) {
    console.error("[admin-auth] SERICIA_ADMIN_SECRET is not set");
    return false;
  }
  const store = await cookies();
  const provided = store.get(ADMIN_COOKIE)?.value ?? "";
  return provided.length > 0 && provided === secret;
}

/**
 * API route helper: check admin cookie from NextRequest.
 */
export function requireAdmin(req: NextRequest): boolean {
  const secret = process.env.SERICIA_ADMIN_SECRET;
  if (!secret) {
    console.error("[admin-auth] SERICIA_ADMIN_SECRET is not set");
    return false;
  }
  const provided = req.cookies.get(ADMIN_COOKIE)?.value ?? "";
  return provided.length > 0 && provided === secret;
}
