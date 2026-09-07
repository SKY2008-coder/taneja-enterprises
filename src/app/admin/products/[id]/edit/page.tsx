import { notFound } from "next/navigation";
import { updateProductAction } from "@/app/admin/products/actions";
import { ensureAdminAccess, formatSpecifications, getCategoriesForAdmin, getProductById } from "@/lib/supabase/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureAdminAccess();
  const product = await getProductById(id);
  const categories = await getCategoriesForAdmin();

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Catalog</p>
            <h1 className="mt-1 text-3xl font-black">Edit product</h1>
          </div>
          <a href="/admin/products" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">
            Back to products
          </a>
        </div>

        <form action={updateProductAction} className="grid gap-5 md:grid-cols-2" encType="multipart/form-data">
          <input type="hidden" name="id" value={product.id} />

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Product name</label>
            <input name="name" required defaultValue={product.name} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Slug</label>
            <input name="slug" defaultValue={product.slug ?? ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Brand</label>
            <input name="brand" defaultValue={product.brand ?? ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <select name="category" defaultValue={product.category ?? "Uncategorized"} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400">
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
            <input name="subcategory" defaultValue={product.subcategory ?? ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">SKU</label>
            <input name="sku" required defaultValue={product.sku} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Stock quantity</label>
            <input type="number" min="0" name="stock_quantity" defaultValue={product.stock_quantity} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">MRP</label>
            <input type="number" step="0.01" min="0" name="mrp" required defaultValue={product.mrp} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Selling price</label>
            <input type="number" step="0.01" min="0" name="selling_price" required defaultValue={product.selling_price} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Wholesale price</label>
            <input type="number" step="0.01" min="0" name="wholesale_price" defaultValue={product.wholesale_price} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Discount %</label>
            <input type="number" step="0.01" min="0" name="discount" defaultValue={product.discount} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">GST %</label>
            <input type="number" step="0.01" min="0" name="gst_percentage" defaultValue={product.gst_percentage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Minimum order qty</label>
            <input type="number" min="1" name="minimum_order_quantity" defaultValue={product.minimum_order_quantity} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea name="description" rows={5} defaultValue={product.description ?? ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Specifications</label>
            <textarea name="specifications" rows={5} defaultValue={formatSpecifications(product.specifications ?? {})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Product images</label>
            <input type="file" name="images" accept="image/*" multiple className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm" />
            {product.product_images && product.product_images.length > 0 ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                {product.product_images.map((image, index) => (
                  <div key={`${image.image_url}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img src={image.image_url} alt="Product preview" className="h-24 w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_featured" defaultChecked={product.is_featured} className="h-4 w-4" />
            <label className="text-sm font-medium text-slate-700">Featured</label>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_bestseller" defaultChecked={product.is_bestseller} className="h-4 w-4" />
            <label className="text-sm font-medium text-slate-700">Bestseller</label>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_new_arrival" defaultChecked={product.is_new_arrival} className="h-4 w-4" />
            <label className="text-sm font-medium text-slate-700">New arrival</label>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_published" defaultChecked={product.is_published} className="h-4 w-4" />
            <label className="text-sm font-medium text-slate-700">Published</label>
          </div>

          <div className="md:col-span-2 flex justify-end pt-2">
            <button type="submit" className="rounded-xl bg-[#172d27] px-5 py-3 text-sm font-bold text-white">
              Update product
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
