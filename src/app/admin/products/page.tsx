import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteProductAction, toggleProductPublishedAction } from "@/app/admin/products/actions";
import { ensureAdminAccess, getProductsForAdmin } from "@/lib/supabase/products";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    stock?: string;
    published?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  await ensureAdminAccess();

  const page = Number(params.page ?? "1");
  const { products, categoryOptions, totalCount, pageSize } = await getProductsForAdmin({
    query: params.q,
    category: params.category,
    stockStatus: params.stock,
    published: params.published,
    sort: params.sort,
    page,
    pageSize: 20,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Taneja
            </p>
            <h2 className="mt-2 text-xl font-black">Admin</h2>
          </div>

          <nav className="space-y-2 text-sm font-medium text-slate-600">
            <Link href="/admin" className="block rounded-xl px-3 py-2 hover:bg-slate-100">
              Overview
            </Link>
            <Link href="/admin/products" className="block rounded-xl bg-slate-900 px-3 py-2 text-white">
              Products
            </Link>
            <Link href="/admin/categories" className="block rounded-xl px-3 py-2 hover:bg-slate-100">
              Categories
            </Link>
            <Link href="/admin/inventory" className="block rounded-xl px-3 py-2 hover:bg-slate-100">
              Inventory
            </Link>
          </nav>
        </aside>

        <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Catalog</p>
              <h1 className="mt-1 text-3xl font-black">Products</h1>
            </div>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center rounded-xl bg-[#172d27] px-4 py-2.5 text-sm font-bold text-white"
            >
              + Add product
            </Link>
          </div>

          <form method="get" className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search products, SKU, brand"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
            <select
              name="category"
              defaultValue={params.category ?? ""}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            >
              <option value="">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              name="published"
              defaultValue={params.published ?? ""}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            >
              <option value="">All visibility</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              name="stock"
              defaultValue={params.stock ?? ""}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            >
              <option value="">All stock</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
            <select
              name="sort"
              defaultValue={params.sort ?? "newest"}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="stock">Stock</option>
            </select>
            <div className="xl:col-span-5 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
              >
                Apply filters
              </button>
              <Link
                href="/admin/products"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
              >
                Reset
              </Link>
            </div>
          </form>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold">No products found</p>
              <p className="mt-2 text-sm text-slate-500">
                Adjust your filters or create your first product.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {products.map((product) => {
                  const primaryImage = product.product_images?.[0]?.image_url;

                  return (
                    <article
                      key={product.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row"
                    >
                      <div className="flex h-28 w-full max-w-[180px] items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 md:h-32">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>No image</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h2 className="text-xl font-bold">{product.name}</h2>
                            <p className="mt-1 text-sm text-slate-500">{product.brand || "Unbranded"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {product.is_published ? "Published" : "Draft"}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                product.stock_quantity > 10
                                  ? "bg-emerald-100 text-emerald-700"
                                  : product.stock_quantity > 0
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {product.stock_quantity > 0
                                ? product.stock_quantity > 10
                                  ? "In stock"
                                  : "Low stock"
                                : "Out of stock"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">SKU</p>
                            <p className="mt-1 font-semibold text-slate-900">{product.sku}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Category</p>
                            <p className="mt-1 font-semibold text-slate-900">{product.category}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">MRP</p>
                            <p className="mt-1 font-semibold text-slate-900">₹{product.mrp}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Selling</p>
                            <p className="mt-1 font-semibold text-slate-900">₹{product.selling_price}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Wholesale</p>
                            <p className="mt-1 font-semibold text-slate-900">₹{product.wholesale_price}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Stock</p>
                            <p className="mt-1 font-semibold text-slate-900">{product.stock_quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">MOQ</p>
                            <p className="mt-1 font-semibold text-slate-900">{product.minimum_order_quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Status</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {product.is_published ? "Visible" : "Hidden"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 md:w-36">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold"
                        >
                          Edit
                        </Link>

                        <form action={toggleProductPublishedAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="is_published" value={String(!product.is_published)} />
                          <button
                            type="submit"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                          >
                            {product.is_published ? "Unpublish" : "Publish"}
                          </button>
                        </form>

                        <form action={deleteProductAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <button
                            type="submit"
                            className="w-full rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
                <p>
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={{ pathname: "/admin/products", query: { ...params, page: String(Math.max(1, page - 1)) } }}
                    className={`rounded-xl border px-3 py-2 ${page <= 1 ? "pointer-events-none border-slate-200 text-slate-400" : "border-slate-300 bg-white"}`}
                  >
                    Prev
                  </Link>
                  <Link
                    href={{ pathname: "/admin/products", query: { ...params, page: String(Math.min(totalPages, page + 1)) } }}
                    className={`rounded-xl border px-3 py-2 ${page >= totalPages ? "pointer-events-none border-slate-200 text-slate-400" : "border-slate-300 bg-white"}`}
                  >
                    Next
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
