"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Props = {
  source: string;
  country: string;
  /** Optional editor-controlled button label. Overrides the localized default. */
  ctaLabel?: string;
};

export default function WaitlistForm({ source, country, ctaLabel }: Props) {
  const t = useTranslations("forms.waitlist");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error(t("toast_invalid"));
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          country_code: country.toUpperCase(),
          locale: navigator.language,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error === "already_subscribed" ? t("toast_already") : t("toast_failed"));
        setLoading(false);
        return;
      }
      toast.success(t("toast_success"));
      setJoined(true);
    } catch (e) {
      console.error("[waitlist] error", e);
      toast.error(t("toast_network"));
    } finally {
      setLoading(false);
    }
  }

  if (joined) {
    return <p className="text-sericia-accent text-center">{t("confirmed")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("placeholder_email")}
        className="flex-1 px-4 py-3 rounded-lg border border-sericia-ink/20 bg-white focus:outline-none focus:ring-2 focus:ring-sericia-accent"
        autoComplete="email"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-sericia-ink text-sericia-paper px-6 py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "…" : (ctaLabel ?? t("cta_default"))}
      </button>
    </form>
  );
}
