import Link from "next/link";
import { redirect } from "next/navigation";
import { getAddresses, getCart, getCheckoutSettings, getProfile } from "@/lib/supabase/storefront";
import { StorefrontHeader } from "@/components/storefront";
import { CheckoutForm } from "@/components/checkout-form";
import { buyNowAction } from "@/app/storefront-actions";
export default async function CheckoutPage({ searchParams }: { searchParams?: Promise<{ product?: string; quantity?: string }> }) {
	const params = (await searchParams) ?? {};
	const [cart, addresses, account, settings] = await Promise.all([getCart(), getAddresses(), getProfile(), getCheckoutSettings()]);
	if (!addresses || !account) redirect("/login?next=/checkout");
	return <><StorefrontHeader /><main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6"><p className="text-sm text-slate-500">Final review</p><h1 className="mt-1 text-3xl font-black">Checkout</h1>{cart.items.length ? <CheckoutForm items={cart.items} addresses={addresses} profile={account.profile} email={account.user.email ?? ""} couponCode={cart.couponCode ?? ""} /> : params.product ? <form action={buyNowAction} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><input type="hidden" name="product_id" value={params.product} /><input type="hidden" name="quantity" value={Math.max(1, Number(params.quantity ?? 1))} /><p className="font-semibold">Load this product into your cart to continue checkout.</p><button className="mt-4 rounded-xl bg-[#172d27] px-5 py-3 text-sm font-bold text-white">Continue to checkout</button></form> : <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><p className="font-semibold">Your cart is empty.</p><a href="/products" className="mt-4 inline-block rounded-xl bg-[#172d27] px-5 py-3 text-sm font-bold text-white">Continue shopping</a></div>}</main></>;
}
