import { notFound } from "next/navigation";
import { ProductGrid, StorefrontHeader } from "@/components/storefront";
import { getActiveCategory, getPublishedProducts } from "@/lib/supabase/storefront";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getActiveCategory(slug);
  if (!category) notFound();
  const products = await getPublishedProducts({ category: category.name });
  return <><StorefrontHeader /><main className="mx-auto max-w-7xl px-4 py-8"><p className="text-sm text-slate-500">Category</p><h1 className="text-3xl font-black">{category.name}</h1>{category.description ? <p className="mt-2 max-w-2xl text-slate-600">{category.description}</p> : null}<div className="mt-8"><ProductGrid products={products.products} /></div></main></>;
}
