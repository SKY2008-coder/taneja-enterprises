import { notFound } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { addToCartAction, addWishlistAction, buyNowAction } from "@/app/storefront-actions";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid, StorefrontFooter, StorefrontHeader } from "@/components/storefront";
import { getProductReviews, getPublishedProductBySlug, getPublishedProducts } from "@/lib/supabase/storefront";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getPublishedProductBySlug((await params).slug);
  return { title: product?.name ?? "Product unavailable", description: product?.description ?? "Taneja Enterprises catalogue" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getPublishedProductBySlug((await params).slug);
  if (!product) notFound();

  const [reviews, related] = await Promise.all([
    getProductReviews(product.id),
    getPublishedProducts({ category: product.category, pageSize: 5 }),
  ]);

  const images = product.product_images ?? [];
  const minimum = Math.max(1, Number(product.minimum_order_quantity ?? 1));
  const isOutOfStock = product.stock_quantity <= 0;
  const productJsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description ?? undefined, image: images.map((item) => item.image_url), sku: product.sku, brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined, offers: { "@type": "Offer", priceCurrency: "INR", price: Number(product.selling_price), availability: isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" } };

  return (
    <>
      <StorefrontHeader />
      <main className="page-wrap">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
        <div className="detail-layout">
          <ProductGallery images={images} productName={product.name} />

          <div className="detail-info">
            <nav className="flex items-center gap-2 mb-8 text-[10px] font-bold uppercase tracking-widest text-muted">
              <Link href="/products" className="hover:text-rust">Catalogue</Link>
              <span>/</span>
              <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-rust">
                {product.category}
              </Link>
            </nav>

            <p className="editorial-kicker text-rust">{product.brand || "Taneja Enterprises"}</p>
            <h1 className="mt-4">{product.name}</h1>
            <p className="detail-sku mt-4 opacity-40">SKU / {product.sku}</p>

            <div className="detail-price mt-10">
              <span className="text-3xl font-bold">₹{Number(product.selling_price).toLocaleString("en-IN")}</span>
              {Number(product.mrp) > Number(product.selling_price) && (
                <del className="ml-4 text-lg opacity-30 font-normal">
                  ₹{Number(product.mrp).toLocaleString("en-IN")}
                </del>
              )}
            </div>

            <div className="mt-8 border-y border-line py-6">
              <p className="text-sm leading-relaxed text-muted">
                {isOutOfStock 
                  ? "This item is currently out of stock. Contact us for restock inquiries." 
                  : `Professional wholesale availability. Minimum order quantity for this product is ${minimum} units.`}
              </p>
            </div>

            {product.description && (
              <div className="mt-10">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-charcoal mb-4">Description</h2>
                <p className="body-copy !text-[15px] whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            <div className="detail-actions mt-12">
              <form action={addToCartAction} className="flex gap-4 w-full">
                <input type="hidden" name="product_id" value={product.id} />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold tracking-tighter mb-1 opacity-50">Quantity</span>
                  <input 
                    type="number" 
                    name="quantity" 
                    min={minimum} 
                    max={product.stock_quantity} 
                    defaultValue={minimum} 
                    className="w-20 border border-line p-3 text-center focus:border-rust outline-none bg-transparent"
                  />
                </div>
                <button 
                  disabled={isOutOfStock} 
                  className="flex-1 !bg-charcoal !text-white hover:!bg-rust transition-colors text-xs font-bold uppercase tracking-[.2em]"
                >
                  {isOutOfStock ? "Sold Out" : "Add to Cart"}
                </button>
              </form>
              
              <div className="flex gap-4 w-full mt-4">
                <form action={buyNowAction} className="flex-1">
                  <input type="hidden" name="product_id" value={product.id} />
                  <input type="hidden" name="quantity" value={minimum} />
                  <button 
                    disabled={isOutOfStock} 
                    className="w-full editorial-button editorial-button-light !border-line hover:!border-rust text-[10px]"
                  >
                    Direct Purchase
                  </button>
                </form>
                <form action={addWishlistAction}>
                  <input type="hidden" name="product_id" value={product.id} />
                  <button className="editorial-button editorial-button-light !border-line hover:!border-rust px-6">
                    <Heart size={18} strokeWidth={1.5} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-sections mt-20">
          <section className="detail-section">
            <h2>Specifications</h2>
            <div className="mt-6 space-y-3">
              {product.specifications ? (
                Object.entries(product.specifications as Record<string, string>).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-line/30 pb-2">
                    <span className="text-[11px] uppercase font-bold tracking-wider opacity-40">{key}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))
              ) : (
                <p className="opacity-40 italic">No specific details listed.</p>
              )}
              <div className="flex justify-between border-b border-line/30 pb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider opacity-40">GST</span>
                <span className="text-sm font-medium">{Number(product.gst_percentage ?? 0)}% Included</span>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h2>Logistics</h2>
            <p className="body-copy !text-sm !leading-relaxed mt-6">
              Standard wholesale delivery applies. Shipping timelines depend on order volume 
              and destination in Haryana or neighboring regions. 
              Bulk inquiries available for orders exceeding 5x MOQ.
            </p>
          </section>

          <section className="detail-section">
            <h2>Inquiries</h2>
            <p className="body-copy !text-sm !leading-relaxed mt-6">
              For professional consultations regarding this product or bulk pricing, 
              please contact Taneja Enterprises support at 9050150901.
            </p>
          </section>
        </div>

        {reviews.length > 0 ? (
          <section className="reviews-section editorial-rule mt-24 pt-10">
            <div className="section-head">
              <div>
                <p className="editorial-kicker">Customer notes</p>
                <h2 className="section-title mt-4">What professionals say.</h2>
              </div>
              <span className="catalogue-count">{reviews.length} reviews</span>
            </div>
            <div className="reviews-grid">
              {reviews.map((review, index) => {
                const record = review as Record<string, unknown>;
                const author = String(record.author_name ?? record.customer_name ?? record.name ?? "Verified customer");
                const content = String(record.comment ?? record.content ?? record.review ?? "").trim();
                const rating = Number(record.rating ?? 0);
                return <article key={String(record.id ?? index)} className="review-card"><div className="review-card-top"><span>{author}</span>{rating > 0 ? <span aria-label={`${rating} out of 5 stars`}>{"★".repeat(Math.min(5, rating))}</span> : null}</div>{record.title ? <h3>{String(record.title)}</h3> : null}{content ? <p>{content}</p> : null}</article>;
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-32">
          <div className="section-head">
            <h2 className="section-title">Similar Items</h2>
            <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="section-link">
              View Category
            </Link>
          </div>
          <ProductGrid products={related.products.filter((item) => item.id !== product.id).slice(0, 4)} />
        </section>
      </main>
      <StorefrontFooter />
    </>
  );
}
