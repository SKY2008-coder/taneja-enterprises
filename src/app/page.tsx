import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, MoveDown } from "lucide-react";
import { ProductGrid, StorefrontFooter, StorefrontHeader } from "@/components/storefront";
import { getActiveCategories, getHomepageSections, getPublishedProducts } from "@/lib/supabase/storefront";

export default async function HomePage() {
  const [categories, featured, newArrivals, sections] = await Promise.all([
    getActiveCategories(),
    getPublishedProducts({ featured: true, pageSize: 8 }),
    getPublishedProducts({ newArrival: true, pageSize: 8 }),
    getHomepageSections(),
  ]);

  const heroProduct = featured.products[0] ?? newArrivals.products[0];
  const heroImage = heroProduct?.product_images?.[0]?.image_url;
  
  const categoryLead = categories[0];
  const categorySecond = categories[1];

  const professionalWorlds = [
    "Hair Care", "Skin Care", "Makeup", "Facial", "Spa", "Detox", 
    "Foot Care", "Nail Art", "Manicure", "Pedicure", 
    "Makeup Kits & Bags", "Salon Tools & Machinery", 
    "Salon Furniture", "Professional Beauty Supplies"
  ].filter(world => categories.some(c => c.name.toLowerCase() === world.toLowerCase()));

  return (
    <>
      <div className="announcement-bar">
        PROFESSIONAL BEAUTY • SALON SUPPLIES • WHOLESALE · KURUKSHETRA
      </div>
      
      <StorefrontHeader />
      
      <main>
        {/* Masthead Section */}
        <section className="masthead">
          <div className="masthead-top">
            <span>Wholesale / Professional Selection</span>
            <span>Scroll to explore <MoveDown size={14} className="inline ml-1" /></span>
          </div>
          <h1 className="masthead-title">TANEJA ENTERPRISES</h1>
          <div className="masthead-bottom">
            <p>Premium wholesale beauty & professional salon supplies for artists, spaces and businesses.</p>
            <span>SCO 15 Basement, Sector 17, Kurukshetra</span>
          </div>
          {heroImage && (
            <div className="masthead-image">
              <img src={heroImage} alt="Featured professional selection" />
            </div>
          )}
        </section>

        <div className="page-wrap">
          {/* Intro Section */}
          <section className="intro-spread editorial-rule">
            <p className="home-intro-aside">01 / The house</p>
            <div>
              <h2 className="section-title">The professional beauty cabinet, made visible.</h2>
              <p className="body-copy mt-8 max-w-xl">
                Taneja Enterprises is the region&apos;s leading destination for premium wholesale cosmetics 
                and salon equipment. We bridge the gap between global beauty innovation and 
                local professional excellence.
              </p>
              <Link href="/products" className="section-link mt-10 inline-flex items-center gap-2">
                Enter the catalogue <ArrowUpRight size={15} />
              </Link>
            </div>
          </section>

          {/* Dynamic Editorial Sections */}
          {sections.length > 0 && (
            <section className="editorial-notes editorial-rule">
              {sections.map((section) => (
                <article key={section.id}>
                  <p className="editorial-kicker">{section.section_type || "Catalogue note"}</p>
                  <h2>{section.title}</h2>
                  {section.subtitle && <p className="body-copy mt-4">{section.subtitle}</p>}
                </article>
              ))}
            </section>
          )}

          {/* Categories Section */}
          <section className="category-stage">
            <div className="stage-label">
              <p className="editorial-kicker">02 / The worlds</p>
              <span>Live Categories</span>
            </div>
            <div className="category-marquee">
              Shop by<br />professional world.
            </div>
            
            <div className="category-stage-grid">
              {categoryLead && (
                <Link href={`/category/${categoryLead.slug}`} className="category-feature category-feature-plum group">
                  <span className="category-index">01</span>
                  <h2 className="group-hover:translate-x-2 transition-transform">{categoryLead.name}</h2>
                  <ArrowDownRight size={28} />
                </Link>
              )}
              {categorySecond && (
                <Link href={`/category/${categorySecond.slug}`} className="category-feature category-feature-rose group">
                  <span className="category-index">02</span>
                  <h2 className="group-hover:translate-x-2 transition-transform">{categorySecond.name}</h2>
                  <ArrowDownRight size={28} />
                </Link>
              )}
              
              <div className="category-directory">
                {categories.slice(2, 8).map((category, index) => (
                  <Link key={category.id} href={`/category/${category.slug}`} className="group">
                    <span>{String(index + 3).padStart(2, "0")}</span>
                    <strong className="group-hover:pl-4 transition-all">{category.name}</strong>
                    <ArrowUpRight size={17} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="mt-12 flex justify-end">
              <Link href="/categories" className="section-link inline-flex items-center gap-2">
                View all categories <ArrowUpRight size={15} />
              </Link>
            </div>
          </section>

          {/* Featured Catalogue */}
          <section className="product-stage editorial-rule">
            <div className="stage-label">
              <p className="editorial-kicker">03 / The selection</p>
              <span>Featured Catalogue</span>
            </div>
            <div className="product-stage-intro">
              <h2 className="section-title">Selected for<br />professional use.</h2>
              <p className="body-copy max-w-sm">
                A curated selection of our most requested professional products, 
                maintained with real-time stock levels and wholesale pricing.
              </p>
            </div>
            <ProductGrid products={featured.products} />
          </section>

          {/* Professional World Highlight */}
          {professionalWorlds.length > 0 && (
            <section className="professional-stage mt-24">
              <div className="flex flex-col h-full justify-between">
                <p className="editorial-kicker">04 / Salon Worlds</p>
                <h2 className="section-title">Professional<br />Specialization.</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {professionalWorlds.map(world => (
                  <div key={world} className="border-b border-charcoal/10 py-3 text-xs font-bold uppercase tracking-widest text-charcoal">
                    {world}
                  </div>
                ))}
              </div>
              <div className="body-copy">
                We specialize in comprehensive salon setups and refills. From high-tech machinery 
                to basic consumables, we ensure your professional space is always ready.
              </div>
            </section>
          )}

          {/* New Arrivals */}
          <section className="product-stage editorial-rule mt-24">
            <div className="stage-label">
              <p className="editorial-kicker">05 / Fresh Arrivals</p>
              <span>Just Added</span>
            </div>
            <div className="new-arrivals-copy">
              <h2 className="section-title">New to the<br />cabinet.</h2>
              <Link href="/products?sort=newest" className="section-link inline-flex items-center gap-2">
                View new arrivals <ArrowUpRight size={15} />
              </Link>
            </div>
            <ProductGrid products={newArrivals.products} />
          </section>

          {/* Catalogue CTA */}
          <section className="catalogue-invite mt-24">
            <div>
              <p className="editorial-kicker !text-rust">Ready to order?</p>
              <h2>Access the complete<br />wholesale catalogue.</h2>
            </div>
            <div className="flex flex-col items-end gap-8">
              <p className="body-copy !text-rose-soft max-w-xs text-right">
                Log in to view your professional pricing, track orders, and manage 
                your wholesale account with Taneja Enterprises.
              </p>
              <Link href="/products" className="editorial-button !bg-rust !border-rust hover:!bg-rust-deep transition-colors">
                Browse all products
              </Link>
            </div>
          </section>

          {/* Contact Section */}
          <section className="contact-stage editorial-rule mt-24">
            <div className="stage-label">
              <p className="editorial-kicker">06 / Contact</p>
              <span>Get in touch</span>
            </div>
            <h2 className="section-title">Let&apos;s talk business.</h2>
            <div className="contact-details">
              <div>
                <p className="footer-label mb-4">Location</p>
                <p>SCO 15 Basement, Sector 17,<br />Kurukshetra, Haryana 136118</p>
              </div>
              <div>
                <p className="footer-label mb-4">Phone</p>
                <a href="tel:9050150901" className="block text-xl font-medium">9050150901</a>
                <a href="tel:9050950901" className="block text-xl font-medium">9050950901</a>
              </div>
              <div>
                <p className="footer-label mb-4">Inquiries</p>
                <Link href="/account" className="section-link inline-flex items-center gap-2">
                  Open a business account <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <StorefrontFooter />
    </>
  );
}
