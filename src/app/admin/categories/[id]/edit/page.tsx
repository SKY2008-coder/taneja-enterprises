import { notFound } from "next/navigation";
import { updateCategoryAction } from "@/app/admin/categories/actions";
import { getCategoriesForAdmin, getCategoryById } from "@/lib/supabase/categories";
import { ensureAdminAccess } from "@/lib/supabase/products";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureAdminAccess();

  const category = await getCategoryById(id);
  const parentOptions = await getCategoriesForAdmin({ status: "all" });

  if (!category) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Catalog</p>
            <h1 className="mt-1 text-3xl font-black">Edit category</h1>
          </div>
          <a href="/admin/categories" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">
            Back to categories
          </a>
        </div>

        <form action={updateCategoryAction} className="grid gap-5">
          <input type="hidden" name="id" value={category.id} />

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Category name</label>
            <input name="name" required defaultValue={category.name} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Slug</label>
            <input name="slug" defaultValue={category.slug ?? ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Parent category</label>
            <select name="parent_id" defaultValue={category.parent_id ?? ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400">
              <option value="">None (top-level)</option>
              {parentOptions
                .filter((option) => option.id !== category.id)
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Sort order</label>
            <input type="number" min="0" name="sort_order" defaultValue={category.sort_order ?? 0} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea name="description" rows={4} defaultValue={category.description ?? ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_active" defaultChecked={category.is_active !== false} className="h-4 w-4" />
            <label className="text-sm font-medium text-slate-700">Active</label>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="rounded-xl bg-[#172d27] px-5 py-3 text-sm font-bold text-white">
              Update category
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
