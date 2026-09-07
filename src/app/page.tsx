import Link from "next/link";
import { ProductGrid, StorefrontHeader } from "@/components/storefront";
import { getActiveCategories, getHomepageSections, getPublishedProducts } from "@/lib/supabase/storefront";

export default async function HomePage() {
  const [categories, featured, newArrivals, sections] = await Promise.all([
    getActiveCategories(),
    getPublishedProducts({ featured: true, pageSize: 8 }),
    getPublishedProducts({ newArrival: true, pageSize: 8 }),
    getHomepageSections(),
  ]);

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="rounded-3xl bg-[#172d27] px-6 py-12 text-white md:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Taneja Enterprises</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black md:text-6xl">Wholesale products for growing businesses.</h1>
          <p className="mt-4 max-w-xl text-slate-200">Browse the live catalogue, check availability, and prepare your order with real product pricing.</p>
          <Link href="/products" className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#172d27]">Browse products</Link>
        </section>
        {sections.length ? <section className="mt-8 grid gap-3 md:grid-cols-2">{sections.map((section) => <div key={section.id} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{section.section_type ?? "Store update"}</p><h2 className="mt-2 text-xl font-black">{section.title ?? ""}</h2>{section.subtitle ? <p className="mt-1 text-sm text-slate-600">{section.subtitle}</p> : null}</div>)}</section> : null}
        <section className="mt-10">
          <div className="flex items-end justify-between"><div><p className="text-sm text-slate-500">Browse</p><h2 className="text-2xl font-black">Categories</h2></div><Link href="/categories" className="text-sm font-semibold">View all</Link></div>
          {categories.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">{categories.slice(0, 8).map((category) => <Link key={category.id} href={`/category/${category.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 font-bold hover:border-slate-400">{category.name}</Link>)}</div> : <p className="mt-4 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Categories will appear here once configured.</p>}
        </section>
        <section className="mt-12"><div className="mb-4"><p className="text-sm text-slate-500">Admin-curated</p><h2 className="text-2xl font-black">Featured products</h2></div><ProductGrid products={featured.products} /></section>
        <section className="mt-12"><div className="mb-4"><p className="text-sm text-slate-500">Recently added</p><h2 className="text-2xl font-black">New arrivals</h2></div><ProductGrid products={newArrivals.products} /></section>
      </main>
    </>
  );
}
