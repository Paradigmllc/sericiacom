"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";

const REASON_VALUES = [
  "damaged_in_transit",
  "spoiled_on_arrival",
  "wrong_item",
  "lost_in_transit",
  "delayed_30_days",
  "other",
] as const;

const Schema = z.object({
  email: z.string().email("Valid email required"),
  full_name: z.string().min(1, "Name required"),
  order_id: z.string(),
  reason: z.string(),
  description: z.string().min(20, "Please describe the issue (20+ characters)"),
});

export default function RefundRequestForm() {
  const t = useTranslations("refund_request");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    order_id: "",
    reason: "damaged_in_transit",
    description: "",
  });

  const inputCls =
    "w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[15px] placeholder-sericia-ink-mute transition-colors";
  const labelCls = "label block mb-2";

  // Map enum values to localized labels — keep enum stable (it's stored
  // in the DB CHECK constraint), but translate the visible text.
  const reasonLabel: Record<(typeof REASON_VALUES)[number], string> = {
    damaged_in_transit: t("reason_damaged"),
    spoiled_on_arrival: t("reason_spoiled"),
    wrong_item: t("reason_wrong"),
    lost_in_transit: t("reason_lost"),
    delayed_30_days: t("reason_delayed"),
    other: t("reason_other"),
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("toast_missing_title"), {
        description:
          parsed.error.issues[0]?.message ?? t("toast_failed_default"),
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/refunds/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(t("toast_failed_title"), {
          description: data?.details ?? t("toast_failed_default"),
        });
        console.error("[refund-request] failed", data);
        setLoading(false);
        return;
      }
      setSubmitted({ id: data.request_id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[refund-request] exception", err);
      toast.error(t("toast_failed_title"), { description: msg });
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="border border-sericia-line bg-sericia-paper-card p-10">
        <p className="label mb-3">{t("received_eyebrow")}</p>
        <h2 className="text-[22px] font-normal mb-4 leading-snug">
          {t("received_title")}
        </h2>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed mb-6">
          {t("received_explainer", { email: form.email })}
        </p>
        <p className="text-[12px] text-sericia-ink-mute mb-8">
          {t("received_reference")}:{" "}
          <code className="font-mono text-sericia-ink-soft">
            {submitted.id.slice(0, 8)}
          </code>
        </p>
        <div className="flex gap-6 text-[12px] tracking-wider uppercase">
          <Link href="/" className="underline-link text-sericia-ink">
            {t("received_return_home")}
          </Link>
          <Link href="/refund" className="underline-link text-sericia-ink-soft">
            {t("received_refund_policy")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <label className={labelCls}>{t("label_email")}</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputCls}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <div>
        <label className={labelCls}>{t("label_full_name")}</label>
        <input
          type="text"
          required
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className={inputCls}
          placeholder="First and last"
          autoComplete="name"
        />
      </div>
      <div>
        <label className={labelCls}>
          {t("label_order_id")}{" "}
          <span className="text-sericia-ink-mute normal-case tracking-normal">
            — {t("label_order_id_hint")}
          </span>
        </label>
        <input
          type="text"
          value={form.order_id}
          onChange={(e) => setForm({ ...form, order_id: e.target.value })}
          className={inputCls}
          placeholder="9c3a72f0-…"
        />
      </div>
      <div>
        <label className={labelCls}>{t("label_what_happened")}</label>
        <select
          required
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className={`${inputCls} cursor-pointer`}
        >
          {REASON_VALUES.map((v) => (
            <option key={v} value={v}>
              {reasonLabel[v]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>{t("label_description")}</label>
        <textarea
          required
          rows={6}
          minLength={20}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`${inputCls} resize-y`}
          placeholder={t("placeholder_description")}
        />
      </div>
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40"
        >
          {loading ? t("submit_sending") : t("submit_request")}
        </button>
        <p className="text-[12px] text-sericia-ink-mute text-center mt-5 leading-relaxed">
          {t("footer_see_policy").split(t("footer_link"))[0]}
          <Link href="/refund" className="underline-link">
            {t("footer_link")}
          </Link>
          {t("footer_see_policy").split(t("footer_link"))[1] ?? ""}
        </p>
      </div>
    </form>
  );
}
