"use client";

/**
 * Inline, dismissible push-notification opt-in.
 *
 * Philosophy: NEVER prompt on first page load. A cold Notification.request
 * kills trust and gets the site permanently muted. Instead this component
 * renders only at high-intent moments (mount it on /thank-you, /account,
 * or post-scroll on /products) and shows a pre-prompt the user can accept
 * or dismiss. We call the native browser prompt only after explicit click.
 *
 * State machine:
 *   unsupported → nothing renders (no PushManager / Notification)
 *   denied      → nothing renders (user already said no at browser level)
 *   granted     → nothing renders (already subscribed)
 *   dismissed   → nothing renders for 60 days (localStorage stamp)
 *   default     → show the card
 *
 * Caller usage:
 *   <PushOptIn variant="thank-you" topics={["drops","orders"]} />
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getPushPermission, isPushSupported, subscribeToPush } from "@/lib/push";

const DISMISS_KEY = "sericia.push.dismissedAt";
const DISMISS_COOLDOWN_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

type Variant = "thank-you" | "account" | "inline";

type Props = {
  variant?: Variant;
  topics?: readonly string[];
  locale?: string | null;
  /** Override copy for brand-voice experiments. */
  eyebrow?: string;
  title?: string;
  body?: string;
  cta?: string;
};

export default function PushOptIn({
  variant = "inline",
  topics,
  locale,
  eyebrow,
  title,
  body,
  cta,
}: Props) {
  const [state, setState] = useState<"hidden" | "visible" | "pending" | "done">("hidden");

  useEffect(() => {
    if (!isPushSupported()) return;
    const perm = getPushPermission();
    if (perm !== "default") return; // granted / denied / unsupported — skip
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;
    setState("visible");
  }, []);

  if (state === "hidden" || state === "done") return null;

  const copy = resolveCopy(variant, { eyebrow, title, body, cta });

  const onAccept = async () => {
    setState("pending");
    const result = await subscribeToPush({ topics, locale });
    if (result.ok) {
      toast.success("Drop alerts on. We'll whisper, never shout.");
      setState("done");
      return;
    }
    if (result.reason === "denied") {
      toast.error("Browser blocked notifications. You can enable them in site settings.");
      setState("done");
      return;
    }
    if (result.reason === "dismissed") {
      toast("No worries — you can subscribe any time from your account.");
      setState("visible");
      return;
    }
    console.error("[PushOptIn] subscribe failed", result);
    toast.error("Couldn't subscribe right now. Try again in a moment.");
    setState("visible");
  };

  const onDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setState("done");
  };

  return (
    <aside
      // Role="region" + aria-labelledby so screen readers announce it as a
      // named section (matches the /accessibility page's WCAG 2.2 audit).
      role="region"
      aria-labelledby="push-optin-title"
      className="border border-sericia-line bg-sericia-paper-card p-6 sm:p-8"
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-sericia-ink/55 mb-3">
        {copy.eyebrow}
      </div>
      <h3 id="push-optin-title" className="text-lg font-normal text-sericia-ink mb-2">
        {copy.title}
      </h3>
      <p className="text-sm leading-relaxed text-sericia-ink/75 mb-5 max-w-md">
        {copy.body}
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onAccept}
          disabled={state === "pending"}
          className="bg-sericia-ink text-sericia-paper px-5 py-2.5 text-[12px] uppercase tracking-[0.12em] hover:opacity-90 disabled:opacity-60 transition"
        >
          {state === "pending" ? "Asking browser…" : copy.cta}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[12px] text-sericia-ink/60 hover:text-sericia-ink underline-offset-4 hover:underline transition"
        >
          Not now
        </button>
      </div>
    </aside>
  );
}

function resolveCopy(
  variant: Variant,
  overrides: { eyebrow?: string; title?: string; body?: string; cta?: string },
) {
  const base = VARIANT_COPY[variant];
  return {
    eyebrow: overrides.eyebrow ?? base.eyebrow,
    title: overrides.title ?? base.title,
    body: overrides.body ?? base.body,
    cta: overrides.cta ?? base.cta,
  };
}

const VARIANT_COPY: Record<Variant, { eyebrow: string; title: string; body: string; cta: string }> = {
  "thank-you": {
    eyebrow: "Optional · drop alerts",
    title: "Be first when the next drop opens.",
    body:
      "We ship one small drop at a time, and each one sells out. Turn on browser alerts and you'll hear from us the moment the next one is live — usually once every three or four weeks. Nothing more.",
    cta: "Alert me",
  },
  "account": {
    eyebrow: "Notifications",
    title: "Drop alerts & order updates",
    body:
      "Get a quiet notification when the next drop opens, when your order ships, and when tracking lands. No newsletters, no promotions.",
    cta: "Turn on",
  },
  "inline": {
    eyebrow: "Optional",
    title: "Know when the next drop opens.",
    body:
      "Limited releases sell out in hours. A single browser notification, nothing else.",
    cta: "Alert me",
  },
};
