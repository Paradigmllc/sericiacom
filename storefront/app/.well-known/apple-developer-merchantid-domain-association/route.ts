import { NextResponse } from "next/server";

/**
 * Apple Pay domain verification — required by Apple before Crossmint
 * (or any Apple Pay PSP) can render the Apple Pay button on sericia.com.
 *
 * Apple's verifier fetches this exact URL and parses the body. Crossmint
 * generates the file via Console > Apple Pay Domains, and the JSON
 * binds our domain to Crossmint's PSP record (`pspId`).
 *
 * Why a route handler in addition to the static file in `public/`:
 *   - Next.js's static serving for `public/.well-known/*` works for most
 *     cases but extensionless files can occasionally be served with
 *     surprising Content-Type values depending on the runtime
 *     (standalone vs server vs CDN). An explicit route handler removes
 *     all ambiguity: we control headers + body byte-for-byte.
 *   - Apple's verifier follows at most one redirect, prefers `text/plain`
 *     or `application/json`, and treats 200 as authoritative.
 *   - The static file in `public/.well-known/` is kept as a fallback;
 *     route handlers take precedence in app router.
 *
 * Re-running Apple Pay verification: just commit a new file (replace the
 * `pspId` if Crossmint regenerates) and redeploy. Idempotent.
 */

const APPLE_PAY_BODY = JSON.stringify({
  version: 1,
  pspId: "25DED1D5D38CFFFE7785C112C169A67170886BF9CD581E7FB86BFE2940737D91",
  createdOn: 1738777101424,
});

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  return new NextResponse(APPLE_PAY_BODY, {
    status: 200,
    headers: {
      // Apple's verifier accepts text/plain or application/json; both work.
      "Content-Type": "application/json; charset=utf-8",
      // No caching — re-verifications must always see fresh state.
      "Cache-Control": "no-store, max-age=0",
      // Defensive: allow any origin since Apple verifier may use any UA.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
