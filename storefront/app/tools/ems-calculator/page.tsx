"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { calcEms, EMS_ZONES } from "../../../lib/ems";

const COUNTRY_LIST = [
  ["us", "🇺🇸 United States"], ["uk", "🇬🇧 United Kingdom"], ["de", "🇩🇪 Germany"],
  ["fr", "🇫🇷 France"], ["au", "🇦🇺 Australia"], ["sg", "🇸🇬 Singapore"],
  ["ca", "🇨🇦 Canada"], ["hk", "🇭🇰 Hong Kong"], ["kr", "🇰🇷 South Korea"],
  ["tw", "🇹🇼 Taiwan"], ["th", "🇹🇭 Thailand"], ["my", "🇲🇾 Malaysia"],
  ["ph", "🇵🇭 Philippines"], ["vn", "🇻🇳 Vietnam"], ["id", "🇮🇩 Indonesia"],
  ["in", "🇮🇳 India"], ["nz", "🇳🇿 New Zealand"], ["es", "🇪🇸 Spain"],
  ["it", "🇮🇹 Italy"], ["nl", "🇳🇱 Netherlands"], ["ae", "🇦🇪 UAE"],
  ["br", "🇧🇷 Brazil"], ["mx", "🇲🇽 Mexico"],
] as const;

export default function EmsCalculator() {
  const [weight, setWeight] = useState(500);
  const [country, setCountry] = useState("us");
  const result = useMemo(() => calcEms(weight, country), [weight, country]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 font-serif">
      <nav className="mb-8 text-sm text-sericia-ink/60">
        <Link href="/" className="hover:underline">Sericia</Link> / <Link href="/tools" className="hover:underline">Tools</Link> / EMS Calculator
      </nav>

      <h1 className="mb-4 text-4xl font-bold">EMS Shipping Calculator: Japan → World</h1>
      <p className="mb-10 text-lg text-sericia-ink/80">
        Estimate Japan Post EMS international shipping cost & transit time. 2026 official rates, 23+ destinations.
      </p>

      <div className="rounded-xl border border-sericia-ink/10 bg-sericia-paper p-8 shadow-sm">
        <label className="mb-6 block">
          <span className="mb-2 block font-semibold">Destination Country</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border border-sericia-ink/20 bg-white px-4 py-3">
            {COUNTRY_LIST.map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </label>

        <label className="mb-6 block">
          <span className="mb-2 block font-semibold">Package Weight: {weight}g</span>
          <input type="range" min={100} max={5000} step={50} value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full accent-sericia-accent" />
          <div className="mt-1 flex justify-between text-xs text-sericia-ink/50">
            <span>100g</span><span>5000g</span>
          </div>
        </label>

        <div className="mt-8 rounded-lg bg-sericia-accent/10 p-6">
          {result.jpy ? (
            <>
              <div className="mb-2 text-sm uppercase tracking-wider text-sericia-ink/60">EMS Shipping Cost</div>
              <div className="text-4xl font-bold text-sericia-accent">¥{result.jpy.toLocaleString()}</div>
              <div className="mt-3 text-sm text-sericia-ink/70">
                Zone {result.zone} • Transit: <strong>{result.transit}</strong>
              </div>
              <div className="mt-2 text-xs text-sericia-ink/50">
                ≈ ${Math.round(result.jpy / 149)} USD at current exchange rate
              </div>
            </>
          ) : (
            <div className="text-sericia-ink/70">Unable to calculate. Please contact us at <a href="mailto:contact@sericia.com" className="text-sericia-accent underline">contact@sericia.com</a></div>
          )}
        </div>
      </div>

      <section className="mt-16 space-y-4 text-sericia-ink/80">
        <h2 className="text-2xl font-semibold text-sericia-ink">About EMS</h2>
        <p>
          EMS (Express Mail Service) is Japan Post's premium international shipping. Tracked end-to-end, customs-cleared,
          and delivered with signature confirmation. Sericia ships all drops via EMS by default — it's the only service
          that preserves shelf life while guaranteeing delivery.
        </p>
        <p>
          <strong>Zone 1</strong> (East Asia): fastest, cheapest. <strong>Zone 2</strong> (SEA/Oceania/Canada): mid.
          <strong> Zone 3</strong> (US/EU/Middle East): standard. <strong>Zone 4</strong> (South America/Africa): longest.
        </p>
      </section>
    </main>
  );
}
