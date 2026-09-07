"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adjustInventoryStock } from "@/lib/supabase/inventory";

export async function adjustInventoryAction(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "").trim();
  const operationValue = String(formData.get("operation") ?? "");
  const operation = operationValue === "increase" || operationValue === "decrease" || operationValue === "set"
    ? operationValue
    : null;
  const quantity = Number(String(formData.get("quantity") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!productId || !operation) {
    throw new Error("A valid product and stock operation are required.");
  }

  await adjustInventoryStock({ productId, operation, quantity, reason });
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${productId}`);
  revalidatePath("/admin/products");
  redirect(`/admin/inventory/${productId}?updated=1`);
}
