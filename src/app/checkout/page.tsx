import { redirect } from "next/navigation";
import { getAddresses, getCart, getCheckoutSettings, getProfile } from "@/lib/supabase/storefront";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront";
import { CheckoutForm } from "@/components/checkout-form";
import { buyNowAction } from "@/app/storefront-actions";
export default async function CheckoutPage({ searchParams }: { searchParams?: Promise<{ product?: string; quantity?: string }> }) {
	const params = (await searchParams) ?? {};
	const [cart, addresses, account, settings] = await Promise.all([getCart(), getAddresses(), getProfile(), getCheckoutSettings()]);
	if (!addresses || !account) redirect("/login?next=/checkout");
	return <><StorefrontHeader /><main className="page-wrap"><div className="catalogue-heading"><div><p className="editorial-kicker">Checkout / 12</p><h1 className="display-title mt-5">Complete<br />your order.</h1></div></div>{cart.items.length ? <CheckoutForm items={cart.items} addresses={addresses} profile={account.profile} email={account.user.email ?? ""} couponCode={cart.couponCode ?? ""} deliveryCharge={settings.deliveryCharge} /> : params.product ? <form action={buyNowAction} className="editorial-panel mt-8 max-w-xl p-7"><p className="font-[var(--font-display)] text-3xl text-[var(--plum)]">Load this product into your selection.</p><input type="hidden" name="product_id" value={params.product} /><input type="hidden" name="quantity" value={Math.max(1, Number(params.quantity ?? 1))} /><button className="editorial-button mt-5">Continue to checkout</button></form> : <div className="empty-state"><p className="font-[var(--font-display)] text-3xl text-[var(--plum)]">Your cart is empty.</p><a href="/products" className="editorial-button mt-6">Continue shopping</a></div>}</main><StorefrontFooter /></>;
}
