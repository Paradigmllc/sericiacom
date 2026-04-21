"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { toast } from "sonner";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/drops", label: "Drops" },
  { href: "/admin/waitlist", label: "Waitlist" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
      toast.success("Signed out");
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[admin] logout failed", err);
      toast.error(msg);
    }
  }

  return (
    <div className="min-h-screen bg-sericia-paper flex">
      <aside className="w-60 shrink-0 bg-sericia-paper-card border-r border-sericia-line flex flex-col">
        <div className="px-6 py-6 border-b border-sericia-line">
          <div className="label mb-1">Sericia</div>
          <div className="text-[18px] tracking-[0.2em] uppercase">Admin</div>
        </div>
        <nav className="flex-1 px-3 py-6">
          {NAV.map((n) => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`block px-3 py-2.5 text-[13px] tracking-wider transition ${
                  active
                    ? "bg-sericia-ink text-sericia-paper"
                    : "text-sericia-ink-soft hover:text-sericia-ink hover:bg-sericia-paper"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="m-3 px-3 py-2.5 text-[13px] tracking-wider text-sericia-ink-soft hover:text-sericia-ink hover:bg-sericia-paper text-left border-t border-sericia-line"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="border-b border-sericia-line px-10 py-6 bg-sericia-paper-card">
          <div className="label mb-1">Sericia Admin</div>
          <h1 className="text-[24px] font-normal tracking-tight">{title}</h1>
        </header>
        <div className="px-10 py-10">{children}</div>
      </main>
    </div>
  );
}
