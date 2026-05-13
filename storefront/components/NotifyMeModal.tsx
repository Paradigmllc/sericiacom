"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { CloseIcon } from "./Icons";

export default function NotifyMeModal({
  open,
  onClose,
  productId,
  productName,
  productSlug,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productSlug: string;
}) {
  const t = useTranslations("forms.notify_me");
  const tA11y = useTranslations("common.a11y");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "pdp-notify-me",
          metadata: { productId, productSlug, productName },
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? t("toast_failed"));
      }
      toast.success(t("toast_success"));
      setEmail("");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[notify-me] submit", err);
      toast.error(msg || t("toast_failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notify-title"
        >
          <motion.div
            className="absolute inset-0 bg-sericia-ink/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-md bg-sericia-paper border border-sericia-line p-8 md:p-10"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="absolute top-4 right-4 p-2 text-sericia-ink-mute hover:text-sericia-ink transition"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
            <p className="label mb-3">{t("title")}</p>
            <h2 id="notify-title" className="text-[22px] md:text-[26px] leading-tight font-normal mb-3">
              {t("title")} — {productName}
            </h2>
            <p className="text-[13px] text-sericia-ink-soft leading-relaxed mb-6">
              {t("lede")}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholder_email")}
                className="w-full bg-sericia-paper border border-sericia-line px-4 py-3.5 text-[14px] placeholder:text-sericia-ink-mute focus:outline-none focus:border-sericia-ink transition"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-sericia-ink text-sericia-paper py-3.5 text-[13px] tracking-[0.18em] uppercase hover:bg-sericia-accent transition-colors disabled:opacity-60"
              >
                {submitting ? t("cta_loading") : t("cta")}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
