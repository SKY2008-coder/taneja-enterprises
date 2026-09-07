"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteCategoryById,
  ensureCategoryHierarchySafe,
  parseCategoryFormData,
  reorderCategory,
  toggleCategoryActive,
  validateCategoryPayload,
} from "@/lib/supabase/categories";
import { ensureAdminAccess } from "@/lib/supabase/products";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createCategoryAction(formData: FormData) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();
  const payload = parseCategoryFormData(formData);
  validateCategoryPayload(payload);
  await ensureCategoryHierarchySafe(payload.parent_id);

  const { data: existing, error: existingError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", payload.slug)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    throw new Error("A category with this slug already exists.");
  }

  const { error } = await supabase.from("categories").insert([{ ...payload }]);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategoryAction(formData: FormData) {
  await ensureAdminAccess();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Category id is required.");
  }

  const supabase = await createServerSupabaseClient();
  const payload = parseCategoryFormData(formData);
  validateCategoryPayload(payload);
  await ensureCategoryHierarchySafe(payload.parent_id, id);

  const { data: existing, error: existingError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", payload.slug)
    .neq("id", id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    throw new Error("Another category already uses this slug.");
  }

  const { error } = await supabase.from("categories").update({ ...payload }).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${id}/edit`);
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await ensureAdminAccess();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Category id is required.");
  }

  await deleteCategoryById(id);
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function toggleCategoryActiveAction(formData: FormData) {
  await ensureAdminAccess();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Category id is required.");
  }

  await toggleCategoryActive(id);
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function reorderCategoryAction(formData: FormData) {
  await ensureAdminAccess();
  const id = String(formData.get("id") ?? "").trim();
  const direction = String(formData.get("direction") ?? "up") === "down" ? "down" : "up";

  if (!id) {
    throw new Error("Category id is required.");
  }

  await reorderCategory(id, direction);
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}
