#!/usr/bin/env node
// Mass-translate brand-tone sensitive UI strings to all locales via DeepSeek V3.
//
// Why DeepSeek V3 (not Gemini Flash, not GPT-4o-mini):
//   - Context Caching: identical system-prompt prefix across N requests
//     gets the cache-hit pricing ($0.014/1M, 90% off the cache-miss
//     $0.14/1M). For 9 locales × 50 strings × 100 tokens = 45k input
//     tokens, the first call costs ~$0.006 and subsequent calls cost
//     ~$0.0006 each. Total spend for the full run: <$0.10.
//   - Strict JSON output via response_format. We don't need a tool-call
//     dance — just send `{"locale": "ja", "strings": {...}}` and get
//     back the same shape with values translated.
//   - Brand-tone steerability via system prompt examples. The "Aesop
//     restraint" voice is preserved by feeding 5 anchor examples per
//     locale (e.g., "rescued craft food" → "救われたクラフト食品").
//
// Pipeline:
//   1. Define BRAND_GLOSSARY — anchor terms that must translate the same
//      way every time. This goes into the system prompt as cached prefix.
//   2. Define TARGETS — per-page string maps to translate. Keep small
//      so we can run the script repeatedly as we expand coverage.
//   3. For each locale × target, call DeepSeek with the system prompt
//      (cached) + the target JSON. Merge result into messages/{locale}.json.
//   4. Idempotent: skips keys that already exist for that locale unless
//      `--force` is passed.
//
// Required env:
//   DEEPSEEK_API_KEY — server SK from platform.deepseek.com
//
// Usage:
//   DEEPSEEK_API_KEY=sk-... node storefront/scripts/translate-with-deepseek.mjs
//   DEEPSEEK_API_KEY=sk-... node storefront/scripts/translate-with-deepseek.mjs --force
//   DEEPSEEK_API_KEY=sk-... node storefront/scripts/translate-with-deepseek.mjs --only=ja,de

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, "../messages");

const KEY = process.env.DEEPSEEK_API_KEY?.trim();
if (!KEY) {
  console.error("[translate] DEEPSEEK_API_KEY env required");
  process.exit(1);
}

const ALL_LOCALES = ["ja", "de", "fr", "es", "it", "ko", "zh-TW", "ru", "ar"];
const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const onlyArg = args.find((a) => a.startsWith("--only="));
const LOCALES = onlyArg
  ? onlyArg.replace("--only=", "").split(",").map((s) => s.trim())
  : ALL_LOCALES;

// Brand-tone glossary — anchors voice across translations. Goes into the
// cached system-prompt prefix; identical bytes across calls = cache hits.
const BRAND_GLOSSARY = `
You are translating UI strings for Sericia, a Japanese craft-food
storefront with an Aesop-tier brand voice. Keep the voice quiet, confident,
and editorial — never marketing-loud, never exclamation-heavy, never
emoji.

GLOSSARY (always use these mappings — including in derivative phrases):
- "rescued craft food" → ja:救われたクラフト食品 / de:gerettete Handwerksspeisen / fr:produits artisanaux sauvés / es:productos artesanales rescatados / it:prodotti artigianali salvati / ko:구조된 공예 식품 / zh-TW:救援的手作食品 / ru:спасённые крафтовые продукты / ar:أطعمة حرفية مُنقذة
- "drop" (limited release) → ja:ドロップ / de:Drop / fr:drop / es:drop / it:drop / ko:드롭 / zh-TW:限定上架 / ru:дроп / ar:إصدار محدود
- "miso / sencha / shiitake / matcha / dashi / yuzu" → keep as romaji (do not translate)
- "Kyoto / Uji / Aichi / Oita / Hokkaido" → keep as romaji
- "EMS" → keep as EMS (Japan Post brand)
- "Sericia" → keep as Sericia

STYLE RULES:
- No exclamation marks.
- Em-dashes ( — ) preserved as-is across all locales.
- Sentence-final period preserved (or 。 in ja, zh-TW; ‏. in ar).
- For ja: avoid colloquialisms like レジ (use ご注文手続き).
- For zh-TW: use Traditional characters, not Simplified.
- For ar: use Modern Standard Arabic (MSA), right-to-left preserved.

OUTPUT FORMAT:
- Strict JSON only. No prose around the JSON. No code fences.
- Same keys as input. Translated values.
`.trim();

// Targets to translate. Each entry's `enValues` provides the canonical
// English source; `keyPath` is the dot-separated path inside messages/X.json.
//
// Add more targets here as we expand coverage. Keeping each batch small
// means we can ship translations incrementally and review per-batch
// before pushing the whole tree.
const TARGETS = [
  {
    name: "refund_request_page",
    keyPath: "refund_request",
    enValues: {
      eyebrow: "Refund or return",
      title: "Tell us what happened.",
      lede: "Write to us within seven days of delivery. We respond within 48 hours during Japan business hours and process approved refunds within seven business days to the original payment method.",
      reason_damaged: "Damaged in transit",
      reason_spoiled: "Spoiled on arrival",
      reason_wrong: "Wrong item shipped",
      reason_lost: "Lost in transit",
      reason_delayed: "Delayed 30+ days",
      reason_other: "Other",
      label_email: "Email address",
      label_full_name: "Full name",
      label_order_id: "Order ID",
      label_order_id_hint: "from your confirmation email",
      label_what_happened: "What happened",
      label_description: "Description",
      placeholder_description:
        "Please describe what arrived, when, and what was wrong. Photographs help — reply to our follow-up with attachments.",
      submit_request: "Submit request",
      submit_sending: "Sending…",
      received_eyebrow: "Received",
      received_title: "Thank you. We'll review your request within 48 hours.",
      received_explainer:
        "A confirmation has been sent to {email}. If we need photographs or further detail we'll reply directly to that address.",
      received_reference: "Reference",
      received_return_home: "Return home",
      received_refund_policy: "Refund policy",
      footer_see_policy: "See our refund policy for what is and isn't eligible. We respond within 48 hours during Japan business hours.",
      footer_link: "refund policy",
      toast_missing_title: "A detail is missing.",
      toast_failed_title: "We couldn't submit your request.",
      toast_failed_default:
        "Please try again in a moment, or email contact@sericia.com directly.",
    },
  },
  {
    name: "checkout_payment",
    keyPath: "checkout_payment",
    enValues: {
      preparing: "Preparing payment",
      ready_eyebrow: "Complete your order",
      ready_title: "Securely pay ${amount} USD.",
      pay_button: "Pay with card",
      pci_disclaimer:
        "You'll be taken to our payment partner Crossmint to complete payment. PCI-compliant. 256-bit TLS. We never see your card number.",
      order_id_label: "Order ID",
      error_eyebrow: "Payment temporarily unavailable",
      error_outage_title: "We're finalising the card payment integration.",
      error_outage_lede:
        "Email us with your order ID and we'll send a secure payment link within two hours during Japan business hours.",
      error_network_title: "We couldn't reach the payment provider.",
      error_network_lede:
        "Please retry in a moment, or email us if it persists.",
      try_again: "Try again",
      email_concierge: "Email concierge",
    },
  },
  // ─────────────────────────────────────────────────────────────────
  // F63 — customer account pages full i18n coverage. Each TARGET ships
  // ~10-15 keys to keep DeepSeek output focused (smaller batches = fewer
  // misses per request) and to let editors review per-page.
  // ─────────────────────────────────────────────────────────────────
  {
    name: "account_overview",
    keyPath: "account.overview_page",
    enValues: {
      eyebrow: "Account",
      welcome_default: "Welcome",
      lede: "Manage your orders, shipping addresses and preferences. Your drops ship EMS from Kyoto within 48 hours of payment.",
      label_email: "Email",
      label_member_since: "Member since",
      label_member_since_today: "today",
      label_orders_count: "Orders",
      card_orders_label: "Orders",
      card_orders_title: "Track and download receipts",
      card_orders_lede: "View order history and tracking numbers.",
      card_addresses_label: "Addresses",
      card_addresses_title: "Default shipping",
      card_addresses_lede: "Keep your ship-to address up to date.",
      card_settings_label: "Settings",
      card_settings_title: "Profile, email & language",
      card_settings_lede: "Edit your name, language, email or delete your account.",
    },
  },
  {
    name: "account_addresses",
    keyPath: "account.addresses_page",
    enValues: {
      eyebrow: "Addresses",
      title: "Default shipping address.",
      lede: "Used to pre-fill checkout. You can still change it for any single order.",
      form_full_name: "Full name",
      form_address_line1: "Address line 1",
      form_address_line2: "Address line 2",
      form_address_line2_optional: "optional",
      form_city: "City",
      form_region: "State / Region",
      form_postal_code: "Postal code",
      form_country: "Country",
      form_phone: "Phone",
      form_phone_hint: "for customs",
      submit_save: "Save address",
      submit_saving: "Saving…",
      toast_saved: "Address saved",
      toast_not_signed_in: "Not signed in",
    },
  },
  // Common form/UI labels reused across multiple customer pages so they
  // pick up consistent translations (e.g. Japanese 保存 not 保存する vs
  // セーブ inconsistency). Add to this set sparingly — only strings used
  // in 3+ places benefit from being shared.
  {
    name: "common_ui",
    keyPath: "common",
    enValues: {
      save: "Save",
      saving: "Saving…",
      cancel: "Cancel",
      submit: "Submit",
      submitting: "Submitting…",
      loading: "Loading…",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      continue: "Continue",
      copied: "Copied",
      empty_state: "Nothing here yet.",
      error_generic: "Something went wrong. Please try again.",
      error_network: "We couldn't reach the server. Please retry in a moment.",
      sign_in_required: "Please sign in to continue.",
    },
  },
  {
    name: "account_orders",
    keyPath: "account.orders_page",
    enValues: {
      eyebrow: "Orders",
      title: "Order history.",
      lede_fmt: "All orders attached to {email}.",
      empty_label: "No orders yet",
      empty_lede:
        "When you place your first order it will appear here with tracking and receipts.",
      browse_collection: "Browse the collection",
      table_status_tracked: "Tracked",
      table_status_dash: "—",
    },
  },
  {
    name: "account_wishlist",
    keyPath: "account.wishlist_page",
    enValues: {
      eyebrow: "Wishlist",
      empty_title: "Your wishlist is empty.",
      empty_lede:
        "Save the things you love by tapping the heart on any product — they'll wait for you here until you're ready.",
      browse_collection: "Browse the collection",
      saved_for_later: "Saved for later",
      clear_button: "Clear",
      add_all_button: "Add all to cart",
      add_to_cart_button: "Add to cart",
      saved_at_fmt: "Saved {date}",
      remove_aria_fmt: "Remove {name} from wishlist",
      toast_added_to_cart_fmt: "Added to cart — {name}",
      toast_added_all_singular: "Added 1 item to cart",
      toast_added_all_plural_fmt: "Added {count} items to cart",
      toast_removed_fmt: "Removed — {name}",
      toast_cleared: "Wishlist cleared",
      confirm_clear: "Clear your whole wishlist?",
    },
  },
  {
    name: "account_orders_detail",
    keyPath: "account.orders_detail",
    enValues: {
      back_link: "← All orders",
      eyebrow: "Order",
      label_items: "Items",
      label_total: "Total",
      label_status: "Status",
      label_tracking: "Tracking",
      label_ship_to: "Ship to",
      placed_fmt: "Placed {date}",
      paid_fmt: "Paid {date}",
      shipped_fmt: "Shipped {date}",
      track_parcel: "Track parcel",
      qty_fmt: "Qty {count}",
      item_fallback: "Item",
      ems_fallback: "EMS",
    },
  },
  {
    name: "account_settings",
    keyPath: "account.settings_page",
    enValues: {
      eyebrow: "Settings",
      title: "Profile, email & language.",
      lede: "Update what we know about you. Changes apply to future orders.",
      section_profile: "Profile",
      section_email: "Email",
      section_address: "Shipping address & phone",
      section_payment: "Payment information",
      section_delete: "Delete account",
      form_full_name: "Full name",
      form_full_name_placeholder: "e.g. Hana Sato",
      form_preferred_language: "Preferred language",
      form_email_address: "Email address",
      form_delete_confirm: "Type DELETE to confirm",
      submit_save_profile: "Save profile",
      submit_saving: "Saving…",
      submit_update_email: "Update email",
      submit_sending: "Sending…",
      submit_delete_account: "Delete account",
      submit_deleting: "Deleting…",
      delete_warning:
        "This permanently removes your account, addresses, and order history. You'll lose access to past receipts. We can't undo this.",
      payment_info_lede:
        "Card details are stored with our payment partner Stripe — never on Sericia. To update, complete your next purchase with the new card; we'll save it for future orders if you choose.",
      address_redirect_lede:
        "Manage your default shipping address from the Addresses page.",
      address_redirect_link: "Edit address →",
      toast_profile_updated: "Profile updated",
      toast_email_change_requested:
        "Email change requested. Check both inboxes to confirm.",
      toast_delete_confirm: "Type DELETE to confirm",
      toast_account_deleted: "Account deleted",
      toast_not_signed_in: "Not signed in",
    },
  },
  {
    name: "account_referrals",
    keyPath: "account.referrals_page",
    enValues: {
      eyebrow: "Referrals",
      loading_title: "Loading your referral code…",
      error_title: "We couldn't load your code.",
      error_sign_in: "Please sign in to view your referral code.",
      error_default: "Could not load your referral code.",
      error_retry: "Try again",
      title_with_code: "Refer a friend, both get $5.",
      lede:
        "Share your code with someone who'd love Sericia. They get $5 off their first order; you earn a $5 credit when their order ships.",
      label_your_code: "Your code",
      label_your_link: "Or share this link",
      copy_link_aria: "Copy referral link",
      copy_link_button: "Copy link",
      share_button: "Share",
      share_title: "Sericia",
      share_text_default: "Something you'll like — Sericia",
      label_your_earnings: "Your earnings",
      stat_friends_redeemed: "Friends redeemed",
      stat_credits_issued: "Credits issued",
      stat_pending: "Pending",
      label_how_it_works: "How it works",
      step_pending_lede:
        "the reward clears when your friend's order ships from Kyoto. We'll email when credit is issued to your account.",
      step_one: "Share your code or link with a friend",
      step_two:
        "They get $5 off their first Sericia order at checkout (no minimum)",
      step_three:
        "You earn a $5 credit on your account once their order ships from Kyoto",
      toast_link_copied: "Link copied to clipboard",
    },
  },
  // ─────────────────────────────────────────────────────────────────
  // F69 — comprehensive i18n sweep. Hardcoded English detected in
  // homepage labels, journal/compare/uses page section titles, toast
  // notifications across customer-facing forms, and aria-labels on
  // common UI primitives. Grouped per page/component.
  // ─────────────────────────────────────────────────────────────────
  {
    name: "home_spec_labels",
    keyPath: "home_sections.spec",
    enValues: {
      price: "Price",
      weight: "Weight",
      ships_within: "Ships within",
      availability: "Availability",
      sold_out: "Sold out — join the waitlist for the next drop",
      remaining_fmt: "{remaining} of {total} remaining",
      sold_out_short: "This drop has sold out.",
      billed_usd_fmt: "≈ ${amount} billed USD",
      purchase_fmt: "Purchase — ${amount}",
      ems_disclaimer:
        "EMS worldwide · ships within {hours}h from Kyoto · Card checkout in USD. Duties & taxes calculated at destination.",
      stat_countries: "Countries shipped",
      stat_dispatch: "Dispatch from Kyoto",
      stat_producers: "Producers paid full price",
      clockwise_caption: "Clockwise · Sencha · Miso · Shiitake",
    },
  },
  {
    name: "products_listing",
    keyPath: "products.listing_extras",
    enValues: {
      no_matches: "No matches",
      no_matches_hint: "Try a different category or clear filters.",
      clear_filters: "Clear filters",
    },
  },
  {
    name: "pdp_extras",
    keyPath: "pdp.extras",
    enValues: {
      the_story: "The story",
      recommended_pairings: "Recommended pairings",
      keep_reading: "Keep reading",
      frequently_asked: "Frequently asked",
    },
  },
  {
    name: "journal_listing",
    keyPath: "journal.listing",
    enValues: {
      eyebrow: "Journal",
      title: "Field notes from Japan.",
      lede: "Producer stories, brewing notes and country-by-country shipping guides for Sericia's rescued craft food.",
      country_guides_intro:
        "Country guides walk through importing tea, miso, shiitake and more from Japan — customs, EMS transit, and what's worth bringing in.",
      nothing_yet: "Nothing yet",
      nothing_yet_lede:
        "We publish field notes after every drop. Subscribe and we'll send the next one when it lands.",
      read_more: "Read more",
    },
  },
  {
    name: "compare_page",
    keyPath: "compare.sections",
    enValues: {
      at_a_glance: "At a glance",
      how_to_choose: "How to choose",
      frequently_asked: "Frequently asked",
      browse_other: "Browse other comparisons",
      related: "Related comparisons",
      cross_ship_save: "Cross-ship & save",
      cross_ship_lede:
        "Add both to a single drop and the per-item EMS cost drops. We hand-pack and ship within 48h from Kyoto.",
    },
  },
  {
    name: "uses_page",
    keyPath: "uses.sections",
    enValues: {
      why_combination: "Why this combination works",
      frequently_asked: "Frequently asked",
      related_uses: "Related uses",
      try_it: "Try this pairing",
      try_it_lede:
        "Hand-packed, rescued from surplus, shipped EMS from Kyoto within 48 hours.",
    },
  },
  {
    name: "waitlist_form",
    keyPath: "forms.waitlist",
    enValues: {
      cta_default: "Join",
      placeholder_email: "Your email address",
      toast_invalid: "Please enter a valid email",
      toast_already: "You're already on the list — see you at the next drop!",
      toast_failed: "Could not subscribe. Please try again.",
      toast_success: "You're in. We'll email 24h before the next drop.",
      toast_network: "Network error — please try again",
      confirmed: "✓ Early-access confirmed. Check your inbox.",
    },
  },
  {
    name: "footer_subscribe",
    keyPath: "forms.footer_subscribe",
    enValues: {
      sr_email: "Email address",
      placeholder_email: "Your email",
      cta: "Subscribe",
      toast_invalid: "Please enter a valid email address.",
      toast_success: "You're on the list. See you at the next drop.",
      toast_already: "You're already subscribed — see you at the next drop.",
      toast_failed: "Could not subscribe. Please try again.",
      toast_network: "Network error. Please try again.",
    },
  },
  {
    name: "notify_me_modal",
    keyPath: "forms.notify_me",
    enValues: {
      title: "Notify me when back",
      lede:
        "We'll email you the moment this returns to the catalogue. No marketing, no upsells.",
      placeholder_email: "Your email address",
      cta: "Notify me",
      cta_loading: "Saving…",
      toast_success: "You're on the list — we'll email you the moment it's back.",
      toast_failed: "Could not save. Please try again.",
      close: "Close",
    },
  },
  {
    name: "push_optin",
    keyPath: "forms.push_optin",
    enValues: {
      title: "Whisper next drop",
      lede:
        "We send one notification per drop — 24h before public release. Tap to enable.",
      cta_enable: "Enable drop alerts",
      cta_enabling: "Enabling…",
      toast_success: "Drop alerts on. We'll whisper, never shout.",
      toast_blocked:
        "Browser blocked notifications. You can enable them in site settings.",
      toast_failed: "Couldn't subscribe right now. Try again in a moment.",
    },
  },
  {
    name: "cart_checkout_extras",
    keyPath: "cart.checkout_extras",
    enValues: {
      empty_cart: "Empty cart",
      empty_cart_lede:
        "Your cart is empty. Visit the drop to add the bundle.",
      shop_drop: "Shop the drop",
      order_summary: "Order summary",
      label_email: "Email address",
      label_full_name: "Full name",
      label_address1: "Address",
      label_address2: "Apartment, suite (optional)",
      label_city: "City",
      label_state: "State / Region",
      label_postal: "Postal code",
      label_country: "Country",
      label_phone: "Phone (for customs)",
      placeholder_email: "you@example.com",
      placeholder_full_name: "First and last",
      placeholder_address1: "Street, number",
      placeholder_address2: "Apartment, suite, unit",
      placeholder_city: "City",
      placeholder_state: "State / Region",
      placeholder_postal: "Postal code",
      placeholder_phone: "Phone (for customs)",
      submit_reserve: "Reserve & continue",
      submit_reserving: "Reserving…",
      toast_empty: "Your cart is empty.",
      toast_missing: "A detail is missing.",
      toast_reserved: "Reserved.",
      toast_interrupted: "Something interrupted the request.",
      toast_redirect: "Order reserved. Redirecting to payment…",
      toast_network: "Network error — please try again",
      toast_unavailable: "Drop not available.",
    },
  },
  {
    name: "content_sidebar",
    keyPath: "common.sidebar",
    enValues: {
      shop_the_story: "Shop the story",
      drop_alerts: "Drop alerts",
      related_tools: "Related tools",
      related_guides: "Related guides",
      in_page_nav: "In-page navigation",
      account_nav: "Account navigation",
      breadcrumb: "Breadcrumb",
      newsletter_placeholder: "Your email address",
      newsletter_cta: "Subscribe",
      toast_invalid_email: "Enter a valid email address.",
      toast_subscribed: "Thank you — you're on the list.",
    },
  },
  {
    name: "a11y_common",
    keyPath: "common.a11y",
    enValues: {
      back_to_top: "Back to top",
      close_cart: "Close cart",
      open_cart: "Open cart",
      decrease: "Decrease",
      increase: "Increase",
      decrease_qty: "Decrease quantity",
      increase_qty: "Increase quantity",
      sericia_assistant: "Sericia Assistant",
      cinematic_interstitial: "Cinematic interstitial",
      email_address: "Email address",
      signed_out: "Signed out",
      signed_in: "Signed in",
      drop_not_available: "Drop not available.",
    },
  },
];

async function deepseekTranslate(targetLocale, target) {
  const userPrompt =
    `Target locale: ${targetLocale}\n\n` +
    `Translate every value of this JSON to ${targetLocale} per the glossary + rules.\n` +
    `Return strictly the same JSON shape, values translated.\n\n` +
    `Input:\n${JSON.stringify(target.enValues, null, 2)}`;

  // DeepSeek's OpenAI-compatible chat-completions endpoint. The system
  // prompt is byte-identical across all calls so DeepSeek's automatic
  // Context Caching kicks in (90% discount on subsequent calls).
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: BRAND_GLOSSARY },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `[translate] DeepSeek HTTP ${res.status}: ${JSON.stringify(json).slice(0, 400)}`,
    );
  }
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`[translate] DeepSeek empty content`);
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(
      `[translate] non-JSON response: ${content.slice(0, 300)}`,
    );
  }
  const usage = json.usage || {};
  return {
    parsed,
    cacheHit: usage.prompt_cache_hit_tokens ?? 0,
    cacheMiss: usage.prompt_cache_miss_tokens ?? usage.prompt_tokens ?? 0,
    completion: usage.completion_tokens ?? 0,
  };
}

function setNested(obj, dottedPath, value) {
  const parts = dottedPath.split(".");
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cursor[parts[i]] ??= {};
    cursor = cursor[parts[i]];
  }
  const last = parts[parts.length - 1];
  cursor[last] ??= {};
  // shallow-merge so we don't trample sibling keys
  Object.assign(cursor[last], value);
}

function getNested(obj, dottedPath) {
  return dottedPath.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

let totalCalls = 0;
let totalCacheHit = 0;
let totalCacheMiss = 0;
let totalCompletion = 0;

for (const target of TARGETS) {
  console.log(`[translate] target: ${target.name} (${Object.keys(target.enValues).length} strings)`);

  // Always write English first so the source-of-truth lives in en.json
  const enFile = path.join(MESSAGES_DIR, "en.json");
  const enJson = JSON.parse(fs.readFileSync(enFile, "utf8"));
  const existingEn = getNested(enJson, target.keyPath) ?? {};
  if (FORCE || Object.keys(existingEn).length === 0) {
    setNested(enJson, target.keyPath, target.enValues);
    fs.writeFileSync(enFile, JSON.stringify(enJson, null, 2) + "\n", "utf8");
    console.log(`   en: wrote source`);
  }

  for (const locale of LOCALES) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const existing = getNested(json, target.keyPath) ?? {};
    if (!FORCE && Object.keys(existing).length > 0) {
      console.log(`   ${locale}: skipped (already populated; use --force to overwrite)`);
      continue;
    }

    try {
      const { parsed, cacheHit, cacheMiss, completion } =
        await deepseekTranslate(locale, target);
      // Sanity: parsed must contain all expected keys
      const missing = Object.keys(target.enValues).filter(
        (k) => parsed[k] === undefined,
      );
      if (missing.length) {
        console.error(
          `   ${locale}: ⚠️ DeepSeek missed keys: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`,
        );
      }
      setNested(json, target.keyPath, parsed);
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n", "utf8");
      totalCalls++;
      totalCacheHit += cacheHit;
      totalCacheMiss += cacheMiss;
      totalCompletion += completion;
      console.log(
        `   ${locale}: wrote ${Object.keys(parsed).length} keys (cache hit ${cacheHit} / miss ${cacheMiss} / out ${completion})`,
      );
      // tiny pause to be friendly (not strictly required for DeepSeek)
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.error(`   ${locale}: FAILED — ${e.message}`);
    }
  }
}

console.log("");
console.log("[translate] === SUMMARY ===");
console.log(`[translate] Calls: ${totalCalls}`);
console.log(`[translate] Cache hit tokens:  ${totalCacheHit}`);
console.log(`[translate] Cache miss tokens: ${totalCacheMiss}`);
console.log(`[translate] Completion tokens: ${totalCompletion}`);
// DeepSeek pricing (2026): cache-hit input $0.014/1M, cache-miss input $0.14/1M, output $0.28/1M.
const cost =
  (totalCacheHit * 0.014 + totalCacheMiss * 0.14 + totalCompletion * 0.28) /
  1_000_000;
console.log(`[translate] Approx cost: $${cost.toFixed(6)} USD`);
