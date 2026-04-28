import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, PageHero } from "@/components/ui";
import RefundRequestForm from "./RefundRequestForm";

export const metadata: Metadata = {
  title: "Request a refund",
  description:
    "If a Sericia parcel arrived damaged, spoiled, wrong, or never showed up, write to us and we will review within 48 hours.",
  robots: { index: true, follow: true },
};

export default async function RefundRequestPage() {
  const t = await getTranslations("refund_request");
  return (
    <>
      <SiteHeader />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")} />
      <Container size="narrow" className="py-16 md:py-24">
        <RefundRequestForm />
      </Container>
      <SiteFooter />
    </>
  );
}
