"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addOrderNote,
  changeOrderStatus,
  type OrderStatus,
} from "@/lib/supabase/orders";

export async function changeOrderStatusAction(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "").trim();
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const note = String(formData.get("note") ?? "").trim();
  const confirmed = String(formData.get("confirmed") ?? "") === "true";

  if (!orderId) throw new Error("Order id is required.");
  if (["cancelled", "returned", "refunded"].includes(status) && !confirmed) {
    throw new Error("Confirmation is required for destructive order changes.");
  }

  await changeOrderStatus(orderId, status, note);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?updated=1`);
}

export async function addOrderNoteAction(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "").trim();
  const note = String(formData.get("note") ?? "");
  if (!orderId) throw new Error("Order id is required.");
  await addOrderNote(orderId, note);
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?note=added`);
}
