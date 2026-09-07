import { notFound } from "next/navigation";
import { ProductGrid, StorefrontFooter, StorefrontHeader } from "@/components/storefront";
import { getActiveCategory, getPublishedProducts } from "@/lib/supabase/storefront";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const category = await getActiveCategory((await params).slug);
  if (!category) notFound();
  const products = await getPublishedProducts({ category: category.name });
  return <><StorefrontHeader /><main className="page-wrap"><div className="catalogue-heading"><div><p className="editorial-kicker">Category / {products.count} products</p><h1 className="display-title mt-5">{category.name}</h1>{category.description ? <p className="body-copy mt-7 max-w-xl">{category.description}</p> : null}</div></div><ProductGrid products={products.products} /></main><StorefrontFooter /></>;
}
