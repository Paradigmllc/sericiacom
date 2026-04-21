import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-sericia-line bg-sericia-paper">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-[22px] tracking-[0.25em] uppercase font-normal text-sericia-ink">
            Sericia
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-10 text-[13px] text-sericia-ink-soft tracking-wider">
          <Link href="/#drop" className="hover:text-sericia-ink transition">Current drop</Link>
          <Link href="/guides" className="hover:text-sericia-ink transition">Guides</Link>
          <Link href="/tools" className="hover:text-sericia-ink transition">Tools</Link>
          <Link href="/#story" className="hover:text-sericia-ink transition">Our story</Link>
          <Link href="/shipping" className="hover:text-sericia-ink transition">Shipping</Link>
        </nav>
        <Link
          href="/#drop"
          className="text-[13px] tracking-wider text-sericia-ink border-b border-sericia-ink pb-0.5 hover:text-sericia-accent hover:border-sericia-accent transition"
        >
          Shop the drop
        </Link>
      </div>
    </header>
  );
}
