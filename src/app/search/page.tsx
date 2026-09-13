import { Search as SearchIcon } from "lucide-react";
import { ProductGrid, StorefrontFooter, StorefrontHeader } from "@/components/storefront";
import { getPublishedProducts } from "@/lib/supabase/storefront";

export const metadata = { title: "Search Catalogue | Taneja Enterprises", description: "Search the live Taneja Enterprises wholesale beauty catalogue." };

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const params = (await searchParams) ?? {};
  const data = params.q ? await getPublishedProducts({ query: params.q }) : { products: [], count: 0 };
  return <><StorefrontHeader /><main className="page-wrap"><div className="catalogue-heading"><div><p className="editorial-kicker">Discovery / 09</p><h1 className="display-title mt-5">Find your<br />next essential.</h1></div></div><form className="editorial-rule flex max-w-4xl gap-3 py-5"><SearchIcon className="mt-3 text-[var(--rose)]" size={20} /><input name="q" defaultValue={params.q ?? ""} placeholder="Search name, brand, SKU or category" className="editorial-input border-0 bg-transparent text-xl" /><button className="editorial-button">Search</button></form>{params.q ? <p className="mt-8 text-sm uppercase tracking-[.12em] text-[var(--muted)]">{data.count} results for “{params.q}”</p> : <p className="body-copy mt-10 max-w-lg">Search the Taneja Enterprises catalogue by product name, brand, SKU or category.</p>}<div className="mt-10"><ProductGrid products={data.products} /></div></main><StorefrontFooter /></>;
}
