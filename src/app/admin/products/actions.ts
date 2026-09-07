"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteProductImagesByProduct,
  ensureAdminAccess,
  parseProductFormData,
  uploadProductImages,
  validateProductPayload,
} from "@/lib/supabase/products";
import { adjustInventoryStock } from "@/lib/supabase/inventory";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createProductAction(formData: FormData) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();
  const payload = parseProductFormData(formData);
  validateProductPayload(payload);

  const { data: product, error } = await supabase
    .from("products")
    .insert([
      {
        ...payload,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await uploadProductImages(product.id, formData);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(formData: FormData) {
  await ensureAdminAccess();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Product id is required.");
  }

  const supabase = await createServerSupabaseClient();
  const payload = parseProductFormData(formData);
  validateProductPayload(payload);

  const { stock_quantity: requestedStockQuantity, ...productFields } = payload;
  const { data: existingProduct, error: existingProductError } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", id)
    .maybeSingle();

  if (existingProductError || !existingProduct) {
    throw new Error(existingProductError?.message ?? "Product not found.");
  }

  const { error } = await supabase
    .from("products")
    .update({
      ...productFields,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  if (Number(existingProduct.stock_quantity) !== requestedStockQuantity) {
    await adjustInventoryStock({
      productId: id,
      operation: "set",
      quantity: requestedStockQuantity,
      reason: "Stock updated from product management.",
    });
  }

  await uploadProductImages(id, formData);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  redirect("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  await ensureAdminAccess();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Product id is required.");
  }

  const supabase = await createServerSupabaseClient();
  await deleteProductImagesByProduct(id);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function toggleProductPublishedAction(formData: FormData) {
  await ensureAdminAccess();
  const id = String(formData.get("id") ?? "").trim();
  const isPublished = String(formData.get("is_published") ?? "false") === "true";

  if (!id) {
    throw new Error("Product id is required.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("products")
    .update({
      is_published: isPublished,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}
