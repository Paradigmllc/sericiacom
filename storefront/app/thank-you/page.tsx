import type { Metadata } from "next";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import PushOptIn from "../../components/PushOptIn";
import { Container, Eyebrow, Button, Rule } from "../../components/ui";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-20 md:py-28 text-center">
          <Eyebrow>Order confirmed</Eyebrow>
          <h1 className="text-[40px] md:text-[56px] leading-[1.08] font-normal tracking-tight max-w-3xl mx-auto">
            Thank you for rescuing Japan&apos;s craft food.
          </h1>
          <p className="text-[17px] text-sericia-ink-soft mt-8 max-w-prose mx-auto leading-relaxed">
            A confirmation has been sent to your email. Your drop ships from Kyoto within forty-eight hours
            with EMS worldwide tracking.
          </p>
          {order && (
            <p className="text-[12px] text-sericia-ink-mute mt-6 tracking-wider uppercase">
              Order reference — {order}
            </p>
          )}
        </Container>
      </section>

      <Container size="narrow" className="py-20 md:py-28">
        <div className="grid md:grid-cols-3 gap-10 md:gap-16 text-center">
          <div>
            <p className="label mb-3">One</p>
            <h3 className="text-[18px] font-normal mb-3">Confirmation</h3>
            <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
              Check your inbox for the order summary and receipt.
            </p>
          </div>
          <div>
            <p className="label mb-3">Two</p>
            <h3 className="text-[18px] font-normal mb-3">Tracking</h3>
            <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
              EMS tracking is emailed within forty-eight hours of dispatch.
            </p>
          </div>
          <div>
            <p className="label mb-3">Three</p>
            <h3 className="text-[18px] font-normal mb-3">Next drop</h3>
            <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
              Early access to the next curation arrives in your inbox in about two weeks.
            </p>
          </div>
        </div>
        <Rule className="mt-20 mb-12" />

        {/*
          Push opt-in offered at the highest-intent moment we have: directly
          after checkout. Renders nothing if the browser doesn't support push,
          the user has already granted/denied, or has dismissed this card in
          the last 60 days. See components/PushOptIn.tsx for the state machine.
        */}
        <div className="mx-auto max-w-lg mb-16">
          <PushOptIn variant="thank-you" topics={["drops", "orders"]} />
        </div>

        <div className="text-center">
          <Button href="/guides" variant="link">Browse country shipping guides</Button>
          <div className="mt-10">
            <Button href="/" variant="outline">Return to Sericia</Button>
          </div>
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
