import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow } from "@/components/ui";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-16 md:py-20">
          <Eyebrow>Your cart</Eyebrow>
          <h1 className="text-[36px] md:text-[48px] leading-[1.1] font-normal tracking-tight">
            Review your selection.
          </h1>
        </Container>
      </section>
      <Container size="wide" className="py-16 md:py-24">
        <CartClient />
      </Container>
      <SiteFooter />
    </>
  );
}
