import Link from "next/link";
import { ensureAdminAccess } from "@/lib/supabase/products";
import {
  getInventoryDashboard,
  getInventoryStatus,
  getInventoryStatusLabel,
} from "@/lib/supabase/inventory";

function statusClass(status: ReturnType<typeof getInventoryStatus>) {
  if (status === "out_of_stock") return "bg-rose-100 text-rose-700";
  if (status === "low_stock") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function formatUpdated(value?: string) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    status?: "in_stock" | "low_stock" | "out_of_stock";
    sort?: "stock" | "name" | "updated";
  }>;
}) {
  const params = (await searchParams) ?? {};
  await ensureAdminAccess();
  const dashboard = await getInventoryDashboard(params);

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Taneja</p>
            <h2 className="mt-2 text-xl font-black">Admin</h2>
          </div>
          <nav className="space-y-2 text-sm font-medium text-slate-600">
            <Link href="/admin" className="block rounded-xl px-3 py-2 hover:bg-slate-100">Overview</Link>
            <Link href="/admin/products" className="block rounded-xl px-3 py-2 hover:bg-slate-100">Products</Link>
            <Link href="/admin/categories" className="block rounded-xl px-3 py-2 hover:bg-slate-100">Categories</Link>
            <Link href="/admin/inventory" className="block rounded-xl bg-slate-900 px-3 py-2 text-white">Inventory</Link>
          </nav>
        </aside>

        <div className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Operations</p>
              <h1 className="mt-1 text-3xl font-black">Inventory</h1>
              <p className="mt-2 text-sm text-slate-500">Low stock is {dashboard.threshold} units or fewer, excluding zero stock.</p>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total products", dashboard.stats.total, "bg-slate-100 text-slate-900"],
              ["In stock", dashboard.stats.inStock, "bg-emerald-100 text-emerald-800"],
              ["Low stock", dashboard.stats.lowStock, "bg-amber-100 text-amber-800"],
              ["Out of stock", dashboard.stats.outOfStock, "bg-rose-100 text-rose-800"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className={`rounded-2xl p-4 ${color}`}>
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-2 text-3xl font-black">{value}</p>
              </div>
            ))}
          </div>

          <form method="get" className="mb-6 grid gap-3 md:grid-cols-4">
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search product name or SKU"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
            <select name="category" defaultValue={params.category ?? ""} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400">
              <option value="">All categories</option>
              {dashboard.categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select name="status" defaultValue={params.status ?? ""} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400">
              <option value="">All stock statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <select name="sort" defaultValue={params.sort ?? "updated"} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400">
              <option value="updated">Recently updated</option>
              <option value="stock">Stock quantity</option>
              <option value="name">Product name</option>
            </select>
            <div className="flex gap-3 md:col-span-4">
              <button type="submit" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">Apply filters</button>
              <Link href="/admin/inventory" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">Reset</Link>
            </div>
          </form>

          {dashboard.products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold">No inventory items found</p>
              <p className="mt-2 text-sm text-slate-500">Try changing the search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Current stock</th>
                    <th className="px-4 py-3">MOQ</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last updated</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dashboard.products.map((product) => {
                    const status = getInventoryStatus(product.stock_quantity, dashboard.threshold);
                    const image = product.product_images?.[0]?.image_url;
                    return (
                      <tr key={product.id} className="bg-white">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-[10px] font-semibold uppercase text-slate-400">
                              {image ? <img src={image} alt={product.name} className="h-full w-full object-cover" /> : "No image"}
                            </div>
                            <span className="font-bold text-slate-900">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-600">{product.sku}</td>
                        <td className="px-4 py-4 text-slate-600">{product.category || "Uncategorized"}</td>
                        <td className="px-4 py-4 font-black text-slate-900">{product.stock_quantity}</td>
                        <td className="px-4 py-4 text-slate-600">{product.minimum_order_quantity}</td>
                        <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}>{getInventoryStatusLabel(status)}</span></td>
                        <td className="px-4 py-4 text-slate-600">{formatUpdated(product.updated_at)}</td>
                        <td className="px-4 py-4"><Link href={`/admin/inventory/${product.id}`} className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold">Edit stock</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
