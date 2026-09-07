import Link from "next/link";
import { ensureAdminAccess } from "@/lib/supabase/products";
import {
  deleteCategoryAction,
  reorderCategoryAction,
  toggleCategoryActiveAction,
} from "@/app/admin/categories/actions";
import { getCategoriesForAdmin } from "@/lib/supabase/categories";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  await ensureAdminAccess();

  const categories = await getCategoriesForAdmin({
    query: params.q,
    status: params.status === "active" || params.status === "inactive" ? params.status : "all",
  });

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Taneja</p>
            <h2 className="mt-2 text-xl font-black">Admin</h2>
          </div>

          <nav className="space-y-2 text-sm font-medium text-slate-600">
            <Link href="/admin" className="block rounded-xl px-3 py-2 hover:bg-slate-100">
              Overview
            </Link>
            <Link href="/admin/products" className="block rounded-xl px-3 py-2 hover:bg-slate-100">
              Products
            </Link>
            <Link href="/admin/categories" className="block rounded-xl bg-slate-900 px-3 py-2 text-white">
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
              <h1 className="mt-1 text-3xl font-black">Categories</h1>
            </div>
            <Link
              href="/admin/categories/new"
              className="inline-flex items-center justify-center rounded-xl bg-[#172d27] px-4 py-2.5 text-sm font-bold text-white"
            >
              + Add category
            </Link>
          </div>

          <form method="get" className="mb-6 grid gap-3 md:grid-cols-3">
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search categories"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
            <select
              name="status"
              defaultValue={params.status ?? "all"}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
              >
                Apply
              </button>
              <Link
                href="/admin/categories"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
              >
                Reset
              </Link>
            </div>
          </form>

          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold">No categories found</p>
              <p className="mt-2 text-sm text-slate-500">Create your first category to organize products.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <article
                  key={category.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black">{category.name}</h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          category.is_active === false
                            ? "bg-slate-200 text-slate-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {category.is_active === false ? "Inactive" : "Active"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">Slug: {category.slug}</p>
                    {category.description ? (
                      <p className="text-sm text-slate-600">{category.description}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <form action={reorderCategoryAction} className="inline-flex gap-2">
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">
                        ↑
                      </button>
                    </form>

                    <form action={reorderCategoryAction} className="inline-flex gap-2">
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">
                        ↓
                      </button>
                    </form>

                    <form action={toggleCategoryActiveAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                      >
                        {category.is_active === false ? "Activate" : "Deactivate"}
                      </button>
                    </form>

                    <Link
                      href={`/admin/categories/${category.id}/edit`}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                    >
                      Edit
                    </Link>

                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <button
                        type="submit"
                        className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
