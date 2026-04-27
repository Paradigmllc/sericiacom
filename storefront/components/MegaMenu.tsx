"use client";

/**
 * MegaMenu — Aesop-style hover panel for the primary navbar.
 *
 * Behaviour (matched to aesop.com):
 *   • Opens on hover OR keyboard focus on the trigger.
 *   • 120ms open-delay debounce so the panel doesn't flash when the cursor
 *     skims past on its way to another item.
 *   • 250ms close-delay so users can move the cursor diagonally from the
 *     trigger to the panel without losing the panel.
 *   • Esc closes; clicking any link inside closes; mouseleave from BOTH
 *     trigger and panel closes (after the 250ms grace).
 *   • One panel open at a time — opening a new trigger replaces the
 *     previous panel cleanly (managed by parent via `activeKey` prop).
 *
 * Layout:
 *   • 1-3 link columns on the left (Aesop typically uses 2)
 *   • 0-2 image cards on the right (Aesop uses 2 — "Discover X" / "Try the
 *     X Finder")
 *   • Image cards degrade to gradient when imageUrl is empty (Sericia
 *     "no sloppy images" rule — gradient + grain instead of placeholder photo).
 *
 * Accessibility:
 *   • role="menu" + role="menuitem" pattern for the panel
 *   • aria-expanded on trigger
 *   • aria-controls links trigger to panel id
 *   • Tab order is natural (no focus trap — users can tab out cleanly)
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type MegaLink = { label: string; url: string };
type MegaColumn = { title?: string | null; links?: MegaLink[] | null };
type MegaCard = {
  title: string;
  caption?: string | null;
  url: string;
  imageUrl?: string | null;
  tone?:
    | "paper"
    | "tea"
    | "miso"
    | "mushroom"
    | "seasoning"
    | "drop"
    | "ink"
    | null;
};

export type MegaMenuData = {
  columns?: MegaColumn[] | null;
  featuredCards?: MegaCard[] | null;
};

const TONE_GRADIENTS: Record<NonNullable<MegaCard["tone"]>, string> = {
  paper: "from-[#e8e0cf] to-[#b8a987]",
  tea: "from-[#c8d4b0] to-[#6a7d4c]",
  miso: "from-[#d4c9b0] to-[#7a5c3c]",
  mushroom: "from-[#c8b8a8] to-[#5a4a3c]",
  seasoning: "from-[#e0d4a8] to-[#8a7a2c]",
  drop: "from-[#d4c9b0] to-[#8a7d5c]",
  ink: "from-[#5c5d45] to-[#21231d]",
};

export function MegaTrigger({
  label,
  url,
  highlighted,
  hasMega,
  active,
  onActivate,
  onDeactivate,
  panelId,
}: {
  label: string;
  url: string;
  highlighted?: boolean;
  hasMega: boolean;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  panelId: string;
}) {
  const linkClass = highlighted
    ? "text-sericia-ink font-medium hover:opacity-80 transition"
    : "hover:text-sericia-ink transition";
  return (
    <Link
      href={url}
      data-cursor="link"
      // Hovering / focusing the trigger opens its mega; leaving starts the
      // 250ms grace period managed by the parent.
      onMouseEnter={hasMega ? onActivate : undefined}
      onMouseLeave={hasMega ? onDeactivate : undefined}
      onFocus={hasMega ? onActivate : undefined}
      onBlur={hasMega ? onDeactivate : undefined}
      aria-expanded={hasMega ? active : undefined}
      aria-haspopup={hasMega ? "true" : undefined}
      aria-controls={hasMega ? panelId : undefined}
      className={`${linkClass} ${active ? "text-sericia-ink" : ""}`}
    >
      {label}
    </Link>
  );
}

export function MegaPanel({
  data,
  panelId,
  open,
  onMouseEnter,
  onMouseLeave,
  onLinkClick,
}: {
  data: MegaMenuData;
  panelId: string;
  open: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onLinkClick: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const columns = (data.columns ?? []).filter(
    (c): c is MegaColumn & { links: MegaLink[] } =>
      Array.isArray(c.links) && c.links.length > 0,
  );
  const cards = data.featuredCards ?? [];

  if (columns.length === 0 && cards.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id={panelId}
          role="menu"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          // Sit just below the header band. The header itself is sticky
          // with backdrop-blur; the panel uses solid paper to feel "stacked".
          className="absolute left-0 right-0 top-full bg-sericia-paper border-t border-sericia-line shadow-[0_24px_60px_-30px_rgba(33,35,29,0.25)] z-40"
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12 md:py-14">
            {/* Flex layout with explicit column min-widths so labels don't
                word-wrap into "Drop / No. / 01" when the panel narrows.
                Link columns: 200px min, content-driven. Featured cards:
                280px fixed so the image actually reads as an image rather
                than a sliver. Gap-16 keeps the editorial whitespace. */}
            <div className="flex flex-wrap gap-12 md:gap-16">
              {columns.map((col, ci) => (
                <div key={`col-${ci}`} className="min-w-[200px]">
                  {col.title && (
                    <p className="label mb-5 text-sericia-ink-mute whitespace-nowrap">
                      {col.title}
                    </p>
                  )}
                  <ul className="space-y-3">
                    {col.links.map((link, li) => (
                      <li key={`link-${ci}-${li}`}>
                        <Link
                          href={link.url}
                          role="menuitem"
                          onClick={onLinkClick}
                          className="text-[15px] text-sericia-ink hover:text-sericia-accent transition-colors inline-block whitespace-nowrap"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {cards.length > 0 && (
                // Push cards to the right edge so editorial categories live
                // on the left and featured imagery on the right (Aesop layout).
                <div className="ml-auto flex flex-wrap gap-8 md:gap-10">
                  {cards.map((card, idx) => {
                    const tone = (card.tone ?? "paper") as NonNullable<MegaCard["tone"]>;
                    const gradient = TONE_GRADIENTS[tone];
                    return (
                      <Link
                        key={`card-${idx}`}
                        href={card.url}
                        role="menuitem"
                        onClick={onLinkClick}
                        // Fixed width keeps the card recognisable as a card —
                        // images need real estate or they read as decoration.
                        className="group block w-[260px]"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden mb-4">
                          {card.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={card.imageUrl}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                              loading="lazy"
                            />
                          ) : (
                            // No-sloppy-images rule: gradient + grain fallback,
                            // never a placeholder photo.
                            <>
                              <div
                                className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]`}
                              />
                              <div
                                aria-hidden
                                className="absolute inset-0 opacity-[0.13] mix-blend-overlay"
                                style={{
                                  backgroundImage:
                                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
                                }}
                              />
                            </>
                          )}
                        </div>
                        <p className="text-[15px] text-sericia-ink leading-snug group-hover:text-sericia-accent transition-colors">
                          {card.title}
                        </p>
                        {card.caption && (
                          <p className="text-[12px] text-sericia-ink-mute mt-1 leading-relaxed">
                            {card.caption}
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * MegaMenuController — the parent state machine.
 * One instance manages "which trigger is open" + the open/close debounce
 * timers. Use it inside the nav row; it renders all triggers + their
 * matching panel. Items without a `mega` group render as plain link
 * triggers (no panel, no debounce).
 */
export type MegaMenuItem = {
  label: string;
  url: string;
  highlighted?: boolean;
  mega?: MegaMenuData & { enabled?: boolean | null } | null;
};

export default function MegaMenuController({ items }: { items: MegaMenuItem[] }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleOpen(key: string) {
    clearTimers();
    openTimer.current = setTimeout(() => {
      setActiveKey(key);
    }, 120);
  }

  function scheduleClose() {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    closeTimer.current = setTimeout(() => {
      setActiveKey(null);
    }, 250);
  }

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function closeNow() {
    clearTimers();
    setActiveKey(null);
  }

  // Esc to close
  useEffect(() => {
    if (!activeKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNow();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeKey]);

  useEffect(() => () => clearTimers(), []);

  return (
    <div
      className="relative flex items-center gap-9"
      // mouseleave on the whole nav region -> begin close cycle. Cards on
      // the panel cancel this when re-entered (see panel onMouseEnter).
      onMouseLeave={scheduleClose}
    >
      {items.map((item, i) => {
        const key = `nav-${i}`;
        const hasMega =
          !!item.mega?.enabled &&
          (((item.mega.columns ?? []).length > 0) ||
            ((item.mega.featuredCards ?? []).length > 0));

        return (
          <MegaTrigger
            key={key}
            label={item.label}
            url={item.url}
            highlighted={!!item.highlighted}
            hasMega={hasMega}
            active={activeKey === key}
            onActivate={() => scheduleOpen(key)}
            onDeactivate={scheduleClose}
            panelId={`${key}-panel`}
          />
        );
      })}

      {/* Render the active panel relative to the nav row */}
      {items.map((item, i) => {
        const key = `nav-${i}`;
        const hasMega =
          !!item.mega?.enabled &&
          (((item.mega.columns ?? []).length > 0) ||
            ((item.mega.featuredCards ?? []).length > 0));
        if (!hasMega || !item.mega) return null;
        const open = activeKey === key;

        return (
          <MegaPanel
            key={`${key}-panel`}
            data={item.mega}
            panelId={`${key}-panel`}
            open={open}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onLinkClick={closeNow}
          />
        );
      })}
    </div>
  );
}
