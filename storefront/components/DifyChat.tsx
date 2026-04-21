"use client";
import { useEffect, useState } from "react";

const DIFY_TOKEN = process.env.NEXT_PUBLIC_DIFY_TOKEN || "WnX69EkeJYork2rTBtbB3wnY";

/**
 * Dify chatbot with a resilient two-tier rendering strategy:
 *
 * 1. First, try the official embed.min.js SDK (matches Dify's preferred UX,
 *    supports microphone, theming, etc). Detect success by checking for
 *    `#dify-chatbot-bubble-button` within 3 s.
 * 2. If the script fails to load or doesn't render a bubble in time, we
 *    render our own floating button + iframe panel. This guarantees the
 *    chatbot is reachable even if `udify.app/embed.min.js` is blocked,
 *    throws on initialisation, or the CDN has issues.
 */
export default function DifyChat() {
  const [fallbackMode, setFallbackMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById(DIFY_TOKEN)) return;

    (window as unknown as { difyChatbotConfig: { token: string } }).difyChatbotConfig = {
      token: DIFY_TOKEN,
    };

    let scriptFailed = false;

    const script = document.createElement("script");
    script.src = "https://udify.app/embed.min.js";
    script.id = DIFY_TOKEN;
    script.defer = true;
    script.onerror = (e) => {
      scriptFailed = true;
      console.error("[dify] embed script failed to load", e);
      setFallbackMode(true);
    };
    document.body.appendChild(script);

    const style = document.createElement("style");
    style.textContent = `
      #dify-chatbot-bubble-button { background-color: #5c5d45 !important; }
      #dify-chatbot-bubble-window { width: 24rem !important; height: 40rem !important; }
    `;
    document.head.appendChild(style);

    // If the SDK hasn't rendered a bubble within 3 seconds, fall back.
    const watchdog = window.setTimeout(() => {
      if (scriptFailed) return;
      const bubble = document.getElementById("dify-chatbot-bubble-button");
      if (!bubble) {
        console.warn("[dify] bubble not detected after 3s, using iframe fallback");
        setFallbackMode(true);
      }
    }, 3000);

    return () => {
      window.clearTimeout(watchdog);
    };
  }, []);

  if (!fallbackMode) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        aria-label={panelOpen ? "Close chat" : "Open chat"}
        className="fixed bottom-6 right-6 z-[90] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: "#5c5d45", color: "#f5f1e8" }}
      >
        {panelOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>

      {panelOpen && (
        <div
          className="fixed bottom-24 right-6 z-[89] flex flex-col overflow-hidden rounded-lg border border-sericia-line bg-sericia-paper shadow-2xl"
          style={{ width: "min(24rem, calc(100vw - 3rem))", height: "min(40rem, calc(100vh - 8rem))" }}
        >
          <iframe
            src={`https://udify.app/chatbot/${DIFY_TOKEN}`}
            className="h-full w-full border-0"
            allow="microphone"
            title="Sericia Assistant"
          />
        </div>
      )}
    </>
  );
}
