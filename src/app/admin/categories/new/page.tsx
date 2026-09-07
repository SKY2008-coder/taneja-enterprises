import { createCategoryAction } from "@/app/admin/categories/actions";
import { ensureAdminAccess } from "@/lib/supabase/products";
import { getCategoriesForAdmin } from "@/lib/supabase/categories";

export default async function NewCategoryPage() {
  await ensureAdminAccess();
  const parentOptions = await getCategoriesForAdmin({ status: "all" });

  return (
    <main className="min-h-screen bg-[#f6f7f5] px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Catalog</p>
            <h1 className="mt-1 text-3xl font-black">Add category</h1>
          </div>
          <a href="/admin/categories" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">
            Back to categories
          </a>
        </div>

        <form action={createCategoryAction} className="grid gap-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Category name</label>
            <input name="name" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Slug</label>
            <input name="slug" placeholder="lighting" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Parent category</label>
            <select name="parent_id" defaultValue="" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400">
              <option value="">None (top-level)</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Sort order</label>
            <input type="number" min="0" name="sort_order" defaultValue={0} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea name="description" rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4" />
            <label className="text-sm font-medium text-slate-700">Active</label>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="rounded-xl bg-[#172d27] px-5 py-3 text-sm font-bold text-white">
              Save category
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
