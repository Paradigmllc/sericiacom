import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow } from "@/components/ui";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Sericia account to track orders and save addresses.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="narrow" className="py-20 md:py-28">
          <Eyebrow>Create account</Eyebrow>
          <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">
            Join Sericia.
          </h1>
          <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed">
            An account lets you track orders, save shipping addresses, and receive early access to new drops.
          </p>
        </Container>
      </section>
      <Container size="narrow" className="py-16 md:py-24">
        <SignupForm />
      </Container>
      <SiteFooter />
    </>
  );
}
