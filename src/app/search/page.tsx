import { ProductGrid, StorefrontHeader } from "@/components/storefront";
import { getPublishedProducts } from "@/lib/supabase/storefront";

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const params = (await searchParams) ?? {};
  const data = params.q ? await getPublishedProducts({ query: params.q }) : { products: [], count: 0 };
  return <><StorefrontHeader /><main className="mx-auto max-w-7xl px-4 py-8"><h1 className="text-3xl font-black">Search catalogue</h1><form className="mt-5 flex gap-3"><input name="q" defaultValue={params.q ?? ""} placeholder="Search name, brand, SKU or category" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm" /><button className="rounded-xl bg-[#172d27] px-5 py-3 text-sm font-bold text-white">Search</button></form>{params.q ? <p className="mt-6 text-sm text-slate-500">{data.count} results for “{params.q}”</p> : <p className="mt-8 rounded-2xl bg-slate-50 p-8 text-sm text-slate-500">Search only Taneja Enterprises’ catalogue.</p>}<div className="mt-5"><ProductGrid products={data.products} /></div></main></>;
}
