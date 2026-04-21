"use client";
import { useEffect, useState } from "react";

type Props = { orderId: string; amountUSD: number };

export default function CrossmintPayment({ orderId, amountUSD }: Props) {
  const [crossmintOrderId, setCrossmintOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/pay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "payment_init_failed");
          return;
        }
        setCrossmintOrderId(data?.crossmintOrderId ?? null);
      } catch (e) {
        console.error("[CrossmintPayment] init failed", e);
        setError("network_error");
      }
    })();
  }, [orderId]);

  const mailto = `mailto:contact@sericia.com?subject=Order%20${orderId}%20-%20Payment%20Request&body=Hi%20Sericia%20team%2C%0A%0AI%27d%20like%20to%20complete%20my%20order.%0A%0AOrder%20ID%3A%20${orderId}%0AAmount%3A%20%24${amountUSD}%20USD%0A%0APlease%20send%20me%20a%20payment%20link.%0A%0AThanks!`;

  return (
    <div className="rounded-lg border border-sericia-ink/10 bg-white p-6 space-y-4">
      <div className="text-center">
        <p className="text-lg font-serif text-sericia-ink mb-1">Complete your order</p>
        <p className="text-2xl font-semibold text-sericia-ink">${amountUSD} USD</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-900">
          Payment system temporarily unavailable ({error}). Please email us and we&apos;ll send a direct payment link.
        </div>
      )}

      <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-sericia-ink/80">
        <p className="font-semibold mb-1">🍵 Limited Phase 1 checkout</p>
        <p>We&apos;re running a concierge checkout while we finalize integrated card payments. Email us with your order ID below — we&apos;ll send a secure Stripe link within 2 hours (Japan business hours).</p>
      </div>

      <a
        href={mailto}
        className="block w-full text-center rounded-md bg-sericia-ink text-white py-3 px-4 font-medium hover:bg-sericia-ink/90 transition"
      >
        Email us to complete payment →
      </a>

      <div className="text-xs text-sericia-ink/60 space-y-1 pt-2 border-t border-sericia-ink/10">
        <p><span className="font-medium">Order ID:</span> <code className="bg-sericia-ink/5 px-1.5 py-0.5 rounded">{orderId}</code></p>
        {crossmintOrderId && (
          <p><span className="font-medium">Reference:</span> <code className="bg-sericia-ink/5 px-1.5 py-0.5 rounded">{crossmintOrderId}</code></p>
        )}
        <p className="pt-1">Questions? <a href="mailto:contact@sericia.com" className="underline">contact@sericia.com</a></p>
      </div>
    </div>
  );
}
