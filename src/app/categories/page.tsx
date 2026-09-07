import Link from "next/link";
import { StorefrontHeader } from "@/components/storefront";
import { getActiveCategories } from "@/lib/supabase/storefront";

export default async function CategoriesPage() {
  const categories = await getActiveCategories();
  return <><StorefrontHeader /><main className="mx-auto max-w-7xl px-4 py-8"><p className="text-sm text-slate-500">Browse</p><h1 className="text-3xl font-black">Categories</h1>{categories.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map((category) => <Link href={`/category/${category.slug}`} key={category.id} className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-slate-400"><h2 className="font-black">{category.name}</h2>{category.description ? <p className="mt-2 text-sm text-slate-500">{category.description}</p> : null}</Link>)}</div> : <p className="mt-6 rounded-2xl bg-slate-50 p-8 text-sm text-slate-500">No active categories are available.</p>}</main></>;
}
