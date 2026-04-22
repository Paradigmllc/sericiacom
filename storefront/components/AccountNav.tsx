"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/referrals", label: "Referrals" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/settings", label: "Settings" },
];

export default function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    try {
      await supabaseBrowser().auth.signOut();
      toast.success("Signed out");
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[account nav] sign out", err);
      toast.error(msg);
    }
  }

  return (
    <nav aria-label="Account navigation" className="md:sticky md:top-8">
      <p className="label mb-6">Your account</p>
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
                {item.label}
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
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
