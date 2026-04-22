"use client";

/**
 * Referrals account page.
 *
 * Flow:
 *   1. On mount, GET /api/referrals/me → creates the code if missing.
 *   2. Display the code prominently with a copy-to-clipboard button.
 *   3. Share row: Web Share API primary (mobile-heavy), fallback to
 *      prefilled X / WhatsApp / Email links (desktop-heavy).
 *   4. Stats row: redemption count, pending earnings, issued earnings.
 *
 * Payment integration (discount applied + reward issued) is wired in the
 * Crossmint webhook / Medusa subscriber — not here.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Rule, StatBlock } from "@/components/ui";
import type { ReferralStats } from "@/lib/referrals";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ReferralStats };

export default function ReferralsClient() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/referrals/me", { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const message = body?.error === "not_authenticated"
            ? "Please sign in to view your referral code."
            : body?.detail || "Could not load your referral code.";
          if (!cancelled) setState({ status: "error", message });
          return;
        }
        const data = (await res.json()) as ReferralStats;
        if (!cancelled) setState({ status: "ready", data });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[referrals] fetch", err);
        if (!cancelled) setState({ status: "error", message: msg });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div>
        <p className="label mb-3">Referrals</p>
        <div className="h-10 w-64 bg-sericia-paper-card animate-pulse mb-10" />
        <div className="h-32 w-full bg-sericia-paper-card animate-pulse" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div>
        <p className="label mb-3">Referrals</p>
        <h1 className="text-[28px] md:text-[32px] font-normal leading-tight mb-6">
          Something went wrong.
        </h1>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed max-w-md">
          {state.message}
        </p>
      </div>
    );
  }

  return <ReferralsReady data={state.data} />;
}

function ReferralsReady({ data }: { data: ReferralStats }) {
  const { code, shareUrl, discountAmountUsd, referrerRewardUsd,
    redemptionCount, earningsIssuedUsd, earningsPendingUsd } = data;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[referrals] copy", err);
      toast.error(msg);
    }
  }

  async function handleShare() {
    const shareData = {
      title: "Sericia",
      text: `I've been loving Sericia — here's $${discountAmountUsd} off your first drop.`,
      url: shareUrl,
    };
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // AbortError = user dismissed; ignore silently per web-share UX convention.
        if ((err as { name?: string })?.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[referrals] share", err);
        toast.error(msg);
      }
      return;
    }
    // Desktop fallback: copy to clipboard.
    await handleCopy();
  }

  const messageText = encodeURIComponent(
    `I've been loving Sericia — here's $${discountAmountUsd} off your first drop: ${shareUrl}`,
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${messageText}`;
  const whatsappUrl = `https://wa.me/?text=${messageText}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(
    "Something you'll like — Sericia",
  )}&body=${messageText}`;

  return (
    <div>
      <div className="mb-10">
        <p className="label mb-3">Referrals</p>
        <h1 className="text-[28px] md:text-[32px] font-normal leading-tight mb-4">
          Give ${discountAmountUsd}, get ${referrerRewardUsd}.
        </h1>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed max-w-md">
          Share your code. Your friends get ${discountAmountUsd} off their first drop.
          When they order, ${referrerRewardUsd} lands in your Sericia credits.
        </p>
      </div>

      {/* Code + share row */}
      <div className="border border-sericia-line bg-sericia-paper-card mb-12">
        <div className="p-8 md:p-10">
          <p className="label mb-4">Your code</p>
          <div className="flex items-end justify-between flex-wrap gap-6 mb-8">
            <div className="font-serif text-[40px] md:text-[52px] tracking-[0.05em] leading-none">
              {code}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute hover:text-sericia-ink transition border-b border-sericia-line hover:border-sericia-ink py-1"
              aria-label="Copy referral link"
            >
              Copy link
            </button>
          </div>

          <p className="text-[12px] text-sericia-ink-mute mb-5 break-all font-mono">
            {shareUrl}
          </p>

          <Rule />

          <div className="flex flex-wrap items-center gap-3 pt-6">
            <button
              type="button"
              onClick={handleShare}
              className="bg-sericia-ink text-sericia-paper py-3 px-6 text-[12px] tracking-[0.18em] uppercase hover:bg-sericia-accent transition-colors"
            >
              Share
            </button>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-sericia-line py-3 px-6 text-[12px] tracking-[0.18em] uppercase text-sericia-ink-soft hover:text-sericia-ink hover:border-sericia-ink transition-colors"
            >
              Post to X
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-sericia-line py-3 px-6 text-[12px] tracking-[0.18em] uppercase text-sericia-ink-soft hover:text-sericia-ink hover:border-sericia-ink transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={emailUrl}
              className="border border-sericia-line py-3 px-6 text-[12px] tracking-[0.18em] uppercase text-sericia-ink-soft hover:text-sericia-ink hover:border-sericia-ink transition-colors"
            >
              Email
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <p className="label mb-6">Your earnings</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-sericia-line border border-sericia-line mb-12">
        <div className="bg-sericia-paper p-8">
          <StatBlock value={redemptionCount} label="Friends redeemed" />
        </div>
        <div className="bg-sericia-paper p-8">
          <StatBlock
            value={<span className="tabular-nums">${earningsIssuedUsd}</span>}
            label="Credits issued"
          />
        </div>
        <div className="bg-sericia-paper p-8">
          <StatBlock
            value={<span className="tabular-nums">${earningsPendingUsd}</span>}
            label="Pending"
          />
        </div>
      </div>

      {/* How it works */}
      <p className="label mb-6">How it works</p>
      <ol className="space-y-5 max-w-prose text-[14px] text-sericia-ink-soft leading-relaxed">
        <li className="flex gap-5">
          <span className="font-serif text-[18px] text-sericia-ink tabular-nums w-6 shrink-0">01</span>
          <span>
            Share your link. Your friend lands on Sericia with ${discountAmountUsd} off
            their first drop automatically applied.
          </span>
        </li>
        <li className="flex gap-5">
          <span className="font-serif text-[18px] text-sericia-ink tabular-nums w-6 shrink-0">02</span>
          <span>
            They order. You see it here as{" "}
            <span className="text-sericia-ink">Pending</span> — the reward clears
            after the drop ships, so refunds don&rsquo;t create a debt.
          </span>
        </li>
        <li className="flex gap-5">
          <span className="font-serif text-[18px] text-sericia-ink tabular-nums w-6 shrink-0">03</span>
          <span>
            ${referrerRewardUsd} in credits lands in your account. Spend it on
            the next drop — credits auto-apply at checkout.
          </span>
        </li>
      </ol>

      <p className="text-[12px] text-sericia-ink-mute mt-10 leading-relaxed max-w-prose">
        Fair play: self-referrals and fake accounts are voided. We reserve the
        right to pause rewards on suspected abuse.
      </p>
    </div>
  );
}
