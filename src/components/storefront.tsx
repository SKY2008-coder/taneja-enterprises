import Link from "next/link";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { addToCartAction, addWishlistAction } from "@/app/storefront-actions";
import type { ProductRecord } from "@/lib/supabase/products";
import { getCart } from "@/lib/supabase/storefront";
import { MobileStorefrontMenu } from "@/components/mobile-storefront-menu";

export async function StorefrontHeader() {
  const cart = await getCart();
  return <header className="site-header"><div className="site-header-inner"><Link href="/" className="brand-mark" aria-label="Taneja Enterprises home">Taneja<span>Wholesale beauty & salon supplies</span></Link><nav className="site-nav" aria-label="Primary navigation"><Link href="/categories">Categories</Link><Link href="/products">Shop</Link><Link href="/search">Search</Link></nav><div className="site-tools"><Link href="/search" className="tool-link" aria-label="Search"><Search size={16} /><span className="tool-label">Search</span></Link><Link href="/wishlist" className="tool-link" aria-label="Wishlist"><Heart size={16} /><span className="tool-label">Wishlist</span></Link><Link href="/cart" className="tool-link" aria-label={`Cart with ${cart.items.length} items`}><ShoppingBag size={16} /><span className="tool-label">Cart</span><span className="cart-count">{cart.items.length}</span></Link><Link href="/account" className="tool-link" aria-label="Account"><UserRound size={16} /><span className="tool-label">Account</span></Link><MobileStorefrontMenu /></div></div></header>;
}

export function ProductCard({ product }: { product: ProductRecord }) {
  const image = product.product_images?.[0]?.image_url;
  const discount = Number(product.discount ?? 0);
  const minimum = Math.max(1, Number(product.minimum_order_quantity ?? 1));
  return <article className="product-card"><Link href={`/product/${product.slug}`} className="block"><div className="product-image">{image ? <img src={image} alt={product.name} /> : <span className="product-image-placeholder">No image</span>}</div><div className="product-card-meta"><div><h2>{product.name}</h2><p className="product-brand">{product.brand || "Taneja Enterprises"}</p></div><span className="category-index">{product.stock_quantity > 0 ? "IN" : "OUT"}</span></div></Link><div className="product-price"><span>₹{Number(product.selling_price).toLocaleString("en-IN")}</span>{Number(product.mrp) > Number(product.selling_price) ? <del>₹{Number(product.mrp).toLocaleString("en-IN")}</del> : null}</div><p className="product-status">{product.stock_quantity > 0 ? `${discount > 0 ? `${discount}% off · ` : ""}MOQ ${minimum}` : "Currently unavailable"}</p><div className="product-actions"><form action={addToCartAction}><input type="hidden" name="product_id" value={product.id} /><input type="hidden" name="quantity" value={minimum} /><button disabled={product.stock_quantity <= 0}>Add to cart</button></form><form action={addWishlistAction}><input type="hidden" name="product_id" value={product.id} /><button aria-label={`Add ${product.name} to wishlist`}><Heart size={15} /></button></form></div></article>;
}

export function ProductGrid({ products }: { products: ProductRecord[] }) {
  if (!products.length) return <div className="empty-state">No products are available for this selection.</div>;
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}

export function StorefrontFooter() {
  return <footer className="site-footer"><div className="site-footer-inner"><div className="footer-grid"><div className="footer-brand">Taneja<br />Enterprises</div><div><p className="footer-label">Explore</p><nav className="footer-links"><Link href="/products">Shop</Link><Link href="/categories">Categories</Link><Link href="/search">Search catalogue</Link><Link href="/wishlist">Wishlist</Link><Link href="/cart">Cart</Link></nav></div><div><p className="footer-label">Visit us</p><div className="footer-links"><p>SCO 15 Basement,<br />Sector 17,<br />Kurukshetra,<br />Haryana 136118</p><a href="tel:9050150901">9050150901</a><a href="tel:9050950901">9050950901</a><Link href="/account">Account</Link></div></div></div><div className="footer-bottom"><span>Wholesale beauty & professional salon supplies</span><span>© Taneja Enterprises</span></div></div></footer>;
}
