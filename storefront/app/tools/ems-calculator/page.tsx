"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { calcEms } from "../../../lib/ems";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import ContentSidebar from "../../../components/ContentSidebar";
import { Container, Eyebrow, Rule } from "../../../components/ui";

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
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-20 md:py-28">
          <nav className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute mb-6">
            <Link href="/" className="hover:text-sericia-ink">Sericia</Link>
            <span className="mx-3">·</span>
            <Link href="/tools" className="hover:text-sericia-ink">Tools</Link>
            <span className="mx-3">·</span>
            <span>EMS Calculator</span>
          </nav>
          <Eyebrow>Tool one</Eyebrow>
          <h1 className="text-[40px] md:text-[56px] leading-[1.08] font-normal tracking-tight max-w-4xl">
            EMS shipping calculator — Japan to the world.
          </h1>
          <p className="mt-8 text-[18px] text-sericia-ink-soft max-w-prose leading-relaxed">
            Estimate Japan Post EMS international shipping cost and transit time. Based on 2026 official
            rates across twenty-three destinations.
          </p>
        </Container>
      </section>

      <Container size="wide" className="py-20 md:py-28">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 min-w-0 max-w-[720px]">
        <div className="border border-sericia-line bg-sericia-paper-card p-10 md:p-12">
          <label className="block mb-10">
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

          <label className="block mb-10">
            <span className="label block mb-4">Package weight — {weight}g</span>
            <input
              type="range"
              min={100}
              max={5000}
              step={50}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full accent-sericia-ink"
            />
            <div className="mt-2 flex justify-between text-[11px] tracking-wider uppercase text-sericia-ink-mute">
              <span>100g</span>
              <span>5,000g</span>
            </div>
          </label>

          <Rule className="mb-10" />

          {result.jpy ? (
            <div>
              <p className="label mb-4">EMS shipping cost</p>
              <p className="text-[48px] md:text-[56px] font-normal leading-none tracking-tight mb-6">
                ¥{result.jpy.toLocaleString()}
              </p>
              <dl className="grid grid-cols-3 gap-6 text-[13px]">
                <div>
                  <dt className="label mb-1">Zone</dt>
                  <dd>{result.zone}</dd>
                </div>
                <div>
                  <dt className="label mb-1">Transit</dt>
                  <dd>{result.transit}</dd>
                </div>
                <div>
                  <dt className="label mb-1">Approx. USD</dt>
                  <dd>${Math.round(result.jpy / 149)}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="text-[15px] text-sericia-ink-soft">
              Unable to calculate. Write to{" "}
              <a href="mailto:contact@sericia.com" className="underline-link">contact@sericia.com</a>.
            </p>
          )}
        </div>

        <Rule className="my-16" />

        <div className="prose-aesop">
          <p className="label mb-4">About EMS</p>
          <h2 id="about-ems">Why we ship EMS, only EMS.</h2>
          <p>
            EMS — Express Mail Service — is Japan Post&apos;s premium international shipping. Tracked end-to-end,
            customs-cleared, and delivered with signature confirmation. Sericia ships every drop via EMS by
            default. It is the only service that preserves shelf life while guaranteeing delivery.
          </p>
          <p>
            <strong>Zone 1</strong> — East Asia — is fastest and cheapest.{" "}
            <strong>Zone 2</strong> — South-East Asia, Oceania, Canada — sits in the middle.{" "}
            <strong>Zone 3</strong> — United States, European Union, Middle East — is the standard.{" "}
            <strong>Zone 4</strong> — South America and Africa — has the longest transit.
          </p>
        </div>
          </div>
          <ContentSidebar
            sectionTitle="In this tool"
            sections={[{ href: "#about-ems", label: "About EMS" }]}
            relatedTools={[
              { href: "/tools/shelf-life", label: "Shelf-life checker" },
              { href: "/tools/matcha-grade", label: "Matcha grade decoder" },
              { href: "/tools/miso-finder", label: "Miso type finder" },
              { href: "/tools/tea-brewer", label: "Japanese tea brewer" },
            ]}
          />
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
