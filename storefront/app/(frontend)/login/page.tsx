import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow } from "@/components/ui";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Sericia account.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="narrow" className="py-20 md:py-28">
          <Eyebrow>{t("eyebrow_sign_in")}</Eyebrow>
          <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">
            {t("welcome_back")}
          </h1>
          <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed">
            {t("welcome_back_lede")}
          </p>
        </Container>
      </section>
      <Container size="narrow" className="py-16 md:py-24">
        <Suspense fallback={<div className="text-sericia-ink-soft">{t("loading")}</div>}>
          <LoginForm />
        </Suspense>
      </Container>
      <SiteFooter />
    </>
  );
}
