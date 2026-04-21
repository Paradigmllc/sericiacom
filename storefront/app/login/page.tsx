import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow } from "@/components/ui";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Sericia account.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="narrow" className="py-20 md:py-28">
          <Eyebrow>Sign in</Eyebrow>
          <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">
            Welcome back.
          </h1>
          <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed">
            Sign in to check orders, update addresses, and see new drops first.
          </p>
        </Container>
      </section>
      <Container size="narrow" className="py-16 md:py-24">
        <LoginForm />
      </Container>
      <SiteFooter />
    </>
  );
}
