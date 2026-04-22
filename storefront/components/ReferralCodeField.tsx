"use client";

/**
 * ReferralCodeField — checkout-side referee input.
 *
 * Behavior:
 *   1. Starts collapsed as a quiet "Have a referral code?" link (Aesop
 *      restraint — not a pushy banner).
 *   2. On expand, pre-fills from the `sericia_ref` cookie if the referee
 *      landed via a /?ref= link.
 *   3. Debounces manual entry, validates against /api/referrals/validate.
 *   4. On valid code, shows confirmation line + calls `onApplied` so the
 *      parent checkout form can include it in the order payload.
 *
 * Not responsible for:
 *   • Actually subtracting the discount from the order total — that's done
 *     server-side in /api/orders/create-cart (TODO: wire on Crossmint
 *     webhook integration).
 *   • Fraud prevention beyond RPC rate limiting — the RPC itself returns
 *     only { valid, discount_amount_usd, referrer_first_name }, so the
 *     client has no sensitive info to leak.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { REFERRAL_COOKIE_NAME } from "./ReferralCookieSetter";

export type ReferralApplied = {
  code: string;
  discountAmountUsd: number;
  referrerFirstName: string | null;
};

type Props = {
  onApplied?: (r: ReferralApplied | null) => void;
  /** If true, skip the collapsed state and render expanded from the start. */
  defaultOpen?: boolean;
};

type ValidateState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "valid"; result: ReferralApplied }
  | { status: "invalid"; message: string };

const DEBOUNCE_MS = 400;

export default function ReferralCodeField({ onApplied, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [value, setValue] = useState("");
  const [state, setState] = useState<ValidateState>({ status: "idle" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appliedRef = useRef<string | null>(null); // track last-applied code to avoid redundant onApplied calls

  // Pre-fill from cookie if a ?ref= landed earlier.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${REFERRAL_COOKIE_NAME}=([^;]*)`),
    );
    const cookieVal = match ? decodeURIComponent(match[1]) : "";
    if (cookieVal && !value) {
      setValue(cookieVal);
      setOpen(true);
      // Schedule validation immediately (no debounce for pre-fill — fresh landing).
      validate(cookieVal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = useCallback(async (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code || code.length < 3) {
      setState({ status: "idle" });
      if (appliedRef.current) {
        appliedRef.current = null;
        onApplied?.(null);
      }
      return;
    }
    setState({ status: "checking" });
    try {
      const res = await fetch("/api/referrals/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setState({
          status: "invalid",
          message: "That code isn't valid. Check your spelling.",
        });
        if (appliedRef.current) {
          appliedRef.current = null;
          onApplied?.(null);
        }
        return;
      }
      const result: ReferralApplied = {
        code,
        discountAmountUsd: data.discountAmountUsd,
        referrerFirstName: data.referrerFirstName ?? null,
      };
      setState({ status: "valid", result });
      if (appliedRef.current !== code) {
        appliedRef.current = code;
        onApplied?.(result);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[referral-field] validate", err);
      setState({ status: "invalid", message: msg });
    }
  }, [onApplied]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => validate(next), DEBOUNCE_MS);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute hover:text-sericia-ink transition border-b border-sericia-line hover:border-sericia-ink pb-1"
      >
        Have a referral code?
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <label htmlFor="referral-code" className="label block">
        Referral code
      </label>
      <div className="flex items-center gap-4">
        <input
          id="referral-code"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="ANNA-7K3D"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[15px] placeholder-sericia-ink-mute transition-colors tracking-[0.08em] uppercase"
          aria-describedby="referral-code-status"
          aria-invalid={state.status === "invalid"}
        />
        {state.status === "checking" && (
          <span className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute shrink-0">
            Checking…
          </span>
        )}
      </div>
      <div id="referral-code-status" role="status" aria-live="polite">
        {state.status === "valid" && (
          <p className="text-[13px] text-sericia-ink leading-relaxed">
            <span className="text-sericia-accent">✓</span>{" "}
            ${state.result.discountAmountUsd} saved
            {state.result.referrerFirstName
              ? ` — thanks to ${state.result.referrerFirstName}.`
              : "."}
          </p>
        )}
        {state.status === "invalid" && (
          <p className="text-[13px] text-sericia-ink-soft leading-relaxed">
            {state.message}
          </p>
        )}
      </div>
    </div>
  );
}
