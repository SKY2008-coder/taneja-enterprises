import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront";
import { getActiveCategories } from "@/lib/supabase/storefront";

export const metadata = { title: "Categories | Taneja Enterprises", description: "Explore the live professional beauty and salon supply categories from Taneja Enterprises." };

export default async function CategoriesPage() {
  const categories = await getActiveCategories();
  return (
    <>
      <StorefrontHeader />
      <main className="page-wrap">
        <div className="catalogue-heading">
          <div>
            <p className="editorial-kicker">Index / 08</p>
            <h1 className="display-title mt-5">All the ways<br />to care.</h1>
          </div>
          <p className="catalogue-count text-rust font-bold">{categories.length} Categories</p>
        </div>

        {categories.length > 0 ? (
          <div className="category-editorial-grid border-line">
            {categories.map((category, index) => (
              <Link 
                href={`/category/${category.slug}`} 
                key={category.id} 
                className="category-tile group min-h-[300px] border-line hover:bg-rose-soft transition-colors"
              >
                <span className="category-index group-hover:text-rust transition-colors">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="mt-8">
                  <h2 className="text-3xl font-medium tracking-tight text-charcoal group-hover:translate-x-2 transition-transform">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="mt-6 max-w-xs text-xs leading-6 text-muted opacity-70 group-hover:opacity-100 transition-opacity">
                      {category.description}
                    </p>
                  )}
                </div>
                <span className="category-arrow group-hover:text-rust transition-colors">
                  <ArrowUpRight size={28} strokeWidth={1} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">No categories found.</div>
        )}
      </main>
      <StorefrontFooter />
    </>
  );
}
