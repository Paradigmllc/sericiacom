"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useCart } from "@/lib/cart-store";
import LocaleSwitcher from "./LocaleSwitcher";

type SessionState = {
  status: "loading" | "anon" | "authed";
  email: string | null;
};

export default function HeaderClient() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [session, setSession] = useState<SessionState>({ status: "loading", email: null });
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useCart((s) => s.items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    setMounted(true);
    const supa = supabaseBrowser();
    supa.auth.getUser().then(({ data }) => {
      setSession({
        status: data.user ? "authed" : "anon",
        email: data.user?.email ?? null,
      });
    });
    const { data: sub } = supa.auth.onAuthStateChange((_event, s) => {
      setSession({
        status: s?.user ? "authed" : "anon",
        email: s?.user?.email ?? null,
      });
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    try {
      await supabaseBrowser().auth.signOut();
      toast.success(t("sign_out"));
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[header] sign out failed", err);
      toast.error(msg);
    }
  }

  return (
    <div className="flex items-center gap-6 text-[13px] tracking-wider text-sericia-ink-soft">
      {session.status === "loading" && (
        <span className="hidden md:inline opacity-0">.</span>
      )}
      {session.status === "anon" && (
        <Link
          href="/login"
          className="hidden md:inline-block hover:text-sericia-ink transition"
        >
          {t("sign_in")}
        </Link>
      )}
      {session.status === "authed" && (
        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="hover:text-sericia-ink transition"
            aria-expanded={menuOpen}
            aria-label="Account menu"
          >
            {t("account")}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-3 w-56 border border-sericia-line bg-sericia-paper z-20">
              <div className="px-5 py-4 border-b border-sericia-line">
                <div className="label mb-1">{t("signed_in")}</div>
                <div className="text-[12px] text-sericia-ink break-all">{session.email}</div>
              </div>
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="block px-5 py-3 text-[13px] text-sericia-ink hover:bg-sericia-paper-card transition"
              >
                {t("overview")}
              </Link>
              <Link
                href="/account/orders"
                onClick={() => setMenuOpen(false)}
                className="block px-5 py-3 text-[13px] text-sericia-ink hover:bg-sericia-paper-card transition"
              >
                {t("orders")}
              </Link>
              <Link
                href="/account/addresses"
                onClick={() => setMenuOpen(false)}
                className="block px-5 py-3 text-[13px] text-sericia-ink hover:bg-sericia-paper-card transition"
              >
                {t("addresses")}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="block w-full text-left px-5 py-3 text-[13px] text-sericia-ink hover:bg-sericia-paper-card transition border-t border-sericia-line"
              >
                {t("sign_out")}
              </button>
            </div>
          )}
        </div>
      )}
      <Link
        href="/cart"
        className="relative hover:text-sericia-ink transition"
        aria-label={`Cart with ${count} item${count === 1 ? "" : "s"}`}
      >
        {t("cart")}{mounted && count > 0 ? ` (${count})` : ""}
      </Link>
      <LocaleSwitcher />
    </div>
  );
}
