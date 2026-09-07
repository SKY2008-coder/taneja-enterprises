import Link from "next/link";
import { addToCartAction, addWishlistAction } from "@/app/storefront-actions";
import type { ProductRecord } from "@/lib/supabase/products";

export function StorefrontHeader() {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4"><Link href="/" className="shrink-0 text-lg font-black tracking-tight">Taneja Enterprises</Link><nav className="hidden gap-5 text-sm font-semibold text-slate-600 md:flex"><Link href="/categories">Categories</Link><Link href="/products">Products</Link><Link href="/search">Search</Link></nav><div className="ml-auto flex items-center gap-3 text-sm font-semibold"><Link href="/wishlist" aria-label="Wishlist">Wishlist</Link><Link href="/cart" aria-label="Cart">Cart</Link><Link href="/account" aria-label="Account">Account</Link></div></div></header>;
}

export function ProductCard({ product }: { product: ProductRecord }) {
  const image = product.product_images?.[0]?.image_url;
  const discount = Number(product.discount ?? 0);
  return <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3"><Link href={`/product/${product.slug}`} className="block"><div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xs text-slate-400">{image ? <img src={image} alt={product.name} className="h-full w-full object-cover" /> : "No image"}</div><h2 className="mt-3 font-bold text-slate-900">{product.name}</h2><p className="mt-1 text-sm text-slate-500">{product.brand || "Taneja Enterprises"}</p></Link><div className="mt-3 flex items-baseline gap-2"><span className="font-black">₹{Number(product.selling_price).toLocaleString("en-IN")}</span>{Number(product.mrp) > Number(product.selling_price) ? <del className="text-sm text-slate-400">₹{Number(product.mrp).toLocaleString("en-IN")}</del> : null}</div><p className="mt-1 text-xs text-slate-500">{product.stock_quantity > 0 ? `${discount > 0 ? `${discount}% off · ` : ""}In stock` : "Out of stock"}</p><div className="mt-auto flex gap-2 pt-4"><form action={addToCartAction} className="flex-1"><input type="hidden" name="product_id" value={product.id} /><input type="hidden" name="quantity" value={Math.max(1, Number(product.minimum_order_quantity ?? 1))} /><button disabled={product.stock_quantity <= 0} className="w-full rounded-xl bg-[#172d27] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Add to cart</button></form><form action={addWishlistAction}><input type="hidden" name="product_id" value={product.id} /><button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold" aria-label={`Add ${product.name} to wishlist`}>♡</button></form></div></article>;
}

export function ProductGrid({ products }: { products: ProductRecord[] }) {
  if (!products.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">No products are available for this selection.</div>;
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
