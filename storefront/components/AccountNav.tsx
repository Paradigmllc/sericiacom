"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabaseBrowser } from "@/lib/supabase-browser";

// NAV labels are resolved via translations at render time so labels follow the
// active locale. The `key` field is the stable identifier used to look up
// the localised label in the `nav` namespace.
const NAV: Array<{ href: string; key: string }> = [
  { href: "/account", key: "overview" },
  { href: "/account/orders", key: "orders" },
  { href: "/account/wishlist", key: "wishlist" },
  { href: "/account/referrals", key: "referrals" },
  { href: "/account/addresses", key: "addresses" },
  { href: "/account/settings", key: "settings" },
];

export default function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tAccountNav = useTranslations("common.account_nav");
  const tA11y = useTranslations("common.a11y");

  async function signOut() {
    try {
      await supabaseBrowser().auth.signOut();
      toast.success(tA11y("signed_out"));
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[account nav] sign out", err);
      toast.error(msg);
    }
  }

  // Map item.key → its translated label. `overview`, `orders`, `wishlist`,
  // `addresses` live in the pre-existing `nav.*` namespace (so the header
  // and account sidebar share copy). `settings` + `referrals` were added
  // in F69-followup under `common.account_nav.*` because `nav.*` didn't
  // have them and the i18n batch translator only writes to empty keypaths
  // to avoid clobbering hand-curated translations.
  function labelFor(key: string): string {
    switch (key) {
      case "settings":
        return tAccountNav("settings");
      case "referrals":
        return tAccountNav("referrals");
      default:
        return tNav(key as "overview" | "orders" | "wishlist" | "addresses");
    }
  }

  return (
    <nav aria-label={tA11y("signed_in")} className="md:sticky md:top-8">
      <p className="label mb-6">{tAccountNav("panel_title")}</p>
      <ul className="space-y-1 border-t border-sericia-line">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/account" && pathname.startsWith(item.href));
          return (
            <li key={item.href} className="border-b border-sericia-line">
              <Link
                href={item.href}
                className={`block py-4 text-[13px] tracking-wider transition-colors ${
                  active ? "text-sericia-ink" : "text-sericia-ink-soft hover:text-sericia-ink"
                }`}
              >
                {labelFor(item.key)}
              </Link>
            </li>
          );
        })}
        <li className="border-b border-sericia-line">
          <button
            type="button"
            onClick={signOut}
            className="w-full text-left py-4 text-[13px] tracking-wider text-sericia-ink-soft hover:text-sericia-ink transition"
          >
            {tAccountNav("sign_out")}
          </button>
        </li>
      </ul>
    </nav>
  );
}
