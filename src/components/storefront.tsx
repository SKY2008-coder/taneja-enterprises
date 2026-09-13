import Link from "next/link";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { addToCartAction, addWishlistAction } from "@/app/storefront-actions";
import type { ProductRecord } from "@/lib/supabase/products";
import { getCart } from "@/lib/supabase/storefront";
import { MobileStorefrontMenu } from "@/components/mobile-storefront-menu";

export async function StorefrontHeader() {
  const cart = await getCart();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/" className="site-brand-link">Taneja Enterprises</Link>
          <Link href="/products">Catalogue</Link>
          <Link href="/categories">Categories</Link>
        </nav>
        <div className="site-header-note">Taneja Enterprises · Professional Beauty</div>
        <div className="site-tools">
          <Link href="/search" className="tool-link" aria-label="Search">
            <Search size={15} strokeWidth={1.5} />
            <span className="tool-label">Search</span>
          </Link>
          <Link href="/wishlist" className="tool-link" aria-label="Wishlist">
            <Heart size={15} strokeWidth={1.5} />
            <span className="tool-label">Wishlist</span>
          </Link>
          <Link href="/cart" className="tool-link" aria-label={`Cart with ${cart.items.length} items`}>
            <ShoppingBag size={15} strokeWidth={1.5} />
            <span className="tool-label">Cart</span>
            {cart.items.length > 0 && <span className="cart-count">{cart.items.length}</span>}
          </Link>
          <Link href="/account" className="tool-link" aria-label="Account">
            <UserRound size={15} strokeWidth={1.5} />
            <span className="tool-label">Account</span>
          </Link>
          <MobileStorefrontMenu />
        </div>
      </div>
    </header>
  );
}

export function ProductCard({ product }: { product: ProductRecord }) {
  const image = product.product_images?.[0]?.image_url;
  const discount = Number(product.discount ?? 0);
  const minimum = Math.max(1, Number(product.minimum_order_quantity ?? 1));
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <article className="product-card group">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="product-image">
          {image ? (
            <img src={image} alt={product.name} className="group-hover:scale-105" />
          ) : (
            <span className="product-image-placeholder">No image</span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-ivory/60 backdrop-blur-[2px]">
              <span className="category-index !text-charcoal opacity-70">Sold out</span>
            </div>
          )}
        </div>
        <div className="product-card-meta">
          <div>
            <p className="product-brand">{product.brand || "Taneja Enterprises"}</p>
            <h2 className="mt-1">{product.name}</h2>
          </div>
          <p className="editorial-kicker text-[10px] opacity-50">{product.category}</p>
        </div>
        <div className="product-price">
          <span>₹{Number(product.selling_price).toLocaleString("en-IN")}</span>
          {Number(product.mrp) > Number(product.selling_price) && (
            <del className="ml-2 text-[10px] font-normal opacity-40">
              ₹{Number(product.mrp).toLocaleString("en-IN")}
            </del>
          )}
        </div>
      </Link>
      
      <div className="mt-4 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
          {isOutOfStock ? "Unavailable" : `MOQ ${minimum} ${discount > 0 ? `· ${discount}% OFF` : ""}`}
        </p>
      </div>

      <div className="product-actions mt-4">
        <form action={addToCartAction} className="flex-1">
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="quantity" value={minimum} />
          <button 
            disabled={isOutOfStock}
            className="w-full !bg-charcoal !text-white hover:!bg-rust transition-colors py-2 text-[10px] font-bold uppercase tracking-widest"
          >
            Add to cart
          </button>
        </form>
        <form action={addWishlistAction}>
          <input type="hidden" name="product_id" value={product.id} />
          <button 
            aria-label={`Add ${product.name} to wishlist`}
            className="p-2 border border-line hover:border-rust transition-colors"
          >
            <Heart size={14} strokeWidth={1.5} />
          </button>
        </form>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductRecord[] }) {
  if (!products.length) return <div className="empty-state">No products are available for this selection.</div>;
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}

export function StorefrontFooter() {
  return <footer className="site-footer"><div className="site-footer-inner"><div className="footer-grid"><div className="footer-brand">Taneja<br />Enterprises</div><div><p className="footer-label">Explore</p><nav className="footer-links"><Link href="/products">Shop</Link><Link href="/categories">Categories</Link><Link href="/search">Search catalogue</Link><Link href="/wishlist">Wishlist</Link><Link href="/cart">Cart</Link></nav></div><div><p className="footer-label">Visit us</p><div className="footer-links"><p>SCO 15 Basement,<br />Sector 17,<br />Kurukshetra,<br />Haryana 136118</p><a href="tel:9050150901">9050150901</a><a href="tel:9050950901">9050950901</a><Link href="/account">Account</Link></div></div></div><div className="footer-bottom"><span>Wholesale beauty & professional salon supplies</span><span>© Taneja Enterprises</span></div></div></footer>;
}
