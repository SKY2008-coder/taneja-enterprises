"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireUser(next = "/cart") {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { supabase, user };
}

export async function createCustomerOrderAction(_previousState: { error?: string; orderId?: string; orderNumber?: string }, formData: FormData) {
  const { supabase } = await requireUser("/checkout");
  const addressId = String(formData.get("address_id") ?? "").trim();
  const addressMode = String(formData.get("address_mode") ?? "saved");
  const paymentMethod = String(formData.get("payment_method") ?? "");
  const couponCode = String(formData.get("coupon_code") ?? "").trim() || null;
  const idempotencyKey = String(formData.get("idempotency_key") ?? "").trim();
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!/^[a-z0-9-]{16,128}$/i.test(idempotencyKey)) return { error: "Please refresh checkout and try again." };
  if (paymentMethod !== "cod" && paymentMethod !== "online") return { error: "Choose a payment method." };
  if (addressMode === "saved" && !uuidPattern.test(addressId)) return { error: "Choose a delivery address." };

  const newAddress = addressMode === "new" ? {
    full_name: String(formData.get("new_full_name") ?? "").trim(),
    phone: String(formData.get("new_phone") ?? "").trim(),
    address_line1: String(formData.get("new_address_line1") ?? "").trim(),
    address_line2: String(formData.get("new_address_line2") ?? "").trim(),
    city: String(formData.get("new_city") ?? "").trim(),
    state: String(formData.get("new_state") ?? "").trim(),
    pincode: String(formData.get("new_pincode") ?? "").trim(),
  } : null;

  const { data, error } = await supabase.rpc("create_customer_order", {
    p_idempotency_key: idempotencyKey,
    p_address_id: addressMode === "saved" ? addressId : null,
    p_new_address: newAddress,
    p_payment_method: paymentMethod,
    p_coupon_code: couponCode,
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("stock")) return { error: "One or more products no longer have enough stock." };
    if (message.includes("coupon")) return { error: "That coupon is invalid or unavailable." };
    if (message.includes("address")) return { error: "Check your delivery address and try again." };
    if (message.includes("empty")) return { error: "Your cart is empty." };
    return { error: "We could not place the order. Please try again." };
  }
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/account/orders");
  return { orderId: String(data?.id ?? ""), orderNumber: String(data?.order_number ?? "") };
}

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const { supabase } = await requireUser();
  if (!productId || !Number.isInteger(quantity) || quantity < 1) throw new Error("Invalid cart request.");
  const { error } = await supabase.rpc("add_cart_item", { p_product_id: productId, p_quantity: quantity });
  if (error) throw new Error(error.message);
  revalidatePath("/cart");
  revalidatePath("/wishlist");
}

export async function buyNowAction(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const { supabase } = await requireUser("/checkout");
  if (!productId || !Number.isInteger(quantity) || quantity < 1) throw new Error("Invalid cart request.");
  const { error } = await supabase.rpc("add_cart_item", { p_product_id: productId, p_quantity: quantity });
  if (error) throw new Error(error.message);
  revalidatePath("/cart");
  redirect("/checkout");
}

export async function updateCartItemAction(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const { supabase } = await requireUser();
  if (!itemId || !Number.isInteger(quantity) || quantity < 1) throw new Error("Invalid quantity.");
  const { data: item } = await supabase.from("cart_items").select("id, cart_id, product:products(stock_quantity, minimum_order_quantity, is_published)").eq("id", itemId).maybeSingle();
  const product = Array.isArray(item?.product) ? item.product[0] : item?.product;
  if (!product?.is_published || quantity > Number(product.stock_quantity) || quantity < Number(product.minimum_order_quantity ?? 1)) throw new Error("Quantity is unavailable.");
  const { error } = await supabase.from("cart_items").update({ quantity, updated_at: new Date().toISOString() }).eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath("/cart");
}

export async function removeCartItemAction(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "");
  const { supabase } = await requireUser();
  const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath("/cart");
}

export async function clearCartAction() {
  const { supabase, user } = await requireUser();
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).maybeSingle();
  if (cart) await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  revalidatePath("/cart");
}

export async function addWishlistAction(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("wishlist").upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/wishlist");
  revalidatePath("/products");
}

export async function removeWishlistAction(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/wishlist");
  revalidatePath("/products");
}

export async function updateProfileAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/account/profile");
}

export async function saveAddressAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  const payload = { user_id: user.id, full_name: String(formData.get("full_name") ?? "").trim(), phone: String(formData.get("phone") ?? "").trim(), address_line1: String(formData.get("address_line1") ?? "").trim(), address_line2: String(formData.get("address_line2") ?? "").trim(), city: String(formData.get("city") ?? "").trim(), state: String(formData.get("state") ?? "").trim(), pincode: String(formData.get("pincode") ?? "").trim(), is_default: String(formData.get("is_default") ?? "") === "on" };
  if (payload.full_name.length < 2 || payload.full_name.length > 120 || !/^\+?[0-9\s-]{10,15}$/.test(payload.phone) || payload.address_line1.length < 3 || payload.address_line1.length > 240 || payload.city.length < 2 || payload.state.length < 2 || !/^\d{6}$/.test(payload.pincode)) throw new Error("Enter a valid full delivery address.");
  if (payload.is_default) await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  const result = id ? await supabase.from("addresses").update(payload).eq("id", id).eq("user_id", user.id) : await supabase.from("addresses").insert(payload);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/account/addresses");
}

export async function deleteAddressAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/account/addresses");
}
