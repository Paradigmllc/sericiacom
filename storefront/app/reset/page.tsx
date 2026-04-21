import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow } from "@/components/ui";
import ResetForm from "./ResetForm";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ResetPage() {
  return (
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="narrow" className="py-20 md:py-28">
          <Eyebrow>Reset password</Eyebrow>
          <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed">
            Enter your email and we will send a reset link.
          </p>
        </Container>
      </section>
      <Container size="narrow" className="py-16 md:py-24">
        <ResetForm />
      </Container>
      <SiteFooter />
    </>
  );
}
