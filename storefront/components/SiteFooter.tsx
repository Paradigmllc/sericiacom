import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-sericia-paper-deep text-sericia-ink">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div>
            <p className="label mb-5">Shop</p>
            <ul className="space-y-3 text-[14px] text-sericia-ink-soft">
              <li><Link href="/#drop" className="hover:text-sericia-ink">Current drop</Link></li>
              <li><Link href="/#waitlist" className="hover:text-sericia-ink">Next-drop waitlist</Link></li>
              <li><Link href="/guides" className="hover:text-sericia-ink">Country guides</Link></li>
            </ul>
          </div>
          <div>
            <p className="label mb-5">Tools</p>
            <ul className="space-y-3 text-[14px] text-sericia-ink-soft">
              <li><Link href="/tools/ems-calculator" className="hover:text-sericia-ink">EMS calculator</Link></li>
              <li><Link href="/tools/matcha-grade" className="hover:text-sericia-ink">Matcha grade finder</Link></li>
              <li><Link href="/tools/miso-finder" className="hover:text-sericia-ink">Miso style finder</Link></li>
              <li><Link href="/tools/shelf-life" className="hover:text-sericia-ink">Shelf-life estimator</Link></li>
            </ul>
          </div>
          <div>
            <p className="label mb-5">About</p>
            <ul className="space-y-3 text-[14px] text-sericia-ink-soft">
              <li><Link href="/#story" className="hover:text-sericia-ink">Our story</Link></li>
              <li><Link href="/shipping" className="hover:text-sericia-ink">Shipping policy</Link></li>
              <li><Link href="/refund" className="hover:text-sericia-ink">Refunds</Link></li>
              <li><Link href="/terms" className="hover:text-sericia-ink">Terms of sale</Link></li>
              <li><Link href="/privacy" className="hover:text-sericia-ink">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <p className="label mb-5">Contact</p>
            <ul className="space-y-3 text-[14px] text-sericia-ink-soft">
              <li><a href="mailto:contact@sericia.com" className="underline-link">contact@sericia.com</a></li>
              <li className="text-sericia-ink-mute leading-relaxed pt-2">
                Paradigm LLC<br />
                Registered in Delaware, USA<br />
                Ships from Kyoto, Japan
              </li>
            </ul>
          </div>
        </div>
        <div className="rule pt-8 flex flex-wrap items-center justify-between gap-4 text-[12px] text-sericia-ink-mute tracking-wider">
          <p>© {new Date().getFullYear()} Sericia · Paradigm LLC — All rights reserved.</p>
          <p>Small-batch · Limited drops · Shipped worldwide from Japan</p>
        </div>
      </div>
    </footer>
  );
}
