import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductGrid, StorefrontFooter, StorefrontHeader } from "@/components/storefront";
import { getActiveCategories, getPublishedProducts } from "@/lib/supabase/storefront";

export const metadata = { title: "Catalogue | Taneja Enterprises", description: "Browse the live Taneja Enterprises wholesale beauty and professional salon catalogue." };

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const params = (await searchParams) ?? {};
  const [data, categories] = await Promise.all([
    getPublishedProducts({
      query: params.q,
      category: params.category,
      brand: params.brand,
      minPrice: params.min ? Number(params.min) : undefined,
      maxPrice: params.max ? Number(params.max) : undefined,
      availability: params.availability,
      sort: params.sort,
      page: Number(params.page ?? 1),
    }),
    getActiveCategories(),
  ]);

  return (
    <>
      <StorefrontHeader />
      <main className="page-wrap">
        <div className="catalogue-heading">
          <div>
            <p className="editorial-kicker">Selection / Catalogue</p>
            <h1 className="display-title mt-5">The professional<br />selection.</h1>
          </div>
          <div className="text-right">
            <p className="catalogue-count text-rust font-bold">{data.count} Products</p>
            <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1">Live Availability</p>
          </div>
        </div>

        <form method="get" className="catalogue-filters mb-12" aria-label="Catalogue filters">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex-1 relative">
              <label htmlFor="catalogue-search" className="sr-only">Search catalogue</label>
              <input
                id="catalogue-search"
                name="q" 
                defaultValue={params.q} 
                placeholder="Search the catalogue..." 
                className="w-full border-b border-line py-3 text-sm focus:border-rust outline-none bg-transparent"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <label className="catalogue-filter-field"><span>Category</span><select name="category" defaultValue={params.category ?? ""}>
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select></label>
              <label className="catalogue-filter-field"><span>Availability</span><select name="availability" defaultValue={params.availability ?? ""}>
                <option value="">Availability</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select></label>
              <label className="catalogue-filter-field"><span>Minimum price</span><input type="number" name="min" min="0" step="1" defaultValue={params.min ?? ""} placeholder="Any" /></label>
              <label className="catalogue-filter-field"><span>Maximum price</span><input type="number" name="max" min="0" step="1" defaultValue={params.max ?? ""} placeholder="Any" /></label>
              <label className="catalogue-filter-field"><span>Sort</span><select name="sort" defaultValue={params.sort ?? "newest"}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price Low-High</option>
                <option value="price_desc">Price High-Low</option>
              </select></label>
              <button type="submit" className="!bg-charcoal !text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:!bg-rust transition-colors">
                Apply
              </button>
            </div>
          </div>
        </form>

        <div className="mt-16">
          <ProductGrid products={data.products} />
        </div>

        {data.totalPages > 1 && (
          <div className="mt-24 flex items-center justify-between border-t border-line pt-8 text-[10px] font-bold uppercase tracking-[.2em] text-charcoal">
            <span>Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-8">
              <Link 
                href={{ pathname: "/products", query: { ...params, page: String(Math.max(1, data.page - 1)) } }} 
                className={`flex items-center gap-2 ${data.page <= 1 ? "opacity-20 pointer-events-none" : "hover:text-rust"}`}
              >
                <ArrowLeft size={14} /> Previous
              </Link>
              <Link 
                href={{ pathname: "/products", query: { ...params, page: String(Math.min(data.totalPages, data.page + 1)) } }} 
                className={`flex items-center gap-2 ${data.page >= data.totalPages ? "opacity-20 pointer-events-none" : "hover:text-rust"}`}
              >
                Next <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </main>
      <StorefrontFooter />
    </>
  );
}
