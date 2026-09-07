import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { redirect } from "next/navigation";
import { getCustomerOrders } from "@/lib/supabase/storefront";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront";

export default async function CustomerOrdersPage() {
  const orders = await getCustomerOrders();
  if (!orders) redirect("/login?next=/account/orders");
  return <><StorefrontHeader /><main className="page-wrap"><div className="account-layout"><nav className="account-nav"><p className="editorial-kicker mb-3">Your account</p><a href="/account">Overview</a><a href="/account/profile">Profile</a><a href="/account/addresses">Addresses</a><a href="/wishlist">Wishlist</a></nav><section className="account-main"><p className="editorial-kicker">Account / Orders</p><h1 className="mt-4">Your order<br />archive.</h1>{orders.length ? <div className="mt-10">{orders.map((order) => <Link key={order.id} href={`/account/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] py-5 hover:bg-[var(--rose-soft)]"><div><p className="font-[var(--font-display)] text-2xl text-[var(--plum)]">{order.order_number}</p><p className="mt-1 text-xs uppercase tracking-[.1em] text-[var(--muted)]">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(order.created_at))}</p></div><div className="flex items-center gap-7"><div className="text-right"><p className="font-bold text-[var(--plum)]">₹{Number(order.total ?? 0).toLocaleString("en-IN")}</p><p className="mt-1 text-xs uppercase tracking-[.08em] text-[var(--muted)]">{order.order_status} · {order.payment_status}</p></div><ArrowUpRight className="text-[var(--rose)]" size={20} /></div></Link>)}</div> : <div className="empty-state mt-10">No orders yet.<br /><Link href="/products" className="editorial-button mt-5">Browse products</Link></div>}</section></div></main><StorefrontFooter /></>;
}
