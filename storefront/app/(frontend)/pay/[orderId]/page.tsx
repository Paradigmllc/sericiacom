import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import HyperswitchPayment from "@/components/HyperswitchPayment";
import CrossmintPayment from "@/components/CrossmintPayment";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow, Button, Rule } from "@/components/ui";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPaymentSettings } from "@/lib/payment-settings";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Replace {key} placeholders in a Payload-supplied template. */
function fillTemplate(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export default async function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  // F55 — both Payload settings and order fetch in parallel for cold-render speed
  const locale = await getLocale();
  const [{ data: order }, settings] = await Promise.all([
    supabaseAdmin
      .from("sericia_orders")
      .select("id, amount_usd, status, email, drop_id")
      .eq("id", orderId)
      .maybeSingle(),
    getPaymentSettings(locale),
  ]);

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

  // F55 — all visible copy below comes from Payload PaymentSettings global,
  // with hardcoded defaults applied inside getPaymentSettings() if the
  // global is unsaved or unreachable. Editor edits at /cms/admin/globals/paymentSettings.
  const payButtonLabel = fillTemplate(settings.receiptCopy.payButtonLabel, {
    amount: order.amount_usd,
  });
  const receiptLine = fillTemplate(settings.receiptCopy.receiptLine, {
    email: order.email,
  });
  const confirmationLine = fillTemplate(settings.receiptCopy.confirmationLine, {
    email: order.email,
  });

  return (
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-16 md:py-20">
          <Eyebrow>{settings.checkoutCopy.eyebrow}</Eyebrow>
          <h1 className="text-[36px] md:text-[48px] leading-[1.1] font-normal tracking-tight">
            {settings.checkoutCopy.heading}
          </h1>
          <p className="text-[15px] text-sericia-ink-soft mt-4 max-w-prose">
            {settings.checkoutCopy.subhead}
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

          <HyperswitchPayment
            orderId={order.id}
            amountUSD={order.amount_usd}
            receiptEmail={order.email}
            payButtonLabel={payButtonLabel}
            receiptLine={receiptLine}
          />

          {settings.alternativeProviders.crossmintEnabled && (
            <details className="mt-12 border-t border-sericia-line pt-8">
              <summary className="cursor-pointer text-[12px] tracking-[0.14em] uppercase text-sericia-ink-soft hover:text-sericia-ink transition-colors">
                {settings.alternativeProviders.crossmintLabel}
              </summary>
              <div className="mt-6">
                <CrossmintPayment
                  orderId={order.id}
                  amountUSD={order.amount_usd}
                  receiptEmail={order.email}
                />
              </div>
            </details>
          )}
        </div>

        <p className="text-[12px] text-sericia-ink-mute text-center mt-8 tracking-wider uppercase">
          {confirmationLine}
        </p>
      </Container>
      <SiteFooter />
    </>
  );
}
