"use client";
import { useState, useMemo } from "react";
import { calcEms } from "@/lib/ems";
import ToolPageShell from "@/components/ToolPageShell";

// 1-hour ISR — page is mostly static editorial / brand copy.
export const revalidate = 3600;
const COUNTRY_LIST = [
  ["us", "United States"], ["uk", "United Kingdom"], ["de", "Germany"],
  ["fr", "France"], ["au", "Australia"], ["sg", "Singapore"],
  ["ca", "Canada"], ["hk", "Hong Kong"], ["kr", "South Korea"],
  ["tw", "Taiwan"], ["th", "Thailand"], ["my", "Malaysia"],
  ["ph", "Philippines"], ["vn", "Vietnam"], ["id", "Indonesia"],
  ["in", "India"], ["nz", "New Zealand"], ["es", "Spain"],
  ["it", "Italy"], ["nl", "Netherlands"], ["ae", "United Arab Emirates"],
  ["br", "Brazil"], ["mx", "Mexico"],
] as const;

export default function EmsCalculator() {
  const [weight, setWeight] = useState(500);
  const [country, setCountry] = useState("us");
  const result = useMemo(() => calcEms(weight, country), [weight, country]);

  return (
    <ToolPageShell slug="ems-calculator">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="border border-sericia-line bg-sericia-paper p-8 md:p-10">
          <label className="block mb-8">
            <span className="label block mb-4">Destination</span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[16px] cursor-pointer"
            >
              {COUNTRY_LIST.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="label block mb-4">Package weight — {weight}g</span>
            <input
              type="range"
              min={100} max={5000} step={50}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full accent-sericia-ink"
            />
            <div className="mt-2 flex justify-between text-[11px] tracking-wider uppercase text-sericia-ink-mute">
              <span>100g</span>
              <span>5,000g</span>
            </div>
          </label>
        </div>

        {result.jpy ? (
          <div>
            <p className="label mb-4">EMS shipping cost</p>
            <p className="text-[44px] md:text-[56px] font-normal leading-none tracking-tight mb-6 text-sericia-ink">
              ¥{result.jpy.toLocaleString()}
            </p>
            <dl className="grid grid-cols-3 gap-6 text-[13px] mb-6">
              <div>
                <dt className="label mb-1">Zone</dt>
                <dd className="text-sericia-ink-soft">{result.zone}</dd>
              </div>
              <div>
                <dt className="label mb-1">Transit</dt>
                <dd className="text-sericia-ink-soft">{result.transit}</dd>
              </div>
              <div>
                <dt className="label mb-1">Approx. USD</dt>
                <dd className="text-sericia-ink-soft">${Math.round(result.jpy / 149)}</dd>
              </div>
            </dl>
            <p className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute">
              Sericia covers EMS on orders ≥ $200.
            </p>
          </div>
        ) : (
          <p className="text-[15px] text-sericia-ink-soft">
            Unable to calculate. Write to{" "}
            <a href="mailto:contact@sericia.com" className="underline-link">contact@sericia.com</a>.
          </p>
        )}
      </div>
    </ToolPageShell>
  );
}
