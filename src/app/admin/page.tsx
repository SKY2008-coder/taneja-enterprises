import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfileRole } from "@/lib/supabase/server";

export default async function AdminPage() {
  const { user, profile } = await getCurrentProfileRole();

  if (!user || !profile || profile.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-slate-900">
      <header className="border-b bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Taneja Enterprises</h1>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-sm text-gray-500">Admin access confirmed</p>
        <h2 className="mt-1 text-lg font-bold">{user.email}</h2>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/admin/products"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Catalog</p>
            <h3 className="mt-3 text-xl font-black">Products</h3>
            <p className="mt-2 text-sm text-slate-600">Manage inventory, pricing, status and product images.</p>
          </Link>

          <Link
            href="/admin/categories"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Catalog</p>
            <h3 className="mt-3 text-xl font-black">Categories</h3>
            <p className="mt-2 text-sm text-slate-600">Manage category structure, status, and ordering.</p>
          </Link>

          <Link
            href="/admin/inventory"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Operations</p>
            <h3 className="mt-3 text-xl font-black">Inventory</h3>
            <p className="mt-2 text-sm text-slate-600">Monitor stock levels and record secure stock changes.</p>
          </Link>

          <Link
            href="/admin/orders"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Operations</p>
            <h3 className="mt-3 text-xl font-black">Orders</h3>
            <p className="mt-2 text-sm text-slate-600">Review orders, payments, fulfillment, and internal notes.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
