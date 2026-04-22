"use client";

/**
 * SocialProofToastGate — client-side route guard around SocialProofToast.
 *
 * Why a gate? The layout is a Server Component and we need `usePathname()` to
 * exclude paths where toasts would be counter-productive:
 *   • /checkout* — distraction during payment hurts conversion
 *   • /account* — logged-in customer area, toasts feel intrusive
 *   • /admin / /cms* — ops / staff pages
 *
 * Keep this list short and justified — the default is "show toasts", and we
 * only suppress where UX cost > FOMO benefit.
 */

import { usePathname } from "next/navigation";
import SocialProofToast from "./SocialProofToast";

const SUPPRESSED_PREFIXES = ["/checkout", "/account", "/admin", "/cms"];

export default function SocialProofToastGate() {
  const pathname = usePathname() ?? "";
  const suppress = SUPPRESSED_PREFIXES.some((p) => pathname.startsWith(p));
  if (suppress) return null;
  return <SocialProofToast />;
}
