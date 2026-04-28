import { NextResponse } from "next/server";

/**
 * Apple Pay domain verification — required by Apple before Crossmint
 * (or any Apple Pay PSP) can render the Apple Pay button on sericia.com.
 *
 * IMPORTANT — file content is the LITERAL hex string text (228 bytes)
 * as downloaded from Crossmint Console, NOT decoded JSON.
 *
 * Apple's verifier downloads the file and compares its bytes against the
 * hash Crossmint registered with Apple at PSP-binding time. If we serve
 * different bytes (even semantically equivalent ones, e.g., decoded
 * JSON), the hash check fails → "Domain verification failed".
 *
 * Why a route handler in addition to the static file in `public/`:
 *   - Next.js's static serving for `public/.well-known/*` works for most
 *     cases but extensionless files can occasionally be served with
 *     surprising Content-Type values depending on the runtime
 *     (standalone vs server vs CDN). An explicit route handler removes
 *     all ambiguity.
 *   - Apple's verifier follows at most one redirect, prefers `text/plain`
 *     or `application/octet-stream`, and treats 200 as authoritative.
 *
 * Re-running Apple Pay verification: if Crossmint regenerates the file,
 * download the new one, replace BOTH the static file in public/.well-known/
 * AND the constant below, redeploy.
 */

// Original 228-byte hex string from Crossmint Console > Apple Pay Domains
// (downloaded 2026-04-28). This is the literal file content — Apple's
// verifier compares this exact byte sequence against its registered hash.
const APPLE_PAY_BODY =
  "7b2276657273696f6e223a312c227073704964223a2232354445443144354433384346464645373738354331313243313639413637313730383836424639434435383145374642383642464532393430373337443931222c22637265617465644f6e223a313733383737373130313432347d";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  return new NextResponse(APPLE_PAY_BODY, {
    status: 200,
    headers: {
      // Apple's verifier accepts text/plain or octet-stream. We use
      // octet-stream since the file is technically opaque (Apple-defined
      // format we should not interpret).
      "Content-Type": "application/octet-stream",
      // No caching — re-verifications must always see fresh state.
      "Cache-Control": "no-store, max-age=0",
      // Defensive: allow any origin since Apple verifier may use any UA.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
