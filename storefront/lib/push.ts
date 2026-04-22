/**
 * Browser-side Web Push helpers.
 *
 * Flow:
 *   1. Caller invokes `subscribeToPush(opts)`.
 *   2. We verify environment support (SW + PushManager + Notification).
 *   3. We request permission. If the user denies, we surface the state —
 *      the caller decides whether to show a "you can enable in browser
 *      settings" hint. We NEVER re-prompt; browsers blacklist spammy sites.
 *   4. We subscribe via PushManager using the server's VAPID public key.
 *   5. We POST the PushSubscription to /api/push/subscribe so the server
 *      can persist it in Supabase and target pushes later.
 *
 * Design notes:
 * - The VAPID public key comes from NEXT_PUBLIC_VAPID_PUBLIC_KEY. It's safe
 *   to expose; the private half lives server-side only.
 * - We throw structured errors (new Error with a stable `.message` prefix)
 *   so callers can toast a specific message instead of a generic failure.
 */

export type PushSubscribeResult =
  | { ok: true; subscription: PushSubscriptionJSON }
  | { ok: false; reason: "unsupported" | "denied" | "dismissed" | "error"; detail?: string };

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Current permission state. Does NOT prompt. */
export function getPushPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/**
 * Subscribe the current browser to Web Push.
 *
 * Caller is responsible for:
 *   - showing a pre-prompt ("Allow drop alerts?") before calling this, so
 *     the native browser prompt only appears when the user is committed.
 *   - surfacing the returned reason when ok=false.
 */
export async function subscribeToPush(opts: {
  topics?: readonly string[];
  locale?: string | null;
} = {}): Promise<PushSubscribeResult> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublic) {
    return { ok: false, reason: "error", detail: "VAPID public key missing" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "denied") return { ok: false, reason: "denied" };
    if (permission !== "granted") return { ok: false, reason: "dismissed" };

    const reg = await navigator.serviceWorker.ready;

    // Re-use an existing subscription if one already exists for this browser.
    // Calling subscribe() twice returns the same subscription on most browsers
    // but being defensive keeps us compatible with Safari quirks.
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast: TS 5.7 narrows Uint8Array to ArrayBufferLike by default, but
        // PushSubscriptionOptionsInit.applicationServerKey wants BufferSource
        // (ArrayBuffer only, not SharedArrayBuffer). The runtime value is a
        // regular ArrayBuffer-backed Uint8Array, so the cast is safe — it
        // only drops the SharedArrayBuffer branch that never exists here.
        applicationServerKey: urlBase64ToUint8Array(vapidPublic) as BufferSource,
      }));

    const json = sub.toJSON();

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: json,
        topics: opts.topics ?? ["drops", "orders"],
        locale: opts.locale ?? null,
        user_agent: navigator.userAgent,
      }),
      credentials: "include",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      // Roll back client subscription if server persist failed — keeps the
      // browser's PushManager state and our DB state consistent.
      try { await sub.unsubscribe(); } catch { /* best-effort */ }
      return { ok: false, reason: "error", detail: `server_${res.status}` };
    }
    return { ok: true, subscription: json };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: "error", detail };
  }
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean }> {
  if (!isPushSupported()) return { ok: true };
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return { ok: true };

    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
      credentials: "include",
      signal: AbortSignal.timeout(5_000),
    }).catch(() => { /* server cleanup is best-effort — revoked flag set on next send */ });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * VAPID public keys are transmitted as URL-safe base64 (RFC 4648 §5).
 * PushManager.subscribe expects a raw Uint8Array of the decoded bytes.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
