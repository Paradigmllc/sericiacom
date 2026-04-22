import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, PageHero } from "@/components/ui";
import { listActiveProducts, categoryLabel, type Product } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import FadeIn from "@/components/FadeIn";
import ProductsFilterBar, {
  type CategoryKey,
  type SortKey,
} from "@/components/ProductsFilterBar";

/**
 * /products — collection index with URL-synced category filter + sort.
 *
 * Why Server Component as source of truth (T2-I):
 *   • The filter/sort is read from `searchParams` on the server, so the grid
 *     that renders is already correctly filtered before any client JS runs.
 *     That's the shareable, indexable, crawlable contract — a user pasting
 *     /products?category=miso into a tab sees miso-only even with JS disabled.
 *   • The Client Component (ProductsFilterBar) only owns the INPUT surface
 *     (pills + sort select); the server owns the OUTPUT (grid).
 *
 * SEO nuance:
 *   • Canonical always points at /products (no params) — filter variants are
 *     conceptually the same page, ranking signal shouldn't be split across
 *     four category URLs.
 *   • Filter variants still get a distinct <title>, so shared links in Slack /
 *     email preview correctly ("Tea — Rescued Japanese craft").
 *   • noindex on filter/sort combos at-scale is overkill for a 4-category
 *     storefront; default indexability is fine.
 */

const CATEGORY_KEYS: ReadonlyArray<CategoryKey> = ["tea", "miso", "mushroom", "seasoning"];
const SORT_KEYS: ReadonlyArray<SortKey> = ["featured", "price-asc", "price-desc", "name"];

function parseCategory(raw: string | undefined): CategoryKey | null {
  if (!raw) return null;
  return (CATEGORY_KEYS as ReadonlyArray<string>).includes(raw) ? (raw as CategoryKey) : null;
}

function parseSort(raw: string | undefined): SortKey {
  if (!raw) return "featured";
  return (SORT_KEYS as ReadonlyArray<string>).includes(raw) ? (raw as SortKey) : "featured";
}

function sortProducts(products: Product[], sort: SortKey): Product[] {
  // Returns a new array — never mutates the source. `featured` leaves the
  // upstream (Medusa) ordering intact, which is the curator's intent.
  switch (sort) {
    case "price-asc":
      return [...products].sort((a, b) => a.price_usd - b.price_usd);
    case "price-desc":
      return [...products].sort((a, b) => b.price_usd - a.price_usd);
    case "name":
      return [...products].sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
    default:
      return products;
  }
}

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(
  { searchParams }: { searchParams: SearchParams },
): Promise<Metadata> {
  const sp = await searchParams;
  const category = parseCategory(typeof sp.category === "string" ? sp.category : undefined);

  const baseTitle = "Shop — Rescued Japanese craft";
  const baseDesc =
    "Small-batch tea, miso, mushrooms and seasonings rescued from Japan's finest producers. Ships EMS worldwide from Kyoto.";

  if (category) {
    const label = categoryLabel(category);
    return {
      title: `${label} — Rescued Japanese craft`,
      description: `Small-batch ${label.toLowerCase()}, rescued from Japan's finest producers. Ships EMS worldwide from Kyoto.`,
      alternates: { canonical: "/products" },
    };
  }

  return {
    title: baseTitle,
    description: baseDesc,
    alternates: { canonical: "/products" },
  };
}

export default async function ProductsIndexPage(
  { searchParams }: { searchParams: SearchParams },
) {
  const sp = await searchParams;
  const category = parseCategory(typeof sp.category === "string" ? sp.category : undefined);
  const sort = parseSort(typeof sp.sort === "string" ? sp.sort : undefined);

  const all = await listActiveProducts();

  // Build counts off the unfiltered list so pills always show "(N)" of what's
  // actually available, not "(0)" in a category the user just filtered away from.
  const counts: Record<CategoryKey, number> = {
    tea: 0,
    miso: 0,
    mushroom: 0,
    seasoning: 0,
  };
  for (const p of all) {
    if (p.category in counts) counts[p.category as CategoryKey]++;
  }

  const filtered = category === null ? all : all.filter((p) => p.category === category);
  const sorted = sortProducts(filtered, sort);

  return (
    <>
      <SiteHeader />
      <PageHero
        eyebrow="The collection"
        title="Rescued Japanese craft, shipped from Kyoto."
        lede="Single-origin tea, barrel-aged miso, sun-dried mushrooms and small-batch seasonings — limited stock, honest stories, EMS worldwide."
      />
      <Container size="wide" className="py-20 md:py-28">
        <ProductsFilterBar
          currentCategory={category}
          currentSort={sort}
          counts={counts}
          totalCount={all.length}
        />

        <div className="mt-10 md:mt-14">
          {sorted.length === 0 ? (
            <div className="py-16 text-center">
              <p className="label mb-3">No matches</p>
              <p className="text-[15px] text-sericia-ink-soft max-w-md mx-auto">
                Nothing in this category right now. Try another filter — the drop
                rotates often and new items appear as they come back into stock.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 bg-sericia-line gap-px">
              {sorted.map((p, i) => (
                <FadeIn key={p.id} delay={(i % 6) * 0.06}>
                  <ProductCard product={p} />
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
