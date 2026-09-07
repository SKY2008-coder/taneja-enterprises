import Link from "next/link";
import { notFound } from "next/navigation";
import { InventoryAdjustmentForm } from "@/components/admin/inventory-adjustment-form";
import {
  getInventoryHistory,
  getInventoryProduct,
  getInventoryStatus,
  getInventoryStatusLabel,
  getLowStockThreshold,
} from "@/lib/supabase/inventory";
import { ensureAdminAccess } from "@/lib/supabase/products";

export default async function InventoryProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  await ensureAdminAccess();

  const product = await getInventoryProduct(id);
  if (!product) notFound();
  const history = await getInventoryHistory(id);
  const threshold = getLowStockThreshold();
  const status = getInventoryStatus(product.stock_quantity, threshold);

  return (
    <main className="min-h-screen bg-[#f6f7f5] px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Inventory</p>
            <h1 className="mt-1 text-3xl font-black">Edit stock</h1>
          </div>
          <Link href="/admin/inventory" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">Back to inventory</Link>
        </div>

        {query.updated === "1" ? <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Stock updated successfully.</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Product</p>
            <h2 className="mt-3 text-2xl font-black">{product.name}</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">SKU</dt><dd className="font-semibold">{product.sku}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Category</dt><dd className="font-semibold">{product.category || "Uncategorized"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Current stock</dt><dd className="font-black">{product.stock_quantity}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">MOQ</dt><dd className="font-semibold">{product.minimum_order_quantity}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Status</dt><dd className="font-semibold">{getInventoryStatusLabel(status)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Low-stock threshold</dt><dd className="font-semibold">{threshold}</dd></div>
            </dl>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Secure stock adjustment</p>
            <h2 className="mt-2 text-2xl font-black">Change quantity</h2>
            <p className="mt-2 text-sm text-slate-500">Every change is validated and recorded with the signed-in admin account.</p>
            <div className="mt-6"><InventoryAdjustmentForm productId={product.id} currentQuantity={product.stock_quantity} /></div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Audit</p>
              <h2 className="mt-1 text-2xl font-black">Stock history</h2>
            </div>
          </div>
          {history.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No stock changes have been recorded for this product.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[680px] w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Change</th><th className="px-3 py-3">Result</th><th className="px-3 py-3">Reason</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-3 py-3 text-slate-600">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.created_at))}</td>
                      <td className={`px-3 py-3 font-bold ${entry.quantity_change >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{entry.quantity_change >= 0 ? "+" : ""}{entry.quantity_change}</td>
                      <td className="px-3 py-3 font-semibold">{entry.previous_quantity} to {entry.new_quantity}</td>
                      <td className="px-3 py-3 text-slate-600">{entry.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
