"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type SidebarLink = { href: string; label: string };
type ShopCard = { href: string; label: string; price?: string; note?: string };

type Props = {
  sectionTitle?: string;
  sections?: SidebarLink[];          // intra-page anchor nav (#id links)
  relatedTools?: SidebarLink[];      // links to /tools/*
  relatedGuides?: SidebarLink[];     // links to /guides/*
  shopCards?: ShopCard[];            // "shop the story"
  languageNote?: string;             // short note about localization
};

const DEFAULT_TOOLS: SidebarLink[] = [
  { href: "/tools/ems-calculator", label: "EMS shipping calculator" },
  { href: "/tools/matcha-grade", label: "Matcha grade decoder" },
  { href: "/tools/miso-finder", label: "Miso type finder" },
  { href: "/tools/shelf-life", label: "Shelf-life checker" },
];

const DEFAULT_GUIDES: SidebarLink[] = [
  { href: "/guides/us/sencha", label: "Buying sencha — US guide" },
  { href: "/guides/uk/miso", label: "Buying miso — UK guide" },
  { href: "/guides/de/matcha", label: "Buying matcha — Germany" },
  { href: "/guides/au/shiitake", label: "Buying shiitake — Australia" },
];

const DEFAULT_SHOP: ShopCard[] = [
  { href: "/products", label: "Current drop — Sencha, Miso, Shiitake", price: "$95", note: "EMS worldwide included" },
];

export default function ContentSidebar({
  sectionTitle = "On this page",
  sections,
  relatedTools = DEFAULT_TOOLS,
  relatedGuides = DEFAULT_GUIDES,
  shopCards = DEFAULT_SHOP,
  languageNote = "Available in 8 languages — switch in the header.",
}: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!sections || sections.length === 0) return;
    const ids = sections.map((s) => s.href.replace(/^#/, ""));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 }
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/.+@.+\..+/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "sidebar" }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`Subscribe failed (${res.status})`);
      toast.success("Thank you — you're on the list.");
      setEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[sidebar] subscribe failed", err);
      toast.error(msg || "Subscription failed. Try again shortly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="content-sidebar w-full lg:w-[280px] xl:w-[320px] lg:sticky lg:top-24 lg:self-start space-y-12 text-[13px]">
      {/* Mobile accordion container */}
      <details className="lg:hidden border border-sericia-line bg-sericia-paper-card" open={false}>
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between">
          <span className="label">Reading tools & related</span>
          <span className="text-[20px] text-sericia-ink-mute">+</span>
        </summary>
        <div className="px-5 pb-5 pt-2 space-y-8">
          <SidebarSections
            sectionTitle={sectionTitle}
            sections={sections}
            activeId={activeId}
            relatedTools={relatedTools}
            relatedGuides={relatedGuides}
            shopCards={shopCards}
            languageNote={languageNote}
            onSubmit={subscribe}
            email={email}
            setEmail={setEmail}
            submitting={submitting}
          />
        </div>
      </details>

      {/* Desktop sidebar */}
      <div className="hidden lg:block space-y-12">
        <SidebarSections
          sectionTitle={sectionTitle}
          sections={sections}
          activeId={activeId}
          relatedTools={relatedTools}
          relatedGuides={relatedGuides}
          shopCards={shopCards}
          languageNote={languageNote}
          onSubmit={subscribe}
          email={email}
          setEmail={setEmail}
          submitting={submitting}
        />
      </div>
    </aside>
  );
}

function SidebarSections({
  sectionTitle,
  sections,
  activeId,
  relatedTools,
  relatedGuides,
  shopCards,
  languageNote,
  onSubmit,
  email,
  setEmail,
  submitting,
}: {
  sectionTitle: string;
  sections?: SidebarLink[];
  activeId: string | null;
  relatedTools: SidebarLink[];
  relatedGuides: SidebarLink[];
  shopCards: ShopCard[];
  languageNote: string;
  onSubmit: (e: React.FormEvent) => void;
  email: string;
  setEmail: (v: string) => void;
  submitting: boolean;
}) {
  return (
    <>
      {sections && sections.length > 0 && (
        <nav aria-label="In-page navigation">
          <p className="label mb-4">{sectionTitle}</p>
          <ul className="space-y-2.5 border-l border-sericia-line pl-4">
            {sections.map((s) => {
              const id = s.href.replace(/^#/, "");
              const active = activeId === id;
              return (
                <li key={s.href}>
                  <a
                    href={s.href}
                    className={`block transition-colors ${
                      active
                        ? "text-sericia-ink font-medium"
                        : "text-sericia-ink-mute hover:text-sericia-ink"
                    }`}
                  >
                    {s.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <nav aria-label="Related tools">
        <p className="label mb-4">Tools</p>
        <ul className="space-y-2.5">
          {relatedTools.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="text-sericia-ink-soft hover:text-sericia-ink transition-colors"
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Related guides">
        <p className="label mb-4">Guides</p>
        <ul className="space-y-2.5">
          {relatedGuides.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="text-sericia-ink-soft hover:text-sericia-ink transition-colors"
              >
                {g.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section>
        <p className="label mb-4">Shop the story</p>
        <div className="space-y-3">
          {shopCards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="block border border-sericia-line bg-sericia-paper p-4 hover:bg-sericia-paper-card transition-colors"
            >
              <p className="text-[13px] text-sericia-ink leading-snug">{c.label}</p>
              {c.price && (
                <p className="mt-2 text-[12px] tracking-wider uppercase text-sericia-ink-mute">
                  {c.price}
                  {c.note ? ` · ${c.note}` : ""}
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <p className="label mb-4">Drop alerts</p>
        <p className="text-sericia-ink-soft leading-relaxed mb-4">
          One email per drop. No marketing. Unsubscribe anytime.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            aria-label="Email address"
            className="w-full border border-sericia-line bg-sericia-paper px-3 py-2.5 text-[13px] focus:border-sericia-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-sericia-ink text-sericia-paper py-2.5 text-[12px] tracking-[0.18em] uppercase hover:bg-sericia-accent transition-colors disabled:opacity-40"
          >
            {submitting ? "Subscribing..." : "Notify me"}
          </button>
        </form>
      </section>

      <section className="pt-6 border-t border-sericia-line">
        <p className="text-[12px] text-sericia-ink-mute leading-relaxed">{languageNote}</p>
      </section>
    </>
  );
}
