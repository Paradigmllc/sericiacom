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
      model: "deepseek-chat",
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
