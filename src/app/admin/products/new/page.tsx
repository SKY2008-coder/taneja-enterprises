import { createProductAction } from "@/app/admin/products/actions";
import { ensureAdminAccess, getCategoriesForAdmin } from "@/lib/supabase/products";

export default async function NewProductPage() {
  await ensureAdminAccess();
  const categories = await getCategoriesForAdmin();

  return (
    <main className="min-h-screen bg-[#f6f7f5] px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Catalog</p>
            <h1 className="mt-1 text-3xl font-black">Add product</h1>
          </div>
          <a
            href="/admin/products"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            Back to products
          </a>
        </div>

        <form action={createProductAction} className="grid gap-5 md:grid-cols-2" encType="multipart/form-data">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Product name</label>
            <input name="name" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Slug</label>
            <input name="slug" placeholder="example-product" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Brand</label>
            <input name="brand" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <select name="category" defaultValue={categories[0]?.name ?? "Uncategorized"} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400">
              {categories.length === 0 ? <option value="Uncategorized">Uncategorized</option> : null}
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Subcategory</label>
            <input name="subcategory" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">SKU</label>
            <input name="sku" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Stock quantity</label>
            <input type="number" name="stock_quantity" min="0" defaultValue={0} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">MRP</label>
            <input type="number" step="0.01" min="0" name="mrp" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Selling price</label>
            <input type="number" step="0.01" min="0" name="selling_price" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Wholesale price</label>
            <input type="number" step="0.01" min="0" name="wholesale_price" defaultValue={0} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Discount %</label>
            <input type="number" step="0.01" min="0" name="discount" defaultValue={0} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">GST %</label>
            <input type="number" step="0.01" min="0" name="gst_percentage" defaultValue={0} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Minimum order qty</label>
            <input type="number" min="1" name="minimum_order_quantity" defaultValue={1} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea name="description" rows={5} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Specifications</label>
            <textarea name="specifications" rows={5} placeholder="Color: Blue&#10;Material: Cotton&#10;Weight: 400g" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Product images</label>
            <input type="file" name="images" accept="image/*" multiple className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm" />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_featured" className="h-4 w-4" />
            <label className="text-sm font-medium text-slate-700">Featured</label>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_bestseller" className="h-4 w-4" />
            <label className="text-sm font-medium text-slate-700">Bestseller</label>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_new_arrival" className="h-4 w-4" />
            <label className="text-sm font-medium text-slate-700">New arrival</label>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_published" defaultChecked className="h-4 w-4" />
            <label className="text-sm font-medium text-slate-700">Published</label>
          </div>

          <div className="md:col-span-2 flex justify-end pt-2">
            <button type="submit" className="rounded-xl bg-[#172d27] px-5 py-3 text-sm font-bold text-white">
              Save product
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
