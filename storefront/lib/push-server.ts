/**
 * Server-side Web Push sender.
 *
 * Call sites (planned):
 *   - Medusa subscriber on drop-release → target `topics @> '{drops}'`
 *   - Medusa subscriber on order-shipped → target single endpoint(s)
 *   - n8n workflow for cart abandon (T+24h) → target anonymous visitors
 *
 * Why this lives in lib/ and not /api/: the sends fan out to potentially
 * thousands of endpoints per drop, which is a poor fit for a stateless
 * route handler. The expected caller is either a Medusa subscriber (runs
 * inside its own worker) or an n8n node that imports this module via a
 * thin /api/push/send admin route guarded by SERICIA_ADMIN_SECRET.
 *
 * Error handling: per-endpoint errors are isolated so one 410 Gone doesn't
 * abort the batch. 410 (subscription expired) and 404 (subscription not
 * found at the push service) are the expected reasons to auto-revoke a
 * stored row — we mark `revoked_at` in those cases so the next batch skips
 * them. Other errors (e.g. 500 from FCM) leave the row intact for retry.
 */

import webpush, { type PushSubscription, type WebPushError } from "web-push";
import { supabaseAdmin } from "./supabase-admin";

let configured = false;

function configureWebPush() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:contact@sericia.com";
  if (!publicKey || !privateKey) {
    throw new Error(
      "[push-server] VAPID keys missing. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  icon?: string;
  image?: string;
  badge?: string;
};

export type PushTarget = {
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

export type SendResult = {
  endpoint: string;
  ok: boolean;
  statusCode?: number;
  error?: string;
  revoked?: boolean;
};

/** Send to a specific list of endpoints. Returns per-endpoint results. */
export async function sendPushBatch(
  targets: readonly PushTarget[],
  payload: PushPayload,
): Promise<SendResult[]> {
  configureWebPush();
  const body = JSON.stringify(payload);

  const results = await Promise.all(
    targets.map(async (t) => {
      const sub: PushSubscription = {
        endpoint: t.endpoint,
        keys: { p256dh: t.p256dh, auth: t.auth_key },
      };
      try {
        const res = await webpush.sendNotification(sub, body);
        return { endpoint: t.endpoint, ok: true, statusCode: res.statusCode };
      } catch (e) {
        const err = e as WebPushError;
        const status = err?.statusCode;
        // 404 = endpoint no longer exists; 410 = subscription expired.
        // Both mean the row is dead-on-arrival and should be revoked so we
        // don't waste HTTP calls on the next batch.
        const shouldRevoke = status === 404 || status === 410;
        if (shouldRevoke) {
          await supabaseAdmin
            .from("sericia_push_subscriptions")
            .update({ revoked_at: new Date().toISOString() })
            .eq("endpoint", t.endpoint);
        }
        return {
          endpoint: t.endpoint,
          ok: false,
          statusCode: status,
          error: err?.body ?? (e instanceof Error ? e.message : String(e)),
          revoked: shouldRevoke,
        };
      }
    }),
  );

  return results;
}

/**
 * Target subscriptions by topic (e.g. "drops", "orders"). Revoked
 * subscriptions are skipped automatically via partial index predicate.
 */
export async function sendPushByTopic(
  topic: string,
  payload: PushPayload,
): Promise<SendResult[]> {
  const { data, error } = await supabaseAdmin
    .from("sericia_push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .contains("topics", [topic])
    .is("revoked_at", null);

  if (error) {
    console.error("[push-server] topic query failed", error);
    throw new Error(`topic query failed: ${error.message}`);
  }
  if (!data || data.length === 0) return [];

  return sendPushBatch(data as PushTarget[], payload);
}

/**
 * Target a specific user's devices (may have multiple — laptop + phone).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<SendResult[]> {
  const { data, error } = await supabaseAdmin
    .from("sericia_push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (error) {
    console.error("[push-server] user query failed", error);
    throw new Error(`user query failed: ${error.message}`);
  }
  if (!data || data.length === 0) return [];

  return sendPushBatch(data as PushTarget[], payload);
}
