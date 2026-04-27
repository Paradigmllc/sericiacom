import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContentSidebar from "@/components/ContentSidebar";
import CategoryHero, { Breadcrumb } from "@/components/CategoryHero";
import { Container, Rule } from "@/components/ui";
import { webPageJsonLd } from "@/lib/page-jsonld";

/**
 * /accessibility — Accessibility Statement.
 *
 * Aesop, Apple, and most luxury brands publish accessibility statements
 * because WCAG compliance is a legal requirement in the EU (EAA 2025) and
 * a growing expectation in the US (ADA interpretation). This page documents
 * what Sericia does, what we know we fall short on, and how to reach us
 * if you encounter a barrier.
 */

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Sericia's commitment to accessible browsing and shopping — what we do today, where we fall short, and how to reach us if a barrier keeps you from ordering.",
  alternates: { canonical: "https://sericia.com/accessibility" },
};

export default function AccessibilityPage() {
  const jsonLd = webPageJsonLd({
    name: "Accessibility statement",
    description: "Sericia's commitment to WCAG 2.2 AA — what we do today, what we fall short on, and how to reach us if a barrier keeps you from ordering.",
    path: "/accessibility",
    breadcrumb: [{ label: "Home", path: "/" }, { label: "Accessibility", path: "/accessibility" }],
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <CategoryHero eyebrow="Accessibility" title="A storefront anyone can enter." tone="paper" />
      <Container size="wide" className="pt-10 md:pt-14 pb-20 md:pb-28">
        <div className="mb-8">
          <Breadcrumb items={[{ label: "Home", url: "/" }, { label: "Accessibility" }]} />
        </div>
        <p className="mb-12 text-[16px] text-sericia-ink-soft max-w-prose leading-relaxed">
          We build Sericia so that readers, shoppers, and waitlist subscribers can use the site without barriers — whatever device, whatever input method.
        </p>
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 min-w-0 max-w-[680px] prose-aesop">
            <h2>One — What we target</h2>
            <p>
              Sericia is built against the{" "}
              <a
                href="https://www.w3.org/WAI/WCAG22/quickref/"
                className="underline-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Web Content Accessibility Guidelines 2.2 at Level AA
              </a>
              . This is the standard used by the European Accessibility Act
              (EAA, enforced from 2025) and referenced in most US public-sector
              procurement. We are a small company, so we publish this
              statement openly rather than claim blanket compliance: we aim
              for AA, we fall short in places, and we are transparent about
              where.
            </p>

            <h2>Two — What we do today</h2>
            <ul>
              <li>
                <strong>Keyboard navigation</strong> — every interactive
                element is reachable and operable with Tab, Shift+Tab, and
                Enter. Focus rings are visible and intentional.
              </li>
              <li>
                <strong>Colour contrast</strong> — body text and interactive
                labels meet or exceed the 4.5:1 minimum against our paper
                backgrounds.
              </li>
              <li>
                <strong>Semantic HTML</strong> — headings, landmarks, lists,
                and form controls use the native elements screen readers
                expect.
              </li>
              <li>
                <strong>Alt text</strong> — every product image and editorial
                photograph carries descriptive alternative text.
              </li>
              <li>
                <strong>Reduced motion</strong> — page-transition animations
                and the load spinner respect{" "}
                <code>prefers-reduced-motion: reduce</code>.
              </li>
              <li>
                <strong>Language tags</strong> — Japanese, Korean, Chinese,
                and European language pages are correctly marked up for
                assistive technology.
              </li>
              <li>
                <strong>No auto-playing audio or video</strong> — sound and
                motion only start on explicit user action.
              </li>
            </ul>

            <h2>Three — Where we fall short</h2>
            <p>
              We publish these honestly because they affect real people and
              we would rather be contacted than invisible:
            </p>
            <ul>
              <li>
                Some Japanese producer names use furigana glyphs that older
                screen readers mispronounce. We are transcribing them as we
                refresh each producer profile.
              </li>
              <li>
                The cart drawer animation briefly steals focus on some
                iOS VoiceOver configurations. Fix planned for May 2026.
              </li>
              <li>
                PDF shipping receipts are not yet screen-reader friendly.
                Plain-text HTML receipt available on request until we ship
                tagged PDFs.
              </li>
            </ul>

            <h2>Four — How to reach us</h2>
            <p>
              If you hit a barrier on sericia.com — a page you cannot operate,
              a product you cannot order, an image you cannot interpret —
              please write to{" "}
              <a
                href="mailto:accessibility@sericia.com"
                className="underline-link"
              >
                accessibility@sericia.com
              </a>
              . One of us will reply personally within two business days.
              Please include:
            </p>
            <ul>
              <li>The page URL where the barrier occurred</li>
              <li>Your operating system, browser, and any assistive tech</li>
              <li>What you were trying to do when the barrier appeared</li>
            </ul>
            <p>
              If your request is urgent — you are mid-order and stuck — write
              to{" "}
              <a href="mailto:contact@sericia.com" className="underline-link">
                contact@sericia.com
              </a>{" "}
              instead and we will help you complete the purchase by whatever
              means works.
            </p>

            <h2>Five — Ongoing work</h2>
            <p>
              Every new page we ship is audited against axe-core and
              hand-tested with NVDA and VoiceOver before it goes live. This
              statement is reviewed each quarter; the current version is
              dated April 2026.
            </p>

            <Rule className="my-14" />

            <p className="label mb-4">Also on Sericia</p>
            <ul className="not-prose grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px]">
              <li>
                <Link
                  href="/faq"
                  className="text-sericia-ink-soft hover:text-sericia-ink"
                >
                  Frequently asked questions
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap"
                  className="text-sericia-ink-soft hover:text-sericia-ink"
                >
                  Sitemap
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sericia-ink-soft hover:text-sericia-ink"
                >
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sericia-ink-soft hover:text-sericia-ink"
                >
                  Terms of service
                </Link>
              </li>
            </ul>
          </div>
          <ContentSidebar />
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
