"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STATUSES = ["pending", "paid", "shipped", "delivered", "refunded", "cancelled"] as const;
const CARRIERS = ["Japan Post EMS", "DHL", "FedEx"] as const;

export default function OrderActions({
  orderId,
  status,
  trackingNumber,
  trackingCarrier,
}: {
  orderId: string;
  status: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
}) {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState<string>(status);
  const [tn, setTn] = useState(trackingNumber ?? "");
  const [tc, setTc] = useState(trackingCarrier ?? CARRIERS[0]);
  const [saving, setSaving] = useState(false);
  const [refunding, setRefunding] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          tracking_number: tn || null,
          tracking_carrier: tc || null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Update failed (${res.status})`);
      }
      toast.success("Order updated");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[admin/orders/update] failed", err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function refund() {
    if (!confirmAction("Mark this order as refunded?")) return;
    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "refunded" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Refund failed (${res.status})`);
      }
      toast.success("Order refunded");
      setNewStatus("refunded");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[admin/orders/refund] failed", err);
      toast.error(msg);
    } finally {
      setRefunding(false);
    }
  }

  return (
    <div className="border border-sericia-line bg-sericia-paper-card p-6 space-y-6 sticky top-6">
      <div>
        <div className="label mb-2">Status</div>
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="w-full border border-sericia-line bg-sericia-paper py-2 px-3 text-[13px] focus:outline-none focus:border-sericia-ink"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="label mb-2">Tracking number</div>
        <input
          type="text"
          value={tn}
          onChange={(e) => setTn(e.target.value)}
          placeholder="EE123456789JP"
          className="w-full border border-sericia-line bg-sericia-paper py-2 px-3 text-[13px] focus:outline-none focus:border-sericia-ink"
        />
      </div>
      <div>
        <div className="label mb-2">Carrier</div>
        <select
          value={tc}
          onChange={(e) => setTc(e.target.value)}
          className="w-full border border-sericia-line bg-sericia-paper py-2 px-3 text-[13px] focus:outline-none focus:border-sericia-ink"
        >
          {CARRIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full bg-sericia-ink text-sericia-paper py-3 text-[13px] tracking-wider hover:bg-sericia-accent transition disabled:opacity-40"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={refund}
        disabled={refunding || status === "refunded"}
        className="w-full border border-red-700 text-red-700 py-3 text-[13px] tracking-wider hover:bg-red-700 hover:text-sericia-paper transition disabled:opacity-40"
      >
        {refunding ? "Processing…" : "Refund"}
      </button>
      <p className="text-[11px] text-sericia-ink-mute leading-relaxed">
        Setting status to &quot;shipped&quot; automatically sends the shipping notification email
        with the tracking number entered above.
      </p>
    </div>
  );
}

function confirmAction(message: string): boolean {
  // eslint-disable-next-line no-alert
  return typeof window !== "undefined" ? window.confirm(message) : false;
}
