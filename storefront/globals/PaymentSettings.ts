import type { GlobalConfig } from "payload";

/**
 * F55 — PaymentSettings global.
 *
 * Single source of truth for everything an editor (non-engineer) might want
 * to change about checkout WITHOUT a code deploy:
 *
 *   1. Country → enabled payment-method allowlist
 *      Editor opens row, ticks/unticks methods, saves. Storefront picks
 *      it up on next request (server-side cache TTL ≤ 60s).
 *
 *   2. Default fallback methods
 *      What gets shown for a country we haven't explicitly listed.
 *      Currently card + Apple Pay + Google Pay (universal coverage).
 *
 *   3. Checkout page copy (localized across all 10 supported locales)
 *      Eyebrow, heading, subhead, reservation note. Editor can A/B
 *      conversion copy in real time.
 *
 *   4. Payment receipt + footer disclaimers
 *      "Receipt to {email}" / "Secured by Hyperswitch" etc.
 *
 * Hardcoded values in `lib/payment-routing.ts` are a SAFETY FALLBACK only —
 * they take effect if Payload is unreachable (network / DB issue at request
 * time). The runtime path always tries Payload first; checkout never breaks
 * because Payload had a hiccup.
 *
 * Per the project's content rule (2026-04-30 directive): "全コンテンツは
 * ハードコードNG、DB化、PayloadCMSで編集可能に". Every visible string and
 * every business rule the editor would reasonably want to tune lives here.
 */

const PAYMENT_METHOD_OPTIONS = [
  { label: "Card", value: "card" },
  { label: "Apple Pay", value: "apple_pay" },
  { label: "Google Pay", value: "google_pay" },
  { label: "PayPal", value: "paypal" },
  { label: "Klarna", value: "klarna" },
  { label: "Afterpay / Clearpay", value: "afterpay_clearpay" },
  { label: "iDEAL (Netherlands)", value: "ideal" },
  { label: "SEPA Debit (EU)", value: "sepa_debit" },
  { label: "Alipay (China)", value: "alipay" },
  { label: "WeChat Pay (China)", value: "we_chat_pay" },
  { label: "Konbini (Japan)", value: "konbini" },
] as const;

export const PaymentSettings: GlobalConfig = {
  slug: "paymentSettings",
  label: "Payment Settings",
  admin: {
    group: "Settings",
    description:
      "Editor-controlled payment configuration: country → method allowlist, checkout copy, receipt disclaimers. Storefront falls back to safe defaults (card + Apple Pay + Google Pay) for any country not listed here.",
  },
  access: {
    read: () => true, // public read (storefront server reads at request time)
    update: ({ req: { user } }) =>
      !!user && (user.role === "admin" || user.role === "editor"),
  },
  fields: [
    // ────────────────────────────────────────────────────────────────
    // Country → enabled payment methods
    // ────────────────────────────────────────────────────────────────
    {
      name: "countryMethods",
      type: "array",
      label: "Country → enabled payment methods",
      admin: {
        description:
          "Per-country allowlist. The customer's billing country (or CF-IPCountry header for guest checkout) selects the row. Hyperswitch silently filters methods to what's actually configured on the connected PSP — over-listing is safe.",
        initCollapsed: true,
      },
      fields: [
        {
          name: "code",
          type: "text",
          required: true,
          label: "Country code (ISO 3166-1 alpha-2, lowercase)",
          admin: {
            description: 'e.g. "us", "jp", "uk", "de". Must be lowercase.',
          },
        },
        {
          name: "displayName",
          type: "text",
          label: "Display name (admin only)",
          admin: { description: 'Optional human-readable label, e.g. "United States".' },
        },
        {
          name: "methods",
          type: "select",
          hasMany: true,
          required: true,
          options: PAYMENT_METHOD_OPTIONS as unknown as { label: string; value: string }[],
          label: "Enabled methods (order = display order)",
          admin: {
            description:
              "Drag to reorder. The first method here will be the topmost option in the customer's payment element.",
          },
        },
        {
          name: "active",
          type: "checkbox",
          defaultValue: true,
          label: "Active",
          admin: {
            description:
              "Untick to temporarily exclude this country from the payment matrix without deleting the row (e.g. during a regulatory pause).",
          },
        },
      ],
    },

    // ────────────────────────────────────────────────────────────────
    // Default fallback methods (any country not listed above)
    // ────────────────────────────────────────────────────────────────
    {
      name: "defaultMethods",
      type: "select",
      hasMany: true,
      label: "Default methods (fallback for unlisted countries)",
      defaultValue: ["card", "apple_pay", "google_pay"],
      options: PAYMENT_METHOD_OPTIONS as unknown as { label: string; value: string }[],
      admin: {
        description:
          "Used when a customer's country isn't in the matrix above. Keep this safe and universal — card + Apple Pay + Google Pay covers ~95% of customers globally.",
      },
    },

    // ────────────────────────────────────────────────────────────────
    // Checkout page copy (localized across 10 locales)
    // ────────────────────────────────────────────────────────────────
    {
      name: "checkoutCopy",
      type: "group",
      label: "Checkout page copy",
      admin: {
        description:
          "Localised copy on /pay/[orderId]. If left empty, the storefront falls back to the strings defined in next-intl messages.",
      },
      fields: [
        {
          name: "eyebrow",
          type: "text",
          localized: true,
          admin: {
            description:
              'Small all-caps eyebrow above the H1. Default: "Step 2 of 2 — Payment".',
          },
        },
        {
          name: "heading",
          type: "text",
          localized: true,
          admin: {
            description: 'Page H1. Default: "Complete your payment.".',
          },
        },
        {
          name: "subhead",
          type: "textarea",
          localized: true,
          admin: {
            description:
              'Subhead under the H1. Default: "Your order is reserved for fifteen minutes. Payment is processed securely in USD.".',
          },
        },
        {
          name: "reservationMinutes",
          type: "number",
          defaultValue: 15,
          admin: {
            description:
              "Minutes the order is reserved before auto-cancel. Just for display copy — actual cancellation logic is server-side.",
          },
        },
      ],
    },

    // ────────────────────────────────────────────────────────────────
    // Receipt + disclaimer copy (localized)
    // ────────────────────────────────────────────────────────────────
    {
      name: "receiptCopy",
      type: "group",
      label: "Receipt + footer disclaimers",
      admin: {
        description:
          "Lines that appear under the payment element (privacy, security badge, receipt destination).",
      },
      fields: [
        {
          name: "receiptLine",
          type: "text",
          localized: true,
          admin: {
            description:
              'Pattern with {email} placeholder. Default: "Receipt to {email} · Secured by Hyperswitch".',
          },
        },
        {
          name: "confirmationLine",
          type: "text",
          localized: true,
          admin: {
            description:
              'Pattern with {email} placeholder. Default: "Confirmation will be sent to {email}".',
          },
        },
        {
          name: "payButtonLabel",
          type: "text",
          localized: true,
          admin: {
            description:
              'Pay button label. Pattern with {amount} placeholder. Default: "Pay ${amount} USD".',
          },
        },
      ],
    },

    // ────────────────────────────────────────────────────────────────
    // Crypto / alternative payment provider toggle
    // ────────────────────────────────────────────────────────────────
    {
      name: "alternativeProviders",
      type: "group",
      label: "Alternative payment providers",
      admin: {
        description:
          "Coexistence with non-card rails. Crossmint (USDC onramp) appears as an accordion below the primary Hyperswitch element when enabled.",
      },
      fields: [
        {
          name: "crossmintEnabled",
          type: "checkbox",
          defaultValue: false,
          label: "Show Crossmint (USDC) accordion",
          admin: {
            description:
              'Activate after Crossmint Sales Onramp approval. Mirrors the NEXT_PUBLIC_CROSSMINT_ENABLED env var so editors can flip without an engineer.',
          },
        },
        {
          name: "crossmintLabel",
          type: "text",
          localized: true,
          admin: {
            description:
              'Accordion summary label. Default: "Pay with crypto (USDC) instead".',
          },
        },
      ],
    },
  ],
};
