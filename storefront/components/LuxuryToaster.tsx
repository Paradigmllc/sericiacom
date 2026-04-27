"use client";

/**
 * LuxuryToaster — Sonner wrapper styled for the Sericia paper/ink palette.
 *
 * Why this exists:
 *   Sonner's default `richColors` ships bright green/red drugstore-toast
 *   theming that clashes with an Aesop/Le Labo-tier storefront. This wrapper
 *   pins the toast surface to the brand palette (paper-card bg, ink type,
 *   hairline line border, no shadow stack) and uses semantic accents that
 *   sit inside the brand — `sericia-accent` (warm olive) for success,
 *   `sericia-heart` (subdued crimson) for error.
 *
 * Position:
 *   `bottom-center` — closer to the action surface (the user's last click is
 *   usually mid-page or below the fold), and feels less intrusive than the
 *   top-right "tab notification" pattern. Matches how Aesop and SSENSE place
 *   their cart confirmations.
 *
 * Motion:
 *   500ms cubic-bezier slide-up on enter, 400ms fade on exit. Slow enough to
 *   read like a printed slip, fast enough to not feel sluggish. Disabled
 *   under `prefers-reduced-motion` (Sonner respects the media query natively).
 */

import { Toaster as SonnerToaster } from "sonner";

export default function LuxuryToaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      duration={4500}
      gap={10}
      visibleToasts={3}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "!bg-sericia-paper-card !text-sericia-ink !border !border-sericia-line !rounded-none !shadow-[0_1px_0_rgba(33,35,29,0.04)] !font-light !tracking-[0.005em] !text-[14px] !leading-[1.55] !px-5 !py-4 backdrop-blur-[2px]",
          title: "!font-normal !text-[14px] !text-sericia-ink",
          description: "!text-[12.5px] !text-sericia-ink-soft !mt-1 !tracking-[0.01em]",
          actionButton:
            "!bg-sericia-ink !text-sericia-paper !rounded-none !text-[11px] !uppercase !tracking-[0.16em] !px-4 !py-2 !font-normal hover:!bg-sericia-accent transition-colors",
          cancelButton:
            "!bg-transparent !text-sericia-ink-soft !border !border-sericia-line !rounded-none !text-[11px] !uppercase !tracking-[0.16em] !px-4 !py-2 !font-normal hover:!text-sericia-ink",
          closeButton:
            "!bg-sericia-paper !text-sericia-ink-soft !border !border-sericia-line !rounded-none hover:!text-sericia-ink",
          success: "!border-l-2 !border-l-sericia-accent",
          error: "!border-l-2 !border-l-[var(--sericia-heart)]",
          warning: "!border-l-2 !border-l-sericia-ink-soft",
          info: "!border-l-2 !border-l-sericia-ink-mute",
        },
      }}
    />
  );
}
