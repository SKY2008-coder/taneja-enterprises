"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomerOrderAction } from "@/app/storefront-actions";

type Address = { id: string; full_name: string; phone: string; address_line1: string; address_line2?: string | null; city: string; state: string; pincode: string; is_default?: boolean };
type Item = { id: string; quantity: number; product?: { id: string; name: string; selling_price: number; gst_percentage?: number; product_images?: { image_url: string }[] } | null };
type Profile = { full_name?: string | null; phone?: string | null } | null;
type State = { error?: string; orderId?: string; orderNumber?: string };

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CheckoutForm({ items, addresses, profile, email, couponCode, deliveryCharge = 0 }: { items: Item[]; addresses: Address[]; profile: Profile; email: string; couponCode: string; deliveryCharge?: number }) {
  const router = useRouter();
  const [addressMode, setAddressMode] = useState(addresses.length ? "saved" : "new");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const submit = async (previous: State, formData: FormData): Promise<State> => {
    const result = await createCustomerOrderAction(previous, formData);
    if (result.orderId) router.push(`/account/orders/${result.orderId}?placed=1`);
    return result;
  };
  const [state, action, pending] = useActionState<State, FormData>(submit, {});
  const subtotal = items.reduce((sum, item) => sum + Number(item.product?.selling_price ?? 0) * item.quantity, 0);
  const tax = items.reduce((sum, item) => sum + Number(item.product?.selling_price ?? 0) * item.quantity * Number(item.product?.gst_percentage ?? 0) / 100, 0);

  return (
    <form action={action} className="commerce-layout">
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />
      <input type="hidden" name="address_mode" value={addressMode} />
      <div className="space-y-5">
        <section className="editorial-panel p-5 sm:p-7">
          <p className="editorial-kicker">01 / Customer</p>
          <h2 className="section-title mt-3 text-4xl">Your details.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="auth-field"><span>Full name</span><input value={profile?.full_name ?? ""} readOnly className="editorial-input" /></label>
            <label className="auth-field"><span>Mobile number</span><input value={profile?.phone ?? ""} readOnly className="editorial-input" /></label>
            <label className="auth-field sm:col-span-2"><span>Email</span><input value={email} readOnly className="editorial-input" /></label>
          </div>
        </section>
        <section className="editorial-panel p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="editorial-kicker">02 / Delivery</p><h2 className="section-title mt-3 text-4xl">Where to send it.</h2></div><button type="button" onClick={() => setAddressMode(addressMode === "new" ? "saved" : "new")} className="text-action">{addressMode === "new" ? "Use saved address" : "Add new address"}</button></div>
          {addressMode === "saved" ? <div className="mt-6 grid gap-3">{addresses.map((address, index) => <label key={address.id} className="flex cursor-pointer gap-3 border border-[var(--line)] p-4 has-[:checked]:border-[var(--plum)] has-[:checked]:bg-[var(--rose-soft)]"><input type="radio" name="address_id" value={address.id} defaultChecked={address.is_default || (!addresses.some((entry) => entry.is_default) && index === 0)} className="mt-1" /><span className="text-sm leading-6"><strong className="text-[var(--plum)]">{address.full_name}</strong> <span className="text-[var(--muted)]">· {address.phone}</span><br />{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ""}<br />{address.city}, {address.state} - {address.pincode}</span></label>)}</div> : <div className="mt-6 grid gap-3 sm:grid-cols-2"><label className="auth-field"><span>Full name</span><input required name="new_full_name" placeholder="Full name" className="editorial-input" /></label><label className="auth-field"><span>Mobile number</span><input required name="new_phone" placeholder="Mobile number" inputMode="tel" className="editorial-input" /></label><label className="auth-field sm:col-span-2"><span>Address</span><input required name="new_address_line1" placeholder="Address" className="editorial-input" /></label><label className="auth-field sm:col-span-2"><span>Apartment or landmark</span><input name="new_address_line2" placeholder="Optional" className="editorial-input" /></label><label className="auth-field"><span>City</span><input required name="new_city" placeholder="City" className="editorial-input" /></label><label className="auth-field"><span>State</span><input required name="new_state" placeholder="State" className="editorial-input" /></label><label className="auth-field"><span>PIN / Pincode</span><input required name="new_pincode" placeholder="PIN / Pincode" inputMode="numeric" pattern="[0-9]{6}" className="editorial-input" /></label></div>}
        </section>
        <section className="editorial-panel p-5 sm:p-7">
          <p className="editorial-kicker">03 / Payment</p>
          <h2 className="section-title mt-3 text-4xl">Choose how to pay.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><label className="flex cursor-pointer gap-3 border border-[var(--line)] p-4 has-[:checked]:border-[var(--plum)] has-[:checked]:bg-[var(--rose-soft)]"><input type="radio" name="payment_method" value="cod" defaultChecked /><span className="text-sm leading-6"><strong className="text-[var(--plum)]">Cash on Delivery</strong><br /><span className="text-[var(--muted)]">Pay when your order arrives.</span></span></label><label className="flex cursor-not-allowed gap-3 border border-[var(--line)] p-4 opacity-50"><input type="radio" name="payment_method" value="online" disabled /><span className="text-sm leading-6"><strong className="text-[var(--plum)]">Online Payment</strong><br /><span className="text-[var(--muted)]">Unavailable until payment gateway setup is complete.</span></span></label></div>
        </section>
      </div>
      <aside className="summary-panel lg:sticky lg:top-6">
        <p className="editorial-kicker">04 / Final review</p><h2 className="mt-3">Your order.</h2>
        <div className="mt-5 space-y-4">{items.map((item) => { const product = item.product; const image = product?.product_images?.[0]?.image_url; return <div key={item.id} className="flex gap-3 border-b border-[var(--line)] pb-4"><div className="commerce-thumb h-16 w-16">{image ? <img src={image} alt={product?.name ?? "Product"} /> : null}</div><div className="min-w-0 flex-1"><p className="font-[var(--font-display)] text-lg text-[var(--plum)]">{product?.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.quantity} × {money(Number(product?.selling_price ?? 0))}</p></div><strong className="text-sm text-[var(--plum)]">{money(Number(product?.selling_price ?? 0) * item.quantity)}</strong></div>; })}</div>
        <label className="auth-field mt-5" htmlFor="coupon_code"><span>Coupon code</span><input id="coupon_code" name="coupon_code" defaultValue={couponCode} placeholder="Optional" className="editorial-input" /></label>
        <div className="mt-4"><div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="summary-row"><span>Coupon</span><span>Validated at submission</span></div><div className="summary-row"><span>Delivery</span><span>{money(deliveryCharge)}</span></div><div className="summary-row"><span>GST / tax</span><span>{money(tax)}</span></div><div className="summary-total"><span>Pre-discount estimate</span><span>{money(subtotal + deliveryCharge + tax)}</span></div></div>
        {state.error ? <p role="alert" className="mt-4 border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="editorial-button mt-4 w-full">{pending ? "Placing order..." : "Confirm and place order"}</button>
        <p className="mt-3 text-center text-xs leading-5 text-[var(--muted)]">Final price, stock, tax, delivery and coupon rules are checked by the server before creation.</p>
      </aside>
    </form>
  );
}
