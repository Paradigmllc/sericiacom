"use client";
import { useEffect } from "react";

const DIFY_TOKEN = process.env.NEXT_PUBLIC_DIFY_TOKEN || "WnX69EkeJYork2rTBtbB3wnY";

export default function DifyChat() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById(DIFY_TOKEN)) return;

    (window as unknown as { difyChatbotConfig: { token: string } }).difyChatbotConfig = {
      token: DIFY_TOKEN,
    };

    const script = document.createElement("script");
    script.src = "https://udify.app/embed.min.js";
    script.id = DIFY_TOKEN;
    script.defer = true;
    script.onerror = (e) => console.error("[dify] embed script failed to load", e);
    document.body.appendChild(script);

    const style = document.createElement("style");
    style.textContent = `
      #dify-chatbot-bubble-button { background-color: #5c5d45 !important; }
      #dify-chatbot-bubble-window { width: 24rem !important; height: 40rem !important; }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}
