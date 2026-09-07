import { ensureAdminAccess } from "@/lib/supabase/products";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  created_at?: string;
  updated_at?: string;
  parent?: { id: string; name: string } | null;
  children?: CategoryRecord[];
};

export async function getCategoriesForAdmin(params?: {
  query?: string;
  status?: "active" | "inactive" | "all";
  parentId?: string;
}) {
  const supabase = await createServerSupabaseClient();

  let query = supabase.from("categories").select("*");

  const search = params?.query?.trim() ?? "";
  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (params?.parentId) {
    query = query.eq("parent_id", params.parentId);
  } else if (params?.parentId === "") {
    query = query.is("parent_id", null);
  }

  if (params?.status === "active") {
    query = query.eq("is_active", true);
  }
  if (params?.status === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data, error } = await query.order("sort_order", { ascending: true }).order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CategoryRecord[];
}

export async function getCategoryById(id: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as CategoryRecord | null;
}

export async function getCategoryOptions() {
  const categories = await getCategoriesForAdmin();
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));
}

export function normalizeCategorySlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "category";
}

export function parseCategoryFormData(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "").trim();
  const sortOrder = Number(String(formData.get("sort_order") ?? "0"));
  const isActive = String(formData.get("is_active") ?? "") === "on";

  return {
    name,
    slug: slug || normalizeCategorySlug(name),
    description: description || null,
    parent_id: parentId || null,
    sort_order: Number.isFinite(sortOrder) ? Math.max(0, Math.floor(sortOrder)) : 0,
    is_active: isActive,
  };
}

export function validateCategoryPayload(payload: ReturnType<typeof parseCategoryFormData>) {
  if (!payload.name || !payload.name.trim()) {
    throw new Error("Category name is required.");
  }

  if (!payload.slug || !payload.slug.trim()) {
    throw new Error("Category slug is required.");
  }
}

export async function ensureCategoryHierarchySafe(parentId: string | null, currentCategoryId?: string) {
  if (!parentId) {
    return;
  }

  if (currentCategoryId && parentId === currentCategoryId) {
    throw new Error("A category cannot be its own parent.");
  }

  const supabase = await createServerSupabaseClient();
  const { data: parent, error } = await supabase
    .from("categories")
    .select("id, parent_id")
    .eq("id", parentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!parent) {
    throw new Error("Selected parent category was not found.");
  }

  if (currentCategoryId && parent.id === currentCategoryId) {
    throw new Error("A category cannot be its own parent.");
  }

  if (currentCategoryId && parent.parent_id === currentCategoryId) {
    throw new Error("A category cannot be assigned to a child of itself.");
  }
}

export async function canDeleteCategory(categoryId: string) {
  const supabase = await createServerSupabaseClient();

  const { count: childCount, error: childError } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", categoryId);

  if (childError) {
    throw new Error(childError.message);
  }

  let productMatchCount = 0;

  const { count: textCategoryMatchCount, error: textError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category", (await getCategoryById(categoryId))?.name ?? "");

  if (!textError && textCategoryMatchCount) {
    productMatchCount += textCategoryMatchCount;
  }

  if (productMatchCount === 0) {
    const { count: categoryIdMatchCount, error: idError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId);

    if (!idError && categoryIdMatchCount) {
      productMatchCount += categoryIdMatchCount;
    }
  }

  return {
    canDelete: !childCount && productMatchCount === 0,
    childCount: childCount ?? 0,
    productMatchCount,
  };
}

export async function deleteCategoryById(categoryId: string) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();

  const { canDelete, childCount, productMatchCount } = await canDeleteCategory(categoryId);
  if (!canDelete) {
    throw new Error(
      childCount > 0 || productMatchCount > 0
        ? "This category cannot be deleted because it is still used by subcategories or products."
        : "This category cannot be deleted."
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function reorderCategory(categoryId: string, direction: "up" | "down") {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();

  const { data: current, error: currentError } = await supabase
    .from("categories")
    .select("id, sort_order")
    .eq("id", categoryId)
    .maybeSingle();

  if (currentError || !current) {
    throw new Error(currentError?.message ?? "Category not found.");
  }

  const targetSortOrder = Number(current.sort_order ?? 0);
  const { data: siblingCategories, error: siblingError } = await supabase
    .from("categories")
    .select("id, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (siblingError) {
    throw new Error(siblingError.message);
  }

  const ordered = (siblingCategories ?? []).filter((category) => category.id !== categoryId);
  const currentIndex = (siblingCategories ?? []).findIndex((category) => category.id === categoryId);

  if (currentIndex === -1) {
    return;
  }

  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (swapIndex < 0 || swapIndex >= (siblingCategories ?? []).length) {
    return;
  }

  const swapTarget = (siblingCategories ?? [])[swapIndex];
  if (!swapTarget) {
    return;
  }

  const nextCurrent = Number(swapTarget.sort_order ?? 0);
  const nextTarget = Number(current.sort_order ?? 0);

  await supabase
    .from("categories")
    .update({ sort_order: nextCurrent })
    .eq("id", categoryId);

  await supabase
    .from("categories")
    .update({ sort_order: nextTarget })
    .eq("id", swapTarget.id);
}

export async function toggleCategoryActive(categoryId: string) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();

  const { data: category, error } = await supabase
    .from("categories")
    .select("id, is_active")
    .eq("id", categoryId)
    .maybeSingle();

  if (error || !category) {
    throw new Error(error?.message ?? "Category not found.");
  }

  const { error: updateError } = await supabase
    .from("categories")
    .update({ is_active: !Boolean(category.is_active) })
    .eq("id", categoryId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
