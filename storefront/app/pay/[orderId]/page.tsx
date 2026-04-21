import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import CrossmintPayment from "@/components/CrossmintPayment";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const { data: order } = await supabaseAdmin
    .from("sericia_orders")
    .select("id, amount_usd, status, email, drop_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) notFound();
  if (order.status !== "pending") {
    return (
      <main className="min-h-screen bg-sericia-paper text-sericia-ink flex items-center justify-center p-6">
        <div className="max-w-md bg-white rounded-2xl border border-sericia-ink/10 p-10 text-center">
          <h1 className="text-2xl font-serif mb-4">This order is already {order.status}.</h1>
          <p className="text-sericia-ink/70 mb-6">If you believe this is an error, contact us.</p>
          <Link href="/" className="underline">← Back to Sericia</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sericia-paper text-sericia-ink">
      <header className="border-b border-sericia-ink/10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif">Sericia</Link>
          <span className="text-sm text-sericia-ink/60">Step 2 of 2 · Payment</span>
        </div>
      </header>
      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif mb-6">Complete your payment</h1>
        <div className="bg-white border border-sericia-ink/10 rounded-2xl p-6">
          <CrossmintPayment orderId={order.id} amountUSD={order.amount_usd} />
        </div>
        <p className="text-xs text-sericia-ink/50 text-center mt-6">
          Confirmation email will be sent to {order.email}
        </p>
      </div>
    </main>
  );
}
