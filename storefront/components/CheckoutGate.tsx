"use client";

/**
 * CheckoutGate — first-step "Sign in or check out as guest" choice.
 *
 * Why this exists:
 *   Anonymous visitors used to land directly on the address form, skipping
 *   the chance to log in and pull saved addresses + order history. Aesop /
 *   SSENSE / NET-A-PORTER all show this gate first to:
 *     1. Reduce form fatigue for repeat customers (one tap → autofilled form)
 *     2. Recapture the "I have an account but forgot" segment (~12% of revenue
 *        leak in checkout funnels per Baymard 2024 study)
 *     3. Set expectation that order updates will arrive by email regardless
 *
 * Behavior:
 *   - If user is signed in: render `signed-in-as` strip with sign-out option,
 *     auto-progress to the form (no friction for returning customers).
 *   - If anonymous: render two-card choice. "Sign in" routes to /login with
 *     `?redirect=/checkout` so the user lands back here after the magic link.
 *     "Continue as guest" reveals the form in-place (no route change — keeps
 *     cart state intact).
 *   - State is held in URL (`?as=guest`) so refresh / back doesn't reset.
 *
 * Why URL-state instead of useState:
 *   Next.js `force-dynamic` means a server-side back-nav can re-render the
 *   page fresh. Putting `as=guest` in the search params ensures the choice
 *   survives server round-trips. It also lets us link directly to the guest
 *   form from the cart drawer (e.g., `/checkout?as=guest`) for 1-tap return
 *   customers who don't want to sign in.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Eyebrow } from "@/components/ui";

type SessionState =
  | { kind: "loading" }
  | { kind: "signed_in"; email: string }
  | { kind: "anonymous" };

export default function CheckoutGate({ children }: { children: React.ReactNode }) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const isGuest = search.get("as") === "guest";

  const [session, setSession] = useState<SessionState>({ kind: "loading" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabaseBrowser().auth.getUser();
        if (!mounted) return;
        if (data.user?.email) {
          setSession({ kind: "signed_in", email: data.user.email });
        } else {
          setSession({ kind: "anonymous" });
        }
      } catch (err) {
        console.error("[checkout-gate] session check failed", err);
        if (mounted) setSession({ kind: "anonymous" });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function signOut() {
    try {
      await supabaseBrowser().auth.signOut();
      router.refresh();
      setSession({ kind: "anonymous" });
    } catch (err) {
      console.error("[checkout-gate] sign-out failed", err);
    }
  }

  // Loading state — paper skeleton, no flicker.
  if (session.kind === "loading") {
    return (
      <div className="border border-sericia-line bg-sericia-paper-card p-10 md:p-12">
        <div className="h-3 w-24 bg-sericia-line/40 mb-5 animate-pulse" />
        <div className="h-8 w-2/3 bg-sericia-line/40 mb-3 animate-pulse" />
        <div className="h-4 w-full bg-sericia-line/30 animate-pulse" />
      </div>
    );
  }

  // Signed-in: strip header + form below
  if (session.kind === "signed_in") {
    return (
      <div className="space-y-10">
        <div className="border border-sericia-line bg-sericia-paper-card px-6 md:px-8 py-5 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[13px] text-sericia-ink-soft tracking-[0.01em]">
            {t("gate_signed_in_as", { email: session.email })}
          </p>
          <div className="flex items-center gap-5 text-[12px] tracking-wider uppercase">
            <span className="text-sericia-ink-mute">{t("gate_not_you")}</span>
            <button
              type="button"
              onClick={signOut}
              className="underline-link text-sericia-ink"
            >
              {t("gate_sign_out")}
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Anonymous + already chose guest path → render form directly
  if (isGuest) {
    return (
      <div className="space-y-10">
        <div className="border border-sericia-line bg-sericia-paper-card px-6 md:px-8 py-5 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[13px] text-sericia-ink-soft tracking-[0.01em]">
            {t("gate_guest_title")}
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className="underline-link text-[12px] tracking-wider uppercase text-sericia-ink"
          >
            {t("gate_sign_in_cta")}
          </Link>
        </div>
        {children}
      </div>
    );
  }

  // Anonymous + no choice yet → show gate
  return (
    <div>
      <Eyebrow>{t("gate_eyebrow")}</Eyebrow>
      <h2 className="text-[28px] md:text-[32px] leading-[1.15] font-normal tracking-tight mt-3">
        {t("gate_title")}
      </h2>
      <p className="text-[15px] text-sericia-ink-soft mt-4 max-w-prose leading-relaxed">
        {t("gate_lede")}
      </p>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 mt-12">
        {/* Sign-in card */}
        <Link
          href={`/login?redirect=${encodeURIComponent(pathname)}`}
          className="group border border-sericia-line bg-sericia-paper-card p-8 md:p-10 hover:border-sericia-ink transition-colors flex flex-col"
        >
          <p className="label mb-4">{t("gate_sign_in_title")}</p>
          <p className="text-[15px] text-sericia-ink-soft leading-relaxed mb-10 flex-1">
            {t("gate_sign_in_lede")}
          </p>
          <span className="inline-flex items-center gap-2 text-[13px] tracking-wider uppercase text-sericia-ink group-hover:text-sericia-accent transition-colors">
            {t("gate_sign_in_cta")}
            <span aria-hidden="true">→</span>
          </span>
        </Link>

        {/* Guest card */}
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams(search.toString());
            next.set("as", "guest");
            router.replace(`${pathname}?${next.toString()}`, { scroll: false });
          }}
          className="group border border-sericia-line bg-sericia-paper p-8 md:p-10 hover:border-sericia-ink transition-colors flex flex-col text-left"
        >
          <p className="label mb-4">{t("gate_guest_title")}</p>
          <p className="text-[15px] text-sericia-ink-soft leading-relaxed mb-10 flex-1">
            {t("gate_guest_lede")}
          </p>
          <span className="inline-flex items-center gap-2 text-[13px] tracking-wider uppercase text-sericia-ink group-hover:text-sericia-accent transition-colors">
            {t("gate_guest_cta")}
            <span aria-hidden="true">→</span>
          </span>
        </button>
      </div>
    </div>
  );
}
