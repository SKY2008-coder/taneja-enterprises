import Link from "next/link";
import { notFound } from "next/navigation";
import { addOrderNoteAction } from "@/app/admin/orders/actions";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import {
  formatMoney,
  getOrderById,
  getOrderHistory,
  getOrderItems,
  getOrderNotes,
  orderStatusLabel,
  paymentStatusLabel,
  type OrderStatus,
} from "@/lib/supabase/orders";
import { ensureAdminAccess } from "@/lib/supabase/products";

function addressValue(address: unknown, key: string) {
  if (!address) return "";
  if (typeof address === "string") return address;
  return String((address as Record<string, unknown>)[key] ?? "");
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ updated?: string; note?: string }>;
}) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  await ensureAdminAccess();
  const order = await getOrderById(id);
  if (!order) notFound();
  const [items, history, notes] = await Promise.all([getOrderItems(id), getOrderHistory(id), getOrderNotes(id)]);
  const shipping = order.shipping_address;
  const subtotal = order.subtotal ?? items.reduce((sum, item) => sum + Number(item.unit_price ?? 0) * Number(item.quantity ?? 0), 0);
  const discount = Number(order.discount ?? 0);
  const couponDiscount = Number(order.coupon_discount ?? 0);
  const deliveryCharge = Number(order.delivery_charge ?? 0);
  const tax = Number(order.tax ?? 0);

  return (
    <main className="min-h-screen bg-[#f6f7f5] px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-slate-500">Order management</p><h1 className="mt-1 text-3xl font-black">{order.order_number}</h1></div><Link href="/admin/orders" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">Back to orders</Link></div>
        {query.updated === "1" ? <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Order status updated successfully.</div> : null}
        {query.note === "added" ? <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Internal note added.</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Customer</p><h2 className="mt-2 text-xl font-black">{order.customer_name || "Customer"}</h2><p className="mt-1 text-sm text-slate-600">{order.customer_mobile || "No mobile recorded"} {order.customer_email ? `· ${order.customer_email}` : ""}</p></div><div className="text-right text-sm text-slate-500"><p>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at))}</p><p className="mt-1">{orderStatusLabel(order.order_status)} · {paymentStatusLabel(order.payment_status)}</p></div></div></section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Shipping</p><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div className="sm:col-span-2"><span className="text-slate-500">Address</span><p className="mt-1 font-semibold">{addressValue(shipping, "address_line1") || addressValue(shipping, "address") || "Not recorded"} {addressValue(shipping, "address_line2")}</p></div><div><span className="text-slate-500">City</span><p className="font-semibold">{addressValue(shipping, "city") || "-"}</p></div><div><span className="text-slate-500">State</span><p className="font-semibold">{addressValue(shipping, "state") || "-"}</p></div><div><span className="text-slate-500">PIN</span><p className="font-semibold">{addressValue(shipping, "pincode") || addressValue(shipping, "pin") || "-"}</p></div><div><span className="text-slate-500">Delivery details</span><p className="font-semibold">{addressValue(shipping, "delivery_details") || "-"}</p></div></div></section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Products</p><div className="mt-4 space-y-4">{items.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No order items recorded.</p> : items.map((item) => { const image = item.product_image || item.product?.product_images?.[0]?.image_url; const lineTotal = item.line_total ?? Number(item.unit_price) * Number(item.quantity); return <div key={item.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-[10px] text-slate-400">{image ? <img src={image} alt={item.product_name || item.product?.name || "Product"} className="h-full w-full object-cover" /> : "No image"}</div><div className="min-w-0 flex-1"><p className="font-bold">{item.product_name || item.product?.name || "Product"}</p><p className="text-xs text-slate-500">SKU: {item.sku || item.product?.sku || "-"} · Qty: {item.quantity}</p><p className="mt-1 text-sm text-slate-600">Unit {formatMoney(item.unit_price)} · Discount {formatMoney(item.discount)} · GST {formatMoney(item.gst_amount)}</p></div><p className="font-bold">{formatMoney(lineTotal)}</p></div>; })}</div></section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status workflow</p><h2 className="mt-2 text-xl font-black">{orderStatusLabel(order.order_status)}</h2><p className="mt-1 text-sm text-slate-500">Payment: {paymentStatusLabel(order.payment_status)}</p><div className="mt-5"><OrderStatusForm orderId={order.id} currentStatus={order.order_status} /></div></section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Summary</p><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd>{formatMoney(discount)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Coupon discount</dt><dd>{formatMoney(couponDiscount)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Delivery</dt><dd>{formatMoney(deliveryCharge)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Tax/GST</dt><dd>{formatMoney(tax)}</dd></div><div className="flex justify-between border-t border-slate-200 pt-3 text-base font-black"><dt>Grand total</dt><dd>{formatMoney(order.total)}</dd></div></dl></section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Payment</p><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Method</dt><dd className="font-semibold">{order.payment_method || "Not recorded"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Status</dt><dd className="font-semibold">{paymentStatusLabel(order.payment_status)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Reference</dt><dd className="font-semibold">{order.payment_reference || "Not recorded"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Invoice</dt><dd className="font-semibold">{order.invoice_number || "Pending"}</dd></div></dl></section>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Timeline</p><div className="mt-4 space-y-4">{history.length === 0 ? <p className="text-sm text-slate-500">No status history recorded yet.</p> : history.map((entry) => <div key={entry.id} className="border-l-2 border-slate-200 pl-4"><p className="font-semibold">{entry.previous_status ? `${orderStatusLabel(entry.previous_status as OrderStatus)} to ` : ""}{orderStatusLabel(entry.new_status)}</p><p className="text-xs text-slate-500">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.created_at))}</p>{entry.note ? <p className="mt-1 text-sm text-slate-600">{entry.note}</p> : null}</div>)}</div></section><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Internal notes</p><form action={addOrderNoteAction} className="mt-4 space-y-3"><input type="hidden" name="order_id" value={order.id} /><textarea required name="note" rows={4} placeholder="Only admins can see these notes" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /><button type="submit" className="rounded-xl bg-[#172d27] px-4 py-2.5 text-sm font-bold text-white">Add internal note</button></form><div className="mt-5 space-y-3">{notes.map((note) => <div key={note.id} className="rounded-xl bg-slate-50 p-3 text-sm"><p>{note.note}</p><p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(note.created_at))}</p></div>)}</div></section></div>
      </div>
    </main>
  );
}
