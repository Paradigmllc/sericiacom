"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useCart } from "@/lib/cart-store";
import { useUi } from "@/lib/ui-store";
import LocaleSwitcher from "./LocaleSwitcher";
import ThemeToggle from "./ThemeToggle";
import { BagIcon, SearchIcon, UserIcon } from "./Icons";

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
  const openCart = useUi((s) => s.openCart);
  const openSearch = useUi((s) => s.openSearch);
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

  const authed = session.status === "authed";

  return (
    <div className="flex items-center gap-5 md:gap-6 text-[13px] tracking-wider text-sericia-ink-soft">
      <button
        type="button"
        onClick={openSearch}
        aria-label="Open search"
        data-cursor="link"
        className="p-1.5 hover:text-sericia-ink transition-colors"
      >
        <SearchIcon className="h-5 w-5" />
      </button>

      {session.status === "anon" && (
        <Link
          href="/login"
          aria-label="Sign in"
          data-cursor="link"
          className="inline-flex p-1.5 hover:text-sericia-ink transition-colors"
        >
          <UserIcon filled={false} className="h-5 w-5" />
        </Link>
      )}
      {authed && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 hover:text-sericia-ink transition-colors"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            data-cursor="link"
          >
            <UserIcon filled className="h-5 w-5 text-sericia-ink" />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute right-0 top-full mt-3 w-60 border border-sericia-line bg-sericia-paper z-20 shadow-[0_10px_40px_-20px_rgba(33,35,29,0.2)]">
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
                  href="/account/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="block px-5 py-3 text-[13px] text-sericia-ink hover:bg-sericia-paper-card transition"
                >
                  Wishlist
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
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={openCart}
        aria-label={`Open cart${mounted && count > 0 ? ` with ${count} item${count === 1 ? "" : "s"}` : ""}`}
        data-cursor="link"
        className="relative p-1.5 hover:text-sericia-ink transition-colors"
      >
        <BagIcon className="h-5 w-5" />
        {mounted && count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-sericia-ink text-sericia-paper text-[10px] leading-4 text-center tabular-nums">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      <ThemeToggle />

      <LocaleSwitcher />
    </div>
  );
}
