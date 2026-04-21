import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";

const DIFY_TOKEN = process.env.NEXT_PUBLIC_DIFY_TOKEN || "WnX69EkeJYork2rTBtbB3wnY";

export const metadata: Metadata = {
  title: "Sericia — Rescued Japanese Craft Food",
  description:
    "Drop-by-drop releases of surplus Japanese craft food: sencha, miso, dried shiitake. Rescued from disposal. Shipped worldwide.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
        <Script id="dify-config" strategy="afterInteractive">
          {`window.difyChatbotConfig = { token: '${DIFY_TOKEN}' };`}
        </Script>
        <Script
          src="https://udify.app/embed.min.js"
          id={DIFY_TOKEN}
          strategy="afterInteractive"
          defer
        />
        <style>{`
          #dify-chatbot-bubble-button { background-color: #8b5a2b !important; }
          #dify-chatbot-bubble-window { width: 24rem !important; height: 40rem !important; }
        `}</style>
      </body>
    </html>
  );
}
