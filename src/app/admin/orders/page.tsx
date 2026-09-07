import Link from "next/link";
import { ensureAdminAccess } from "@/lib/supabase/products";
import {
  getOrdersForAdmin,
  orderStatusLabel,
  paymentStatusLabel,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type AdminOrder,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/supabase/orders";

function badgeClass(value: string) {
  if (["cancelled", "returned", "refunded", "failed"].includes(value)) return "bg-rose-100 text-rose-700";
  if (["new", "pending", "cod_pending"].includes(value)) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: OrderStatus; payment?: PaymentStatus; from?: string; to?: string; sort?: "newest" | "oldest"; page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  await ensureAdminAccess();
  const data = await getOrdersForAdmin({ query: params.q, orderStatus: params.status, paymentStatus: params.payment, from: params.from, to: params.to, sort: params.sort, page: Number(params.page ?? 1), pageSize: 20 });
  const statCards = [["Total", data.stats.total], ["New", data.stats.new], ["Confirmed", data.stats.confirmed], ["Processing", data.stats.processing], ["Packed", data.stats.packed], ["Shipped", data.stats.shipped], ["Delivered", data.stats.delivered], ["Cancelled", data.stats.cancelled], ["Returned", data.stats.returned], ["Refunded", data.stats.refunded], ["Pending payment", data.stats.pendingPayment], ["Paid", data.stats.paid]];

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Taneja</p><h2 className="mt-2 text-xl font-black">Admin</h2>
          <nav className="mt-6 space-y-2 text-sm font-medium text-slate-600"><Link href="/admin" className="block rounded-xl px-3 py-2 hover:bg-slate-100">Overview</Link><Link href="/admin/products" className="block rounded-xl px-3 py-2 hover:bg-slate-100">Products</Link><Link href="/admin/categories" className="block rounded-xl px-3 py-2 hover:bg-slate-100">Categories</Link><Link href="/admin/inventory" className="block rounded-xl px-3 py-2 hover:bg-slate-100">Inventory</Link><Link href="/admin/orders" className="block rounded-xl bg-slate-900 px-3 py-2 text-white">Orders</Link></nav>
        </aside>

        <div className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6"><p className="text-sm text-slate-500">Operations</p><h1 className="mt-1 text-3xl font-black">Orders</h1></div>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{statCards.map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-slate-100 p-4"><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}</div>

          <form method="get" className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Order, customer, mobile" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm xl:col-span-2" />
            <select name="status" defaultValue={params.status ?? ""} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">All order statuses</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}</select>
            <select name="payment" defaultValue={params.payment ?? ""} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">All payment statuses</option>{PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{paymentStatusLabel(status)}</option>)}</select>
            <input type="date" name="from" defaultValue={params.from ?? ""} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /><input type="date" name="to" defaultValue={params.to ?? ""} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            <select name="sort" defaultValue={params.sort ?? "newest"} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
            <div className="flex gap-3 xl:col-span-6"><button type="submit" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">Apply filters</button><Link href="/admin/orders" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">Reset</Link></div>
          </form>

          {data.orders.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center"><p className="text-lg font-semibold">No orders found</p><p className="mt-2 text-sm text-slate-500">Orders will appear here when the customer checkout flow creates them.</p></div> : <div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="min-w-[980px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-200">{data.orders.map((order) => <tr key={order.id}><td className="px-4 py-4 font-bold">{order.order_number}</td><td className="px-4 py-4"><p className="font-semibold">{order.customer_name || "Customer"}</p><p className="text-xs text-slate-500">{order.customer_mobile || order.customer_email || "No contact"}</p></td><td className="px-4 py-4 text-slate-600">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(order.created_at))}</td><td className="px-4 py-4 text-slate-600">{(order as AdminOrder & { itemCount: number }).itemCount}</td><td className="px-4 py-4 font-bold">₹{Number(order.total ?? 0).toLocaleString("en-IN")}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(order.payment_status)}`}>{paymentStatusLabel(order.payment_status)}</span></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(order.order_status)}`}>{orderStatusLabel(order.order_status)}</span></td><td className="px-4 py-4"><Link href={`/admin/orders/${order.id}`} className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold">View</Link></td></tr>)}</tbody></table></div>}

          {data.totalPages > 1 ? <div className="mt-5 flex justify-between text-sm"><span>Page {data.page} of {data.totalPages}</span><div className="flex gap-2"><Link href={{ pathname: "/admin/orders", query: { ...params, page: String(Math.max(1, data.page - 1)) } }} className="rounded-xl border border-slate-300 px-3 py-2">Previous</Link><Link href={{ pathname: "/admin/orders", query: { ...params, page: String(Math.min(data.totalPages, data.page + 1)) } }} className="rounded-xl border border-slate-300 px-3 py-2">Next</Link></div></div> : null}
        </div>
      </div>
    </main>
  );
}
