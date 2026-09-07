import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront";
import { getActiveCategories } from "@/lib/supabase/storefront";

export default async function CategoriesPage() {
  const categories = await getActiveCategories();
  return <><StorefrontHeader /><main className="page-wrap"><div className="catalogue-heading"><div><p className="editorial-kicker">Index / 08</p><h1 className="display-title mt-5">All the ways<br />to care.</h1></div><p className="catalogue-count">{categories.length} categories</p></div>{categories.length ? <div className="category-editorial-grid">{categories.map((category, index) => <Link href={`/category/${category.slug}`} key={category.id} className="category-tile min-h-[250px]"><span className="category-index">{String(index + 1).padStart(2, "0")}</span><div><h2 className="text-[2rem] font-medium leading-none tracking-tight text-[var(--plum)]">{category.name}</h2>{category.description ? <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--muted)]">{category.description}</p> : null}</div><span className="category-arrow"><ArrowUpRight size={22} /></span></Link>)}</div> : <div className="empty-state mt-10">No active categories are available.</div>}</main><StorefrontFooter /></>;
}
