import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CrossmintPayment from "@/components/CrossmintPayment";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow, Button, Rule } from "@/components/ui";
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
      <>
        <SiteHeader />
        <Container size="narrow" className="py-32 text-center">
          <Eyebrow>Order status</Eyebrow>
          <h1 className="text-[32px] md:text-[40px] leading-[1.15] font-normal tracking-tight mb-6">
            This order is already {order.status}.
          </h1>
          <p className="text-[15px] text-sericia-ink-soft max-w-prose mx-auto mb-10">
            If you believe this is an error, please write to us at{" "}
            <a href="mailto:contact@sericia.com" className="underline-link">contact@sericia.com</a>.
          </p>
          <Button href="/" variant="outline">Return to Sericia</Button>
        </Container>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-16 md:py-20">
          <Eyebrow>Step 2 of 2 — Payment</Eyebrow>
          <h1 className="text-[36px] md:text-[48px] leading-[1.1] font-normal tracking-tight">
            Complete your payment.
          </h1>
          <p className="text-[15px] text-sericia-ink-soft mt-4 max-w-prose">
            Your order is reserved for fifteen minutes. Payment is processed securely in USD.
          </p>
        </Container>
      </section>

      <Container size="narrow" className="py-16 md:py-24">
        <div className="border border-sericia-line bg-sericia-paper-card p-10">
          <div className="flex items-baseline justify-between mb-8">
            <p className="label">Amount due</p>
            <p className="text-[28px] font-normal leading-none">${order.amount_usd}.00 USD</p>
          </div>
          <Rule className="mb-8" />
          <CrossmintPayment
            orderId={order.id}
            amountUSD={order.amount_usd}
            receiptEmail={order.email}
          />
        </div>
        <p className="text-[12px] text-sericia-ink-mute text-center mt-8 tracking-wider uppercase">
          Confirmation will be sent to {order.email}
        </p>
      </Container>
      <SiteFooter />
    </>
  );
}
