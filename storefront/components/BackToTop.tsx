"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Lenis from "lenis";
import { ArrowUpIcon } from "./Icons";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toTop() {
    const w = window as unknown as { __lenis?: Lenis };
    if (w.__lenis) {
      w.__lenis.scrollTo(0, { duration: 1.4 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          type="button"
          onClick={toTop}
          aria-label="Back to top"
          // Lift above the chat button (which itself lifts above the cookie banner).
          // Math: chat button bottom = 20 + cookieH; chat is 48px + gap → BackToTop sits at ~6rem above the chat.
          style={{
            bottom:
              "calc(6rem + env(safe-area-inset-bottom,0) + var(--cookie-consent-h, 0px))",
          }}
          className="fixed right-6 z-[88] flex h-11 w-11 items-center justify-center border border-sericia-line bg-sericia-paper/90 text-sericia-ink backdrop-blur-sm hover:bg-sericia-ink hover:text-sericia-paper transition-[bottom,colors] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        >
          <ArrowUpIcon className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
