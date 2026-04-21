import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow } from "@/components/ui";
import MagicForm from "./MagicForm";

export const metadata: Metadata = {
  title: "Magic link sign-in",
  robots: { index: false, follow: false },
};

export default function MagicPage() {
  return (
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="narrow" className="py-20 md:py-28">
          <Eyebrow>Magic link</Eyebrow>
          <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">
            Sign in without a password.
          </h1>
          <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed">
            We will email you a single-use sign-in link.
          </p>
        </Container>
      </section>
      <Container size="narrow" className="py-16 md:py-24">
        <MagicForm />
      </Container>
      <SiteFooter />
    </>
  );
}
