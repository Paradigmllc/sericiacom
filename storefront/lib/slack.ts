/**
 * Slack Block Kit helpers for order-lifecycle notifications.
 *
 * Rule N (CLAUDE.md): every order event must fire both a DB bell
 * (sericia_events row) AND a Slack message — partial coverage hides issues.
 *
 * Channel: #all-paradigm (C0A9SPSTL4X)
 * Env:     SLACK_WEBHOOK_URL set in Coolify → Storefront
 *
 * All helpers are **fire-and-forget**: Slack outages must never block the
 * checkout or payment path. Every network error is logged + swallowed.
 *
 * Extend-here when adding new events (shipped, refunded, review-requested) —
 * this keeps the Block Kit visual style consistent across #all-paradigm.
 */

const WEBHOOK = process.env.SLACK_WEBHOOK_URL;

async function post(body: object): Promise<Response | null> {
  if (!WEBHOOK) {
    console.warn("[slack] SLACK_WEBHOOK_URL not set — skipping notify");
    return null;
  }
  try {
    return await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (e) {
    console.error("[slack] post failed (non-fatal)", e);
    return null;
  }
}

export function notifySlackOrderCreated(payload: {
  order_id: string;
  email: string;
  full_name: string;
  amount_usd: number;
  country_code: string;
  item_names: string[];
}): Promise<Response | null> {
  return post({
    text: `🛍️ New Sericia order · $${payload.amount_usd} · ${payload.country_code}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🛍️ Sericia order reserved — $${payload.amount_usd}`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Buyer:*\n${payload.full_name}` },
          { type: "mrkdwn", text: `*Email:*\n${payload.email}` },
          { type: "mrkdwn", text: `*Country:*\n${payload.country_code}` },
          {
            type: "mrkdwn",
            text: `*Order ID:*\n\`${payload.order_id.slice(0, 8)}\``,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Items:*\n• ${payload.item_names.join("\n• ")}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "_Status: pending payment. Crossmint will mark paid when Stripe confirms._",
          },
        ],
      },
    ],
  });
}

export function notifySlackOrderPaid(payload: {
  order_id: string;
  email: string;
  full_name: string;
  amount_usd: number;
  tx_hash: string | null;
  crossmint_order_id: string | null;
  inventory_decremented: number;
  inventory_total: number;
}): Promise<Response | null> {
  const inventoryNote =
    payload.inventory_total === 0
      ? "No items to decrement."
      : payload.inventory_decremented === payload.inventory_total
        ? `Inventory decremented on ${payload.inventory_decremented}/${payload.inventory_total} lines. Ship via EMS within 48h.`
        : `⚠️ Inventory decremented on ${payload.inventory_decremented}/${payload.inventory_total} lines — check Medusa admin.`;

  return post({
    text: `💰 Sericia PAID · $${payload.amount_usd}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `💰 Payment confirmed — $${payload.amount_usd}`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Buyer:*\n${payload.full_name}` },
          { type: "mrkdwn", text: `*Email:*\n${payload.email}` },
          {
            type: "mrkdwn",
            text: `*Order ID:*\n\`${payload.order_id.slice(0, 8)}\``,
          },
          {
            type: "mrkdwn",
            text: `*Crossmint:*\n\`${payload.crossmint_order_id ?? "–"}\``,
          },
        ],
      },
      ...(payload.tx_hash
        ? [
            {
              type: "context" as const,
              elements: [
                {
                  type: "mrkdwn" as const,
                  text: `_Tx: \`${payload.tx_hash.slice(0, 16)}…\`_`,
                },
              ],
            },
          ]
        : []),
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: `_${inventoryNote}_` }],
      },
    ],
  });
}
